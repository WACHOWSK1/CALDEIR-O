import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  FileText, 
  ShieldCheck, 
  AlertTriangle
} from 'lucide-react';
import { Ingredient, Recipe, ExperimentLog } from '../types';

interface BackupData {
  version: number;
  app: string;
  exportedAt: string;
  playerInventory: Ingredient[];
  discoveredRecipes: Recipe[];
  experimentHistory: ExperimentLog[];
  shopKitchen?: unknown;
  shopAlchemy?: unknown;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  playerInventory: Ingredient[];
  discoveredRecipes: Recipe[];
  experimentHistory: ExperimentLog[];
  onRestoreBackup: (backup: {
    playerInventory: Ingredient[];
    discoveredRecipes: Recipe[];
    experimentHistory: ExperimentLog[];
  }) => void;
}

export const BackupModal: React.FC<Props> = ({
  isOpen,
  onClose,
  playerInventory,
  discoveredRecipes,
  experimentHistory,
  onRestoreBackup
}) => {
  const [copied, setCopied] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Generate backup payload
  const createBackupPayload = (): BackupData => {
    let shopKitchen = null;
    let shopAlchemy = null;
    try {
      const k = localStorage.getItem('caldeiro_shop_cozinha_v2');
      if (k) shopKitchen = JSON.parse(k);
      const a = localStorage.getItem('caldeiro_shop_alquimia_v2');
      if (a) shopAlchemy = JSON.parse(a);
    } catch {
      // Ignore shop parse failures
    }

    return {
      version: 1,
      app: 'CALDEIRAO_RPG_TORMENTA20',
      exportedAt: new Date().toISOString(),
      playerInventory: [...playerInventory].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })),
      discoveredRecipes: [...discoveredRecipes].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })),
      experimentHistory,
      shopKitchen,
      shopAlchemy
    };
  };

  // Download backup as .json file
  const handleDownloadBackup = () => {
    const data = createBackupPayload();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `caldeirao_backup_${dateStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setImportSuccess('Arquivo de backup baixado com sucesso!');
    setTimeout(() => setImportSuccess(null), 3500);
  };

  // Copy backup code to clipboard
  const handleCopyBackup = async () => {
    try {
      const data = createBackupPayload();
      const jsonStr = JSON.stringify(data);
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      setImportSuccess('Código de backup copiado para a área de transferência!');
      setTimeout(() => setImportSuccess(null), 3500);
    } catch {
      setImportError('Não foi possível copiar automaticamente. Use a opção de baixar arquivo.');
      setTimeout(() => setImportError(null), 4000);
    }
  };

  // Validate and parse backup JSON
  const validateAndApply = (jsonText: string) => {
    setImportError(null);
    try {
      const parsed = JSON.parse(jsonText.trim());

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Formato de backup inválido.');
      }

      if (!Array.isArray(parsed.playerInventory) && !Array.isArray(parsed.discoveredRecipes)) {
        throw new Error('Arquivo de backup incompatível ou corrompido.');
      }

      const inv: Ingredient[] = Array.isArray(parsed.playerInventory) ? parsed.playerInventory : [];
      const rec: Recipe[] = Array.isArray(parsed.discoveredRecipes) ? parsed.discoveredRecipes : [];
      const hist: ExperimentLog[] = Array.isArray(parsed.experimentHistory) ? parsed.experimentHistory : [];

      // Restore shops if present
      if (parsed.shopKitchen) {
        try {
          localStorage.setItem('caldeiro_shop_cozinha_v2', JSON.stringify(parsed.shopKitchen));
        } catch {
          // ignore
        }
      }
      if (parsed.shopAlchemy) {
        try {
          localStorage.setItem('caldeiro_shop_alquimia_v2', JSON.stringify(parsed.shopAlchemy));
        } catch {
          // ignore
        }
      }

      onRestoreBackup({
        playerInventory: inv,
        discoveredRecipes: rec,
        experimentHistory: hist
      });

      setImportSuccess(`Progresso restaurado com sucesso! (${inv.length} tipos de itens e ${rec.length} receitas)`);
      setTimeout(() => {
        setImportSuccess(null);
        onClose();
      }, 1600);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao processar arquivo.';
      setImportError(`Falha ao restaurar: ${message}`);
    }
  };

  // Handle file input upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        validateAndApply(content);
      }
    };
    reader.onerror = () => {
      setImportError('Erro ao ler o arquivo selecionado.');
    };
    reader.readAsText(file);

    // Reset input so same file can be chosen again if needed
    e.target.value = '';
  };

  const totalUnits = playerInventory.reduce((acc, curr) => acc + (curr.quantity || 1), 0);

  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 4, 3, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        className="modal-dialog-card"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #241a12 0%, #16100c 100%)',
          border: '1px solid #c59341',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 48px rgba(0,0,0,0.85), 0 0 30px rgba(197, 147, 65, 0.2)',
          position: 'relative',
          overflowY: 'auto'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid #4a382a',
            color: '#a89885',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Fechar janela"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            fontSize: '24px',
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: '#150f0b',
            border: '1px solid #c59341',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(197, 147, 65, 0.25)'
          }}>
            💾
          </div>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              color: '#f5edd6',
              letterSpacing: '0.5px'
            }}>
              Backup & Transferência
            </h2>
            <p style={{ fontSize: '0.76rem', color: '#a89885', marginTop: '2px' }}>
              Guarde seu progresso com segurança ou transfira entre computador e celular.
            </p>
          </div>
        </div>

        {/* Status Pills of Current Data */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid #3d2c20',
          borderRadius: '8px',
          padding: '10px 12px',
          marginBottom: '18px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#8c7a68', textTransform: 'uppercase' }}>Mochila</span>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fef08a' }}>
              {playerInventory.length} <span style={{ fontSize: '0.7rem', fontWeight: 'normal' }}>({totalUnits} un)</span>
            </div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid #3d2c20', borderRight: '1px solid #3d2c20' }}>
            <span style={{ fontSize: '0.65rem', color: '#8c7a68', textTransform: 'uppercase' }}>Fórmulas</span>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#c084fc' }}>
              {discoveredRecipes.length} <span style={{ fontSize: '0.7rem', fontWeight: 'normal' }}>aprendidas</span>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#8c7a68', textTransform: 'uppercase' }}>Histórico</span>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#6ee7b7' }}>
              {experimentHistory.length} <span style={{ fontSize: '0.7rem', fontWeight: 'normal' }}>testes</span>
            </div>
          </div>
        </div>

        {/* Alerts Feedback */}
        {importError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '14px'
          }}>
            <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{importError}</span>
          </div>
        )}

        {importSuccess && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid #22c55e',
            color: '#86efac',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '14px'
          }}>
            <Check size={16} color="#22c55e" style={{ flexShrink: 0 }} />
            <span>{importSuccess}</span>
          </div>
        )}

        {/* Main Action Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 1. EXPORT SECTION */}
          <div style={{
            background: 'rgba(18, 14, 11, 0.65)',
            border: '1px solid #3d2f23',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Download size={16} color="#facc15" />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.94rem', color: '#f5edd6' }}>
                1. Salvar / Exportar Progresso
              </h3>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#9c8975', marginBottom: '12px', lineHeight: 1.35 }}>
              Baixe um arquivo de backup ou copie o código para guardar ou enviar para o seu celular.
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleDownloadBackup}
                style={{
                  flex: '1 1 180px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: 'linear-gradient(180deg, #c59341 0%, #8c5d1b 100%)',
                  color: '#ffffff',
                  border: '1px solid #facc15',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  transition: 'all 0.15s'
                }}
              >
                <Download size={15} />
                <span>Baixar Arquivo .JSON</span>
              </button>

              <button
                type="button"
                onClick={handleCopyBackup}
                style={{
                  flex: '1 1 160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.4)',
                  color: copied ? '#86efac' : '#d4c8b8',
                  border: copied ? '1px solid #22c55e' : '1px solid #4a382a',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>
          </div>

          {/* 2. IMPORT SECTION */}
          <div style={{
            background: 'rgba(18, 14, 11, 0.65)',
            border: '1px solid #3d2f23',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Upload size={16} color="#60a5fa" />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.94rem', color: '#f5edd6' }}>
                2. Restaurar / Carregar Progresso
              </h3>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#9c8975', marginBottom: '12px', lineHeight: 1.35 }}>
              Carregue o arquivo baixado anteriormente ou cole o código para restaurar tudo instantaneamente.
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: showPasteArea ? '10px' : '0' }}>
              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".json,application/json" 
                style={{ display: 'none' }} 
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: '1 1 180px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: '1px solid #60a5fa',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  transition: 'all 0.15s'
                }}
              >
                <Upload size={15} />
                <span>Carregar Arquivo .JSON</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPasteArea(!showPasteArea)}
                style={{
                  flex: '1 1 160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: 'transparent',
                  color: '#d4c8b8',
                  border: '1px solid #4a382a',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <FileText size={15} />
                <span>{showPasteArea ? 'Ocultar Texto' : 'Colar Código'}</span>
              </button>
            </div>

            {/* Paste Text Area (Collapsible) */}
            {showPasteArea && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  placeholder="Cole aqui o texto do código de backup..."
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    background: '#100c09',
                    border: '1px solid #4a382a',
                    borderRadius: '6px',
                    padding: '8px',
                    color: '#e5dec9',
                    fontSize: '0.74rem',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  disabled={!pasteText.trim()}
                  onClick={() => validateAndApply(pasteText)}
                  style={{
                    alignSelf: 'flex-end',
                    padding: '8px 18px',
                    background: pasteText.trim() ? '#15803d' : '#27201a',
                    color: pasteText.trim() ? '#ffffff' : '#6c5c4d',
                    border: pasteText.trim() ? '1px solid #22c55e' : '1px solid #3d2f23',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: pasteText.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s'
                  }}
                >
                  Restaurar deste Texto
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Golden Rules / Safe Play Tips */}
        <div style={{
          marginTop: '16px',
          background: 'rgba(0,0,0,0.2)',
          borderLeft: '3px solid #c59341',
          padding: '8px 12px',
          borderRadius: '0 6px 6px 0',
          fontSize: '0.72rem',
          color: '#a89885',
          lineHeight: 1.4
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fef08a', fontWeight: 600, marginBottom: '2px' }}>
            <ShieldCheck size={14} color="#facc15" />
            <span>Dicas para não perder seus dados:</span>
          </div>
          • Evite jogar em guias anônimas (elas apagam tudo ao fechar).<br />
          • No celular, use <b>"Adicionar à Tela de Início"</b> para criar um app persistente e protegido.<br />
          • Salve um backup periodicamente ou quando for trocar de dispositivo.
        </div>
      </div>
    </div>
  );
};
