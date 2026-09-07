import React from 'react';
import { CraftMode } from '../types';
import { Sparkles, Utensils, Compass, RotateCcw } from 'lucide-react';

interface Props {
  mode: CraftMode;
  onToggleMode: (mode: CraftMode) => void;
  discoveredCount: number;
  totalRecipes: number;
  onOpenCollector: () => void;
  onResetCauldron: () => void;
}

export const WorkbenchHeader: React.FC<Props> = ({
  mode,
  onToggleMode,
  discoveredCount,
  totalRecipes,
  onOpenCollector,
  onResetCauldron
}) => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 20px',
      marginBottom: '16px',
      background: 'linear-gradient(180deg, #241c16 0%, #171310 100%)',
      border: '1px solid #4a382a',
      borderRadius: '10px',
      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08), 0 6px 18px rgba(0,0,0,0.7)'
    }}>
      {/* Brand & Ambience */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{
          fontSize: '26px',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))'
        }}>
          {mode === 'alquimia' ? '⚗️' : '🍳'}
        </div>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.35rem',
            color: '#f5edd6',
            letterSpacing: '1px',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap'
          }}>
            CALDEIR-O <span style={{ fontSize: '0.8rem', color: '#c59341', fontWeight: 'normal', fontFamily: 'var(--font-ui)' }}>| Bancada de RPG</span>
          </h1>
          <p style={{
            fontSize: '0.74rem',
            color: '#a89885',
            marginTop: '2px',
            fontFamily: 'var(--font-flavor)'
          }}>
            {mode === 'alquimia' 
              ? 'Laboratório Arcano • Transmutações e Poções (Tormenta 20)'
              : 'Cozinha Mágica • Ensopados e Benefícios (Tormenta 20)'}
          </p>
        </div>
      </div>

      {/* Mode Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#120f0d',
        padding: '4px',
        borderRadius: '8px',
        border: '1px solid #3d2f23'
      }}>
        <button
          onClick={() => onToggleMode('alquimia')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontFamily: 'var(--font-display)',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: mode === 'alquimia' ? 'linear-gradient(180deg, #9333ea 0%, #6b21a8 100%)' : 'transparent',
            color: mode === 'alquimia' ? '#ffffff' : '#9ca3af',
            boxShadow: mode === 'alquimia' ? '0 0 14px rgba(147, 51, 234, 0.4)' : 'none'
          }}
        >
          <Sparkles size={16} />
          Alquimia Arcana
        </button>

        <button
          onClick={() => onToggleMode('cozinha')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontFamily: 'var(--font-display)',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: mode === 'cozinha' ? 'linear-gradient(180deg, #ea580c 0%, #c2410c 100%)' : 'transparent',
            color: mode === 'cozinha' ? '#ffffff' : '#9ca3af',
            boxShadow: mode === 'cozinha' ? '0 0 14px rgba(234, 88, 12, 0.4)' : 'none'
          }}
        >
          <Utensils size={16} />
          Cozinha Mágica
        </button>
      </div>

      {/* Auxiliary Actions & Tracker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Biome Collector Button */}
        <button
          onClick={onOpenCollector}
          title="Coletar ingredientes em biomas de Tormenta 20"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 13px',
            background: '#231b15',
            color: '#e5d7ba',
            border: '1px solid #5a4430',
            borderRadius: '6px',
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Compass size={16} color="#c59341" />
          <span>Biomas / Coletor</span>
        </button>

        {/* Discovery Counter Badge */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          padding: '4px 10px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '6px',
          border: '1px solid #38291e'
        }}>
          <span style={{ fontSize: '0.68rem', color: '#a39281', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Descobertas
          </span>
          <span style={{ fontSize: '0.92rem', color: '#c59341', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            {discoveredCount} / {totalRecipes}
          </span>
        </div>

        {/* Quick Reset */}
        <button
          onClick={onResetCauldron}
          title="Limpar ingredientes do caldeirão"
          style={{
            background: 'transparent',
            border: '1px solid #4a382a',
            color: '#a39281',
            padding: '8px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </header>
  );
};
