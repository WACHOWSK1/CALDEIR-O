import React, { useState, useMemo } from 'react';
import { Ingredient, Rarity } from '../types';
import { Search, Plus, Info, X } from 'lucide-react';

interface Props {
  ingredients: Ingredient[];
  onAddIngredient: (ingredient: Ingredient) => void;
  disabledSlots: boolean;
}

export const IngredientShelf: React.FC<Props> = ({
  ingredients,
  onAddIngredient,
  disabledSlots
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [inspectedItem, setInspectedItem] = useState<Ingredient | null>(null);

  // Normalize string for search
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const categories = ['Todos', 'Ervas & Raízes', 'Minerais', 'Criaturas', 'Essências', 'Alimentos'];

  const filteredIngredients = useMemo(() => {
    const term = normalize(searchTerm);
    return ingredients.filter(item => {
      // Category match
      let catMatch = true;
      if (activeCategory === 'Ervas & Raízes') {
        catMatch = item.category.includes('Erva') || item.category.includes('Flor') || item.category.includes('Fungo') || item.category.includes('Vegetal');
      } else if (activeCategory === 'Minerais') {
        catMatch = item.category.includes('Mineral');
      } else if (activeCategory === 'Criaturas') {
        catMatch = item.category.includes('Criatura') || item.category.includes('Proteína');
      } else if (activeCategory === 'Essências') {
        catMatch = item.category.includes('Essência') || item.category.includes('Líquido');
      } else if (activeCategory === 'Alimentos') {
        catMatch = item.category.includes('Alimento') || item.category.includes('Tempero') || item.category.includes('Vegetal');
      }

      // Search match
      const nameMatch = normalize(item.name).includes(term);
      return catMatch && nameMatch;
    });
  }, [ingredients, searchTerm, activeCategory]);

  const getItemEmoji = (cat: string) => {
    if (cat.includes('Criatura')) return '🦴';
    if (cat.includes('Erva') || cat.includes('Raiz')) return '🌿';
    if (cat.includes('Flor')) return '🌸';
    if (cat.includes('Fungo')) return '🍄';
    if (cat.includes('Mineral') || cat.includes('Cristal')) return '💎';
    if (cat.includes('Líquido') || cat.includes('Óleo')) return '🧪';
    if (cat.includes('Essência')) return '✨';
    if (cat.includes('Alimento') || cat.includes('Proteína')) return '🥩';
    if (cat.includes('Tempero')) return '🌶️';
    return '📦';
  };

  const getRarityBadge = (rarity: Rarity) => {
    switch (rarity) {
      case 'lendário':
        return { color: '#f59e0b', text: 'Lendário', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'raro':
        return { color: '#3b82f6', text: 'Raro', bg: 'rgba(59, 130, 246, 0.15)' };
      case 'incomum':
        return { color: '#10b981', text: 'Incomum', bg: 'rgba(16, 185, 129, 0.15)' };
      default:
        return { color: '#a8a29e', text: 'Comum', bg: 'rgba(168, 162, 158, 0.1)' };
    }
  };

  const handleDragStart = (e: React.DragEvent, item: Ingredient) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside 
      aria-label="Organizador de Ingredientes da Bancada"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #241c16 0%, #1a1410 100%)',
        border: '1px solid #4a382a',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.7)',
        maxHeight: '740px',
        position: 'relative'
      }}
    >
      {/* Shelf Header */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.05rem',
            color: '#f5edd6',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🪵</span> Prateleira de Ingredientes
          </h2>
          <span style={{ fontSize: '0.74rem', color: '#a89885', background: '#17120e', padding: '2px 8px', borderRadius: '10px', border: '1px solid #3d2c20' }}>
            {filteredIngredients.length} itens
          </span>
        </div>

        {/* Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#14100d',
          border: '1px solid #4a382a',
          borderRadius: '6px',
          padding: '6px 10px',
          gap: '8px'
        }}>
          <Search size={14} color="#a39281" />
          <input
            type="text"
            placeholder="Buscar por nome ou essência..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f3ede2',
              fontSize: '0.82rem',
              width: '100%',
              outline: 'none'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div style={{
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          marginTop: '8px',
          paddingBottom: '4px'
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                whiteSpace: 'nowrap',
                fontSize: '0.72rem',
                padding: '4px 8px',
                borderRadius: '4px',
                border: activeCategory === cat ? '1px solid #c59341' : '1px solid #382a1f',
                background: activeCategory === cat ? '#38281d' : '#17120e',
                color: activeCategory === cat ? '#facc15' : '#a89885',
                cursor: 'pointer',
                transition: 'all 0.12s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredient Grid / List */}
      <div 
        tabIndex={0}
        aria-label="Lista de ingredientes disponíveis"
        style={{
          flex: '1',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          paddingRight: '4px'
        }}
      >
        {filteredIngredients.map(item => {
          const rarity = getRarityBadge(item.rarity);
          return (
            <div
              key={item.id}
              draggable
              onDragStart={e => handleDragStart(e, item)}
              onClick={() => setInspectedItem(item)}
              title={`${item.name} (${item.rarity}) - Clique para detalhes ou arraste ao caldeirão`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                background: '#1c1511',
                border: `1px solid ${item.rarity === 'lendário' ? '#92400e' : '#3d2e23'}`,
                borderRadius: '6px',
                cursor: 'grab',
                transition: 'transform 0.12s, border-color 0.12s',
                position: 'relative'
              }}
            >
              <div style={{
                fontSize: '20px',
                width: '32px',
                height: '32px',
                background: '#120e0b',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #2d2118',
                flexShrink: 0
              }}>
                {getItemEmoji(item.category)}
              </div>

              <div style={{ flex: '1', minWidth: 0 }}>
                <p style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#ede3d1',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span style={{
                    fontSize: '0.62rem',
                    color: rarity.color,
                    background: rarity.bg,
                    padding: '1px 4px',
                    borderRadius: '3px',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    {rarity.text}
                  </span>
                  <span style={{ fontSize: '0.66rem', color: '#8c7d6d' }}>
                    x{item.quantity}
                  </span>
                </div>
              </div>

              {/* Direct Add Button */}
              <button
                disabled={disabledSlots}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddIngredient(item);
                }}
                title="Adicionar direto ao caldeirão"
                style={{
                  background: 'transparent',
                  border: '1px solid #5a4230',
                  color: disabledSlots ? '#554234' : '#c59341',
                  borderRadius: '4px',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: disabledSlots ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  transition: 'background 0.12s'
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          );
        })}

        {filteredIngredients.length === 0 && (
          <div style={{
            gridColumn: 'span 2',
            textAlign: 'center',
            padding: '40px 10px',
            color: '#8a7968',
            fontSize: '0.85rem'
          }}>
            Nenhum ingrediente encontrado com esse filtro.
          </div>
        )}
      </div>

      {/* Progressive Disclosure: Inspected Item Card Drawer */}
      {inspectedItem && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: '#ede1cb',
          color: '#29211a',
          borderRadius: '8px',
          border: '1px solid #b8a688',
          boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
          position: 'relative'
        }}>
          <button
            onClick={() => setInspectedItem(null)}
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              background: 'transparent',
              border: 'none',
              color: '#6e5a48',
              cursor: 'pointer'
            }}
          >
            <X size={15} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '22px' }}>{getItemEmoji(inspectedItem.category)}</span>
            <div>
              <h3 style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                color: '#241a12'
              }}>
                {inspectedItem.name}
              </h3>
              <span style={{ fontSize: '0.7rem', color: '#6e5a48', textTransform: 'uppercase' }}>
                {inspectedItem.category} • {inspectedItem.rarity}
              </span>
            </div>
          </div>

          <p style={{ fontSize: '0.78rem', color: '#453526', lineHeight: '1.3', marginBottom: '8px' }}>
            {inspectedItem.description || 'Reagente de alta pureza coletado nos ermos do cenário de Tormenta 20.'}
          </p>

          <button
            disabled={disabledSlots}
            onClick={() => {
              onAddIngredient(inspectedItem);
            }}
            style={{
              width: '100%',
              padding: '7px 10px',
              background: disabledSlots ? '#a89885' : '#2b2118',
              color: disabledSlots ? '#e5dec9' : '#f5edd6',
              border: 'none',
              borderRadius: '5px',
              fontFamily: 'var(--font-display)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: disabledSlots ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Plus size={14} />
            {disabledSlots ? 'Caldeirão Cheio (Máx 4)' : 'Adicionar ao Caldeirão'}
          </button>
        </div>
      )}
    </aside>
  );
};
