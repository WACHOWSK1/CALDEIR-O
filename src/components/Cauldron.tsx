import React, { useState } from 'react';
import { Ingredient, CauldronState, CraftMode } from '../types';
import { Flame, Sparkles, X, RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  mode: CraftMode;
  cauldronState: CauldronState;
  slottedIngredients: Ingredient[];
  isKnownFailure?: boolean;
  onRemoveIngredient: (index: number) => void;
  onCombine: () => void;
  onReset: () => void;
  onDropIngredient: (ingredient: Ingredient) => void;
}

export const Cauldron: React.FC<Props> = ({
  mode,
  cauldronState,
  slottedIngredients,
  isKnownFailure = false,
  onRemoveIngredient,
  onCombine,
  onReset,
  onDropIngredient
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isStirring, setIsStirring] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const item = JSON.parse(data) as Ingredient;
        onDropIngredient(item);
      }
    } catch (err) {
      console.error('Erro ao ler item arrastado:', err);
    }
  };

  const handleStir = () => {
    setIsStirring(true);
    setTimeout(() => setIsStirring(false), 800);
  };

  // Determine liquid color and glow
  const getLiquidTheme = () => {
    if (cauldronState === 'unstable') {
      return {
        surface: 'radial-gradient(ellipse at 50% 40%, #451a03 0%, #1c0a00 80%)',
        glow: 'rgba(180, 83, 9, 0.4)',
        bubbles: '#78350f',
        startColor: '#78350f',
        midColor: '#451a03',
        endColor: '#1c0a00'
      };
    }
    if (cauldronState === 'reacting') {
      return {
        surface: 'radial-gradient(ellipse at 50% 40%, #eab308 0%, #7e22ce 60%, #1e1b4b 100%)',
        glow: 'rgba(234, 179, 8, 0.7)',
        bubbles: '#fef08a',
        startColor: '#facc15',
        midColor: '#9333ea',
        endColor: '#1e1b4b'
      };
    }
    if (mode === 'alquimia') {
      if (slottedIngredients.length === 0) {
        return {
          surface: 'radial-gradient(ellipse at 50% 40%, #312e81 0%, #1e1b4b 55%, #0f172a 100%)',
          glow: 'rgba(99, 102, 241, 0.35)',
          bubbles: '#818cf8',
          startColor: '#4338ca',
          midColor: '#1e1b4b',
          endColor: '#0f172a'
        };
      }
      return {
        surface: 'radial-gradient(ellipse at 50% 40%, #7e22ce 0%, #3b0764 60%, #180327 100%)',
        glow: 'rgba(168, 85, 247, 0.5)',
        bubbles: '#c084fc',
        startColor: '#9333ea',
        midColor: '#581c87',
        endColor: '#180327'
      };
    } else {
      if (slottedIngredients.length === 0) {
        return {
          surface: 'radial-gradient(ellipse at 50% 40%, #78350f 0%, #451a03 60%, #1c0a00 100%)',
          glow: 'rgba(217, 119, 6, 0.35)',
          bubbles: '#fbbf24',
          startColor: '#b45309',
          midColor: '#451a03',
          endColor: '#1c0a00'
        };
      }
      return {
        surface: 'radial-gradient(ellipse at 50% 40%, #c2410c 0%, #7c2d12 60%, #270b03 100%)',
        glow: 'rgba(234, 88, 12, 0.55)',
        bubbles: '#fdba74',
        startColor: '#ea580c',
        midColor: '#7c2d12',
        endColor: '#270b03'
      };
    }
  };

  const liquid = getLiquidTheme();

  const getItemEmoji = (cat: string) => {
    if (cat.includes('Criatura') || cat.includes('Osso')) return '🦴';
    if (cat.includes('Erva') || cat.includes('Raiz')) return '🌿';
    if (cat.includes('Flor')) return '🌸';
    if (cat.includes('Fungo') || cat.includes('Cogumelo')) return '🍄';
    if (cat.includes('Mineral') || cat.includes('Cristal')) return '💎';
    if (cat.includes('Líquido') || cat.includes('Óleo')) return '🧪';
    if (cat.includes('Essência')) return '✨';
    if (cat.includes('Alimento') || cat.includes('Proteína')) return '🥩';
    if (cat.includes('Tempero') || cat.includes('Pimenta')) return '🌶️';
    return '📦';
  };

  return (
    <section 
      aria-label="Bancada Central e Caldeirão"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'radial-gradient(circle at 50% 50%, #221a15 0%, #14100d 85%)',
        border: '1px solid #3d2c20',
        borderRadius: '12px',
        padding: '12px 14px 10px',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.6)',
        position: 'relative'
      }}
    >
      {/* Tabletop Atmosphere Ambient Indicators */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0 8px',
        marginBottom: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: cauldronState === 'reacting' ? '#eab308' : cauldronState === 'unstable' ? '#ef4444' : '#22c55e',
            boxShadow: `0 0 8px ${cauldronState === 'reacting' ? '#eab308' : '#22c55e'}`
          }} />
          <span style={{ fontSize: '0.76rem', color: '#c5b59e', fontFamily: 'var(--font-flavor)' }}>
            {isStirring && '🌀 Mexendo a infusão mística...'}
            {!isStirring && cauldronState === 'idle' && (
              slottedIngredients.length === 0 
                ? (mode === 'alquimia' ? 'Bancada pronta • Adicione ao menos 2 reagentes' : 'Fogão pronto • Adicione mantimentos ou ingredientes')
                : mode === 'cozinha' && slottedIngredients.length === 1
                  ? '1 mantimento na panela • Pronto para refeição simples'
                  : `${slottedIngredients.length}/4 ingredientes no caldeirão`
            )}
            {!isStirring && cauldronState === 'receiving' && 'Recebendo ingrediente...'}
            {!isStirring && cauldronState === 'reacting' && '✨ Transmutação alquímica em andamento!'}
            {!isStirring && cauldronState === 'success' && '🌟 Sucesso! Uma nova criação reluz!'}
            {!isStirring && cauldronState === 'unstable' && '⚠️ Reação falhou! Mistura instável!'}
          </span>
        </div>

        {/* Ambient Forge Embers Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Flame size={14} color="#f97316" />
          <span style={{ fontSize: '0.74rem', color: '#f59e0b', fontFamily: 'var(--font-flavor)' }}>
            Fogareiro Aceso
          </span>
        </div>
      </div>

      {/* Steam Effect rising from cauldron */}
      <div style={{
        position: 'relative',
        width: '260px',
        height: '24px',
        pointerEvents: 'none',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          left: '25%',
          bottom: '0',
          width: '45px',
          height: '24px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(235, 220, 200, 0.35) 0%, transparent 70%)',
          animation: 'steamDrift 3.4s infinite ease-in-out'
        }} />
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: '0',
          width: '55px',
          height: '24px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220, 210, 240, 0.4) 0%, transparent 70%)',
          animation: 'steamDrift 2.8s infinite 0.9s ease-in-out'
        }} />
        <div style={{
          position: 'absolute',
          left: '70%',
          bottom: '0',
          width: '40px',
          height: '20px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(240, 230, 210, 0.3) 0%, transparent 70%)',
          animation: 'steamDrift 3.8s infinite 1.8s ease-in-out'
        }} />
      </div>

      {/* ========================================================
          THE HERO CAULDRON (SVG + Volumetric Fluid Interaction)
         ======================================================== */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: 'relative',
          width: '270px',
          height: '195px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragOver ? 'copy' : 'default',
          transition: 'transform 0.2s ease',
          transform: isDragOver ? 'scale(1.02)' : 'scale(1)'
        }}
      >
        {/* SVG Detailed Cauldron Body */}
        <svg 
          viewBox="0 0 340 290" 
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            filter: isDragOver 
              ? 'drop-shadow(0 0 25px rgba(234, 179, 8, 0.6))' 
              : 'drop-shadow(0 15px 25px rgba(0,0,0,0.9))'
          }}
        >
          <defs>
            {/* Iron Texture Linear Gradient */}
            <linearGradient id="ironBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3c3732" />
              <stop offset="30%" stopColor="#252220" />
              <stop offset="70%" stopColor="#171514" />
              <stop offset="100%" stopColor="#0c0b0a" />
            </linearGradient>

            {/* Bronze Rim & Trim */}
            <linearGradient id="bronzeTrim" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7a5522" />
              <stop offset="25%" stopColor="#dca854" />
              <stop offset="50%" stopColor="#966a2c" />
              <stop offset="75%" stopColor="#eec16e" />
              <stop offset="100%" stopColor="#68471c" />
            </linearGradient>

            {/* Fire glow under cauldron */}
            <radialGradient id="forgeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ea580c" stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>

            {/* Liquid Surface Radial Gradient */}
            <radialGradient id="cauldronLiquidGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor={liquid.startColor} />
              <stop offset="55%" stopColor={liquid.midColor} />
              <stop offset="100%" stopColor={liquid.endColor} />
            </radialGradient>

            {/* Liquid Surface Clip Path inside Mouth */}
            <clipPath id="cauldronLiquidClip">
              <ellipse cx="170" cy="85" rx="113" ry="27" />
            </clipPath>
          </defs>

          {/* Under-Cauldron Fire Stones */}
          <ellipse cx="170" cy="275" rx="110" ry="14" fill="url(#forgeGlow)" style={{ animation: 'flamePulse 2s infinite ease-in-out' }} />

          {/* Cauldron Tripod Legs */}
          <path d="M 90 230 Q 75 270 65 285 L 85 285 Q 95 265 105 235 Z" fill="#181615" stroke="#332e29" strokeWidth="1.5" />
          <path d="M 250 230 Q 265 270 275 285 L 255 285 Q 245 265 235 235 Z" fill="#181615" stroke="#332e29" strokeWidth="1.5" />
          <path d="M 165 245 L 175 245 L 173 283 L 167 283 Z" fill="#12100e" stroke="#2b2622" strokeWidth="1.5" />

          {/* Sturdy Side Bronze Handles */}
          <g>
            {/* Left Handle */}
            <path d="M 42 125 C 10 125 10 170 45 170" fill="none" stroke="url(#bronzeTrim)" strokeWidth="9" strokeLinecap="round" />
            <circle cx="45" cy="147" r="7" fill="#7a5522" stroke="#dca854" strokeWidth="1.5" />
            {/* Right Handle */}
            <path d="M 298 125 C 330 125 330 170 295 170" fill="none" stroke="url(#bronzeTrim)" strokeWidth="9" strokeLinecap="round" />
            <circle cx="295" cy="147" r="7" fill="#7a5522" stroke="#dca854" strokeWidth="1.5" />
          </g>

          {/* Main Belly of the Cauldron */}
          <path 
            d="M 55 90 
               C 35 150 40 235 170 248 
               C 300 235 305 150 285 90 
               Z" 
            fill="url(#ironBody)" 
            stroke="#474039" 
            strokeWidth="2" 
          />

          {/* Ornate Bronze Belly Band */}
          <path 
            d="M 52 145 C 100 175 240 175 288 145 L 285 158 C 240 188 100 188 55 158 Z" 
            fill="url(#bronzeTrim)" 
            opacity="0.85" 
          />

          {/* Arcane Symbols stamped on the band */}
          <text x="100" y="165" fill="#261705" fontSize="11" fontFamily="sans-serif">ᚱ</text>
          <text x="135" y="172" fill="#261705" fontSize="11" fontFamily="sans-serif">ᛉ</text>
          <text x="170" y="174" fill="#261705" fontSize="12" fontFamily="sans-serif">🜂</text>
          <text x="205" y="172" fill="#261705" fontSize="11" fontFamily="sans-serif">ᛟ</text>
          <text x="240" y="165" fill="#261705" fontSize="11" fontFamily="sans-serif">ᚦ</text>

          {/* Heavy Cast Iron Rim (Outer Rim of Mouth) */}
          <ellipse cx="170" cy="85" rx="122" ry="34" fill="#252220" stroke="url(#bronzeTrim)" strokeWidth="4" />
          <ellipse cx="170" cy="85" rx="114" ry="28" fill="#141211" stroke="#4a423a" strokeWidth="2" />

          {/* Volumetric Liquid Surface (100% Mathematically Locked to Mouth) */}
          <g clipPath="url(#cauldronLiquidClip)" onClick={handleStir} style={{ cursor: 'pointer' }}>
            {/* Liquid Radial Glow Background */}
            <ellipse cx="170" cy="85" rx="113" ry="27" fill="url(#cauldronLiquidGrad)" />

            {/* Swirling ripples */}
            <ellipse
              cx="170"
              cy="85"
              rx="88"
              ry="20"
              fill="none"
              stroke={liquid.bubbles}
              strokeWidth="1.5"
              strokeDasharray="6 6"
              opacity="0.45"
              style={{
                transformOrigin: '170px 85px',
                animation: isStirring ? 'spin 1s infinite linear' : 'spin 18s infinite linear'
              }}
            />

            {/* Animated Bubbles */}
            <circle cx="125" cy="89" r="4.5" fill={liquid.bubbles} opacity="0.8" style={{ animation: 'bubbleFloat 2.1s infinite ease-in' }} />
            <circle cx="165" cy="93" r="6" fill={liquid.bubbles} opacity="0.75" style={{ animation: 'bubbleFloat 2.7s infinite 0.7s ease-in' }} />
            <circle cx="210" cy="88" r="3.5" fill={liquid.bubbles} opacity="0.8" style={{ animation: 'bubbleFloat 1.8s infinite 1.2s ease-in' }} />
            <circle cx="145" cy="83" r="5" fill={liquid.bubbles} opacity="0.85" style={{ animation: 'bubbleFloat 2.4s infinite 0.4s ease-in' }} />
            <circle cx="185" cy="86" r="4.5" fill={liquid.bubbles} opacity="0.7" style={{ animation: 'bubbleFloat 2.2s infinite 1.5s ease-in' }} />
          </g>

          {/* Heavy Cast Iron Rim Inner Overlay (Bronze Trim Highlight on Front Lip) */}
          <ellipse cx="170" cy="85" rx="114" ry="28" fill="none" stroke="url(#bronzeTrim)" strokeWidth="1.5" opacity="0.6" style={{ pointerEvents: 'none' }} />
        </svg>

        {/* Drop Invitation Label when drag-over */}
        {isDragOver && (
          <div style={{
            position: 'absolute',
            top: '40px',
            zIndex: 20,
            background: 'rgba(26, 18, 12, 0.95)',
            border: '1px solid #eab308',
            color: '#fef08a',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(0,0,0,0.8)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Sparkles size={14} />
            Solte para mergulhar no caldeirão
          </div>
        )}
      </div>

      {/* ========================================================
          CAULDRON INGREDIENT SLOTS (2 to 4 Slots clearly visible)
         ======================================================== */}
      <div style={{
        width: '100%',
        marginTop: '6px',
        background: 'rgba(16, 12, 10, 0.75)',
        border: '1px solid #3d2c20',
        borderRadius: '8px',
        padding: '8px 12px',
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px'
        }}>
          <span style={{ fontSize: '0.74rem', color: '#c59341', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
            Reagentes no Caldeirão ({slottedIngredients.length}/4)
          </span>
          {slottedIngredients.length > 0 && (
            <button
              onClick={onReset}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                fontSize: '0.7rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
              title="Esvaziar todos os slots"
            >
              <RotateCcw size={12} />
              Limpar Tudo
            </button>
          )}
        </div>

        {/* Instability Warning Indicator */}
        {isKnownFailure && slottedIngredients.length >= 2 && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            padding: '6px 10px',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#fca5a5',
            fontSize: '0.74rem'
          }}>
            <AlertTriangle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>
              <b>Aviso de Memória {mode === 'alquimia' ? 'Alquímica' : 'Culinária'}:</b> Você já testou essa combinação antes e ela gerou <b>{mode === 'alquimia' ? 'Mistura Instável' : 'Prato Incomestível'}</b>! Esvazie para não perder ingredientes à toa.
            </span>
          </div>
        )}

        {/* Alchemy hint when only 1 ingredient is slotted in alchemy mode */}
        {mode === 'alquimia' && slottedIngredients.length === 1 && (
          <div style={{
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px dashed #6366f1',
            borderRadius: '6px',
            padding: '6px 10px',
            marginBottom: '6px',
            color: '#c7d2fe',
            fontSize: '0.72rem',
            textAlign: 'center'
          }}>
            ⚗️ A Alquimia Arcana exige ao menos <b>2 reagentes</b> combinados para iniciar a transmutação.
          </div>
        )}

        {/* 4 Slots */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px'
        }}>
          {[0, 1, 2, 3].map(slotIndex => {
            const item = slottedIngredients[slotIndex];
            return (
              <div
                key={slotIndex}
                style={{
                  height: '52px',
                  background: item ? '#221913' : '#14100d',
                  border: item ? '1px solid #c59341' : '1px dashed #3a2a1e',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  boxShadow: item ? 'inset 0 0 10px rgba(197, 147, 65, 0.15)' : 'none'
                }}
              >
                {item ? (
                  <>
                    <button
                      onClick={() => onRemoveIngredient(slotIndex)}
                      title={`Remover ${item.name}`}
                      style={{
                        position: 'absolute',
                        top: '1px',
                        right: '1px',
                        background: 'rgba(0,0,0,0.75)',
                        border: '1px solid rgba(248, 113, 113, 0.4)',
                        color: '#f87171',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 2
                      }}
                    >
                      <X size={12} />
                    </button>
                    <span style={{ fontSize: '18px' }}>
                      {getItemEmoji(item.category)}
                    </span>
                    <span style={{
                      fontSize: '0.66rem',
                      color: '#e5dec9',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%',
                      marginTop: '1px'
                    }}>
                      {item.name}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: '0.68rem', color: '#524336' }}>
                    Slot {slotIndex + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          PHYSICAL WORKBENCH ACTION CONTROLS
         ======================================================== */}
      <div 
        className="cauldron-action-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: '8px',
          gap: '10px'
        }}
      >
        {/* Stir Button */}
        <button
          onClick={handleStir}
          style={{
            flex: '1',
            padding: '9px 8px',
            background: 'linear-gradient(180deg, #2d221b 0%, #1c1511 100%)',
            border: '1px solid #4d3a2b',
            color: '#d4c5a9',
            borderRadius: '6px',
            fontFamily: 'var(--font-display)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s'
          }}
        >
          <span>🥄</span> Mexer
        </button>

        {/* Big Transmute / Craft Button */}
        {(() => {
          const isCraftable = mode === 'cozinha' 
            ? slottedIngredients.length >= 1 && cauldronState !== 'reacting'
            : slottedIngredients.length >= 2 && cauldronState !== 'reacting';

          let buttonText = '';
          if (mode === 'alquimia') {
            buttonText = slottedIngredients.length < 2 ? 'Transmutar (Mín. 2 Reagentes)' : 'Transmutar Mistura Arcana';
          } else {
            if (slottedIngredients.length === 0) buttonText = 'Adicione Ingredientes';
            else if (slottedIngredients.length === 1) buttonText = 'Cozinhar Refeição Simples';
            else buttonText = 'Cozinhar Prato / Banquete';
          }

          return (
            <button
              onClick={onCombine}
              disabled={!isCraftable}
              style={{
                flex: '2',
                padding: '10px 14px',
                background: isCraftable 
                  ? mode === 'alquimia'
                    ? 'linear-gradient(180deg, #b8863b 0%, #855818 100%)'
                    : 'linear-gradient(180deg, #ea580c 0%, #9a3412 100%)'
                  : '#261e18',
                border: isCraftable ? '1px solid #facc15' : '1px solid #3d2f25',
                color: isCraftable ? '#ffffff' : '#6b5847',
                borderRadius: '8px',
                fontFamily: 'var(--font-display)',
                fontSize: '0.88rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
                cursor: isCraftable ? 'pointer' : 'not-allowed',
                boxShadow: isCraftable ? '0 4px 16px rgba(184, 134, 59, 0.45)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.18s ease'
              }}
            >
              <Sparkles size={18} />
              {buttonText}
            </button>
          );
        })()}
      </div>
    </section>
  );
};
