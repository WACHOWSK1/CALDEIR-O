import React, { useState } from 'react';
import biomesData from '../data/biomes.json';
import { Compass, Dices, X, Plus } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddGatheredItems: (itemNames: string[]) => void;
}

export const BiomeCollectorModal: React.FC<Props> = ({ isOpen, onClose, onAddGatheredItems }) => {
  const biomes = biomesData.biomas;
  const poolPorBioma = biomesData.poolPorBioma as Record<string, string[]>;

  const [selectedBiome, setSelectedBiome] = useState(biomes[0]);
  const [rolledItems, setRolledItems] = useState<string[]>([]);
  const [hasRolled, setHasRolled] = useState(false);

  if (!isOpen) return null;

  // Exact probability table from COLETOR:
  // 1:40% • 2:25% • 3:20% • 4:10% • 5:5%
  const rollQuantity = () => {
    const r = Math.random();
    if (r < 0.40) return 1;
    if (r < 0.65) return 2;
    if (r < 0.85) return 3;
    if (r < 0.95) return 4;
    return 5;
  };

  const handleRoll = () => {
    const pool = poolPorBioma[selectedBiome] || [];
    if (pool.length === 0) return;

    const qty = rollQuantity();
    const uniquePool = [...new Set(pool)];
    // Shuffle
    const shuffled = [...uniquePool].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, Math.min(qty, shuffled.length));
    setRolledItems(picked);
    setHasRolled(true);
  };

  const handleConfirmAdd = () => {
    if (rolledItems.length > 0) {
      onAddGatheredItems(rolledItems);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="modal-dialog-card"
        style={{
          background: 'linear-gradient(180deg, #241a13 0%, #15100d 100%)',
          border: '1px solid #6b523b',
          borderRadius: '14px',
          padding: '24px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.08)',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Compass size={22} color="#c59341" />
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            color: '#f5edd6',
            letterSpacing: '0.5px'
          }}>
            Coleta nos Biomas de Tormenta 20
          </h3>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#a89885', marginBottom: '16px' }}>
          Selecione o bioma onde o grupo está explorando e role o teste de sobrevivência/coleta para encontrar reagentes e provisões.
        </p>

        {/* Biome Selection Pills */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          maxHeight: '150px',
          overflowY: 'auto',
          padding: '8px',
          background: '#14100d',
          borderRadius: '8px',
          border: '1px solid #3d2c20',
          marginBottom: '16px'
        }}>
          {biomes.map(b => (
            <button
              key={b}
              onClick={() => {
                setSelectedBiome(b);
                setHasRolled(false);
                setRolledItems([]);
              }}
              style={{
                fontSize: '0.74rem',
                padding: '5px 10px',
                borderRadius: '5px',
                border: selectedBiome === b ? '1px solid #c59341' : '1px solid #2d2118',
                background: selectedBiome === b ? '#3b291d' : '#1a1410',
                color: selectedBiome === b ? '#fef08a' : '#baa995',
                cursor: 'pointer',
                transition: 'all 0.12s'
              }}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Action Button: Roll */}
        <button
          onClick={handleRoll}
          style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(180deg, #b8863b 0%, #855818 100%)',
            border: '1px solid #facc15',
            color: '#ffffff',
            borderRadius: '8px',
            fontFamily: 'var(--font-display)',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(184, 134, 59, 0.4)',
            marginBottom: '16px'
          }}
        >
          <Dices size={18} />
          Rolar Coleta em "{selectedBiome}"
        </button>

        {/* Rolled Results */}
        {hasRolled && (
          <div style={{
            background: '#16110e',
            border: '1px solid #4a382a',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.76rem', color: '#c59341', fontWeight: 600, textTransform: 'uppercase' }}>
                Itens Encontrados ({rolledItems.length})
              </span>
              <span style={{ fontSize: '0.72rem', color: '#8c7d6d' }}>Adicionar ao estoque</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {rolledItems.map((name, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    background: '#221913',
                    borderRadius: '5px',
                    border: '1px solid #382a1f',
                    color: '#ede3d1',
                    fontSize: '0.82rem'
                  }}
                >
                  <span>🌿</span>
                  <span style={{ fontWeight: 600 }}>{name}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleConfirmAdd}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '9px',
                background: '#166534',
                color: '#ffffff',
                border: '1px solid #22c55e',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Plus size={16} /> Guardar na Mochila / Prateleira
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
