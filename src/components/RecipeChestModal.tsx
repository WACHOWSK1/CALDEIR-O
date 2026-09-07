import React, { useState } from 'react';
import { Recipe, CraftMode } from '../types';
import confetti from 'canvas-confetti';
import { Sparkles, Dices, X, BookmarkCheck, PackageOpen, Award } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  allAlchemyRecipes: Recipe[];
  allGastroRecipes: Recipe[];
  discoveredRecipeIds: Set<string>;
  onUnlockRecipe: (recipe: Recipe) => void;
}

export const RecipeChestModal: React.FC<Props> = ({
  isOpen,
  onClose,
  allAlchemyRecipes,
  allGastroRecipes,
  discoveredRecipeIds,
  onUnlockRecipe
}) => {
  const [targetType, setTargetType] = useState<'todos' | 'alquimia' | 'cozinha'>('todos');
  const [chestTier, setChestTier] = useState<'qualquer' | 'comum' | 'raro' | 'lendario'>('qualquer');
  const [rolledRecipe, setRolledRecipe] = useState<Recipe | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  if (!isOpen) return null;

  const handleRollChest = () => {
    setIsRolling(true);
    setRolledRecipe(null);

    setTimeout(() => {
      // Pool determination
      let pool: Recipe[] = [];
      if (targetType === 'alquimia') pool = allAlchemyRecipes;
      else if (targetType === 'cozinha') pool = allGastroRecipes;
      else pool = [...allAlchemyRecipes, ...allGastroRecipes];

      // Tier filter based on ingredient complexity
      if (chestTier === 'comum') {
        pool = pool.filter(r => r.ingredients.length === 2);
      } else if (chestTier === 'raro') {
        pool = pool.filter(r => r.ingredients.length === 3);
      } else if (chestTier === 'lendario') {
        pool = pool.filter(r => r.ingredients.length === 4);
      }

      // Prioritize undiscovered recipes if any available
      const undiscovered = pool.filter(r => !discoveredRecipeIds.has(r.id));
      const finalPool = undiscovered.length > 0 ? undiscovered : pool;

      if (finalPool.length > 0) {
        const picked = finalPool[Math.floor(Math.random() * finalPool.length)];
        setRolledRecipe(picked);
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#c59341', '#f59e0b', '#38bdf8']
          });
        } catch (e) {}
      }

      setIsRolling(false);
    }, 450);
  };

  const handleLearn = () => {
    if (rolledRecipe) {
      onUnlockRecipe(rolledRecipe);
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
        style={{
          background: 'linear-gradient(180deg, #2b1f16 0%, #17110d 100%)',
          border: '2px solid #c59341',
          borderRadius: '16px',
          padding: '24px 22px',
          maxWidth: '540px',
          width: '100%',
          boxShadow: '0 10px 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(197, 147, 65, 0.15)',
          position: 'relative',
          textAlign: 'center'
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

        {/* Header Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'linear-gradient(90deg, #78350f 0%, #b45309 50%, #78350f 100%)',
          color: '#fef08a',
          padding: '4px 14px',
          borderRadius: '20px',
          fontSize: '0.78rem',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '10px'
        }}>
          <PackageOpen size={15} />
          Tesouro do Mestre • Sorteador de Pergaminhos
        </div>

        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.3rem',
          color: '#f5edd6',
          marginBottom: '6px'
        }}>
          Encontrar Pergaminho em Baú
        </h3>

        <p style={{ fontSize: '0.8rem', color: '#a89885', marginBottom: '14px', lineHeight: '1.3' }}>
          Sorteie fórmulas perdidas para presentear os jogadores ao abrirem baús de masmorras, derrotarem chefes ou encontrarem bibliotecas antigas.
        </p>

        {/* Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '16px',
          textAlign: 'left'
        }}>
          {/* Mode Selector */}
          <div>
            <label style={{ fontSize: '0.72rem', color: '#c59341', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Tipo de Arte:
            </label>
            <select
              value={targetType}
              onChange={e => setTargetType(e.target.value as any)}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: '#19130f',
                border: '1px solid #4a382a',
                borderRadius: '6px',
                color: '#ede3d1',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            >
              <option value="todos">✨ Alquimia & Culinária (Misto)</option>
              <option value="alquimia">⚗️ Apenas Alquimia Arcana</option>
              <option value="cozinha">🍳 Apenas Culinária Mágica</option>
            </select>
          </div>

          {/* Tier Selector */}
          <div>
            <label style={{ fontSize: '0.72rem', color: '#c59341', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Tipo de Baú / Raridade:
            </label>
            <select
              value={chestTier}
              onChange={e => setChestTier(e.target.value as any)}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: '#19130f',
                border: '1px solid #4a382a',
                borderRadius: '6px',
                color: '#ede3d1',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            >
              <option value="qualquer">🎲 Qualquer Raridade</option>
              <option value="comum">📦 Baú de Madeira (2 Ingredientes)</option>
              <option value="raro">🗝️ Baú de Ferro / Prata (3 Ingredientes)</option>
              <option value="lendario">👑 Baú Dourado / Relíquia (4 Ingredientes)</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRollChest}
          disabled={isRolling}
          style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(180deg, #c59341 0%, #8c6020 100%)',
            border: '1px solid #fde047',
            color: '#ffffff',
            borderRadius: '8px',
            fontFamily: 'var(--font-display)',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: isRolling ? 'wait' : 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}
        >
          <Dices size={18} />
          {isRolling ? 'Revirando o baú antigo...' : 'Sortear Pergaminho no Baú'}
        </button>

        {/* Rolled Recipe Display on Aged Parchment */}
        {rolledRecipe && (
          <div style={{
            background: '#ede1cb',
            color: '#2b211a',
            borderRadius: '10px',
            padding: '16px',
            border: '2px solid #bda889',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
            textAlign: 'left',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: '#2b2118',
                color: '#fef08a',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                📜 Pergaminho Encontrado
              </span>
              <span style={{ fontSize: '0.72rem', color: '#684d33', fontWeight: 600 }}>
                {rolledRecipe.category} ({rolledRecipe.ingredients.length} reagentes)
              </span>
            </div>

            <h4 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.15rem',
              fontWeight: 700,
              color: '#211710',
              marginBottom: '4px'
            }}>
              {rolledRecipe.name}
            </h4>

            <p style={{ fontSize: '0.84rem', color: '#3d3024', lineHeight: '1.4', marginBottom: '10px' }}>
              {rolledRecipe.effect}
            </p>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              marginBottom: '14px'
            }}>
              <span style={{ fontSize: '0.74rem', color: '#684d33', fontWeight: 600 }}>Fórmula:</span>
              {rolledRecipe.ingredients.map((ing, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '0.72rem',
                    background: 'rgba(0,0,0,0.08)',
                    color: '#2b211a',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(0,0,0,0.12)'
                  }}
                >
                  {ing}
                </span>
              ))}
            </div>

            <button
              onClick={handleLearn}
              style={{
                width: '100%',
                padding: '10px',
                background: '#166534',
                border: '1px solid #22c55e',
                color: '#ffffff',
                borderRadius: '6px',
                fontFamily: 'var(--font-display)',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <BookmarkCheck size={16} />
              Ensinar / Gravar no Grimório dos Jogadores
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
