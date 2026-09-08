import React, { useEffect } from 'react';
import { Recipe } from '../types';
import confetti from 'canvas-confetti';
import { Sparkles, Check, BookmarkCheck } from 'lucide-react';

interface Props {
  recipe: Recipe | null;
  onClose: () => void;
}

export const DiscoveryModal: React.FC<Props> = ({ recipe, onClose }) => {
  useEffect(() => {
    if (recipe) {
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#c59341', '#38bdf8', '#a855f7', '#f59e0b', '#22c55e']
        });
      } catch (e) {}
    }
  }, [recipe]);

  if (!recipe) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="discovery-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
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
          background: 'linear-gradient(180deg, #2b1f16 0%, #17110d 100%)',
          border: '2px solid #eab308',
          borderRadius: '16px',
          padding: '28px 24px',
          maxWidth: '480px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 0 50px rgba(234, 179, 8, 0.5), inset 0 0 30px rgba(0,0,0,0.8)',
          textAlign: 'center',
          position: 'relative',
          animation: 'reactionFlash 0.6s ease-out'
        }}
      >
        {/* Banner */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'linear-gradient(90deg, #854d0e 0%, #ca8a04 50%, #854d0e 100%)',
          color: '#fef08a',
          padding: '6px 18px',
          borderRadius: '20px',
          fontSize: '0.82rem',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '16px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
        }}>
          <Sparkles size={16} />
          Nova Descoberta Revelada!
        </div>

        {/* Item Icon */}
        <div style={{
          width: '74px',
          height: '74px',
          margin: '0 auto 16px',
          background: 'radial-gradient(circle, #3d2c1e 0%, #15100c 100%)',
          borderRadius: '50%',
          border: '2px solid #eab308',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          boxShadow: '0 0 20px rgba(234, 179, 8, 0.4)'
        }}>
          {recipe.category.includes('Óleo') ? '🫙' :
           recipe.category.includes('Veneno') ? '☠️' :
           recipe.category.includes('Bálsamo') ? '🧴' :
           recipe.category.includes('Sopa') || recipe.category.includes('Caldeirada') ? '🍲' :
           recipe.category.includes('Ensopado') ? '🥘' :
           recipe.category.includes('Pão') ? '🍞' : '🧪'}
        </div>

        {/* Recipe Title */}
        <h3 
          id="discovery-title"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.45rem',
            color: '#fef08a',
            marginBottom: '6px',
            textShadow: '0 2px 4px rgba(0,0,0,0.9)'
          }}
        >
          {recipe.name}
        </h3>

        <span style={{
          display: 'inline-block',
          fontSize: '0.74rem',
          color: '#c59341',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          {recipe.category} • Tormenta 20
        </span>

        {/* Effect Description on Aged Parchment */}
        <div style={{
          background: '#ede1cb',
          color: '#261b12',
          padding: '14px 16px',
          borderRadius: '8px',
          border: '1px solid #c4b397',
          textAlign: 'left',
          marginBottom: '18px',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)'
        }}>
          <span style={{
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: '#785b3e',
            display: 'block',
            marginBottom: '4px'
          }}>
            Efeito & Benefícios de RPG:
          </span>
          <p style={{
            fontSize: '0.88rem',
            lineHeight: '1.4',
            fontFamily: 'var(--font-ui)'
          }}>
            {recipe.effect}
          </p>
        </div>

        {/* Formula Used */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '0.74rem', color: '#a89885' }}>Fórmula:</span>
          {recipe.ingredients.map((ing, i) => (
            <span
              key={i}
              style={{
                fontSize: '0.72rem',
                background: '#1f1813',
                color: '#e5dec9',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid #4a382a'
              }}
            >
              {ing}
            </span>
          ))}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(180deg, #ca8a04 0%, #854d0e 100%)',
            color: '#ffffff',
            border: '1px solid #fde047',
            borderRadius: '8px',
            fontFamily: 'var(--font-display)',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <BookmarkCheck size={18} />
          Gravar no Grimório e Continuar
        </button>
      </div>
    </div>
  );
};
