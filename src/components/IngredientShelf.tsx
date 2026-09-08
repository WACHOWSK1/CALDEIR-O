import React, { useState, useMemo } from 'react';
import { Ingredient, Rarity } from '../types';
import { Search, Plus, Minus, X, Trash2, Backpack, Check, Info } from 'lucide-react';

interface Props {
  playerInventory: Ingredient[];
  masterIngredients: Ingredient[];
  slottedIngredients: Ingredient[];
  onAddToInventory: (ingredient: Ingredient, quantity: number) => void;
  onUpdateInventoryQuantity: (ingredientId: string, newQty: number) => void;
  onAddIngredientToCauldron: (ingredient: Ingredient) => void;
  disabledSlots: boolean;
}

export const IngredientShelf: React.FC<Props> = ({
  playerInventory,
  masterIngredients,
  slottedIngredients,
  onAddToInventory,
  onUpdateInventoryQuantity,
  onAddIngredientToCauldron,
  disabledSlots
}) => {
  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [lastSearchedTerm, setLastSearchedTerm] = useState('');
  const [foundIngredients, setFoundIngredients] = useState<Ingredient[]>([]);
  const [quantityToAdd, setQuantityToAdd] = useState<{ [id: string]: number }>({});
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  // Backpack state
  const [inventoryFilter, setInventoryFilter] = useState('');
  const [inspectedItem, setInspectedItem] = useState<Ingredient | null>(null);

  // Normalize string for robust matching (removes accents, hyphens, extra spaces)
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Handle Search Trigger (Click button or Enter)
  const handlePerformSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const term = normalize(searchInput);
    setLastSearchedTerm(searchInput.trim());
    setSearchExecuted(true);

    if (!term || term.length < 2) {
      setFoundIngredients([]);
      return;
    }

    // Match against master catalog (all 287 items)
    const matches = masterIngredients.filter(item => {
      const itemNorm = normalize(item.name);
      const altNorm = normalize(item.normName || '');
      return itemNorm === term || itemNorm.includes(term) || altNorm === term || altNorm.includes(term);
    });

    // Sort by best match (exact matches first, then shortest names)
    matches.sort((a, b) => {
      const aNorm = normalize(a.name);
      const bNorm = normalize(b.name);
      if (aNorm === term && bNorm !== term) return -1;
      if (bNorm === term && aNorm !== term) return 1;
      return aNorm.length - bNorm.length;
    });

    setFoundIngredients(matches.slice(0, 5));
  };

  // Quantity helpers for found search results
  const getSelectedQty = (id: string) => quantityToAdd[id] ?? 1;

  const handleSetQty = (id: string, delta: number) => {
    setQuantityToAdd(prev => {
      const current = prev[id] ?? 1;
      const next = Math.max(1, Math.min(99, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const handleDirectInputQty = (id: string, valStr: string) => {
    if (valStr === '') {
      setQuantityToAdd(prev => ({ ...prev, [id]: 1 }));
      return;
    }
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed)) {
      setQuantityToAdd(prev => ({ ...prev, [id]: Math.max(1, Math.min(99, parsed)) }));
    }
  };

  const handleConfirmAdd = (item: Ingredient) => {
    const qty = getSelectedQty(item.id);
    onAddToInventory(item, qty);
    setRecentlyAddedId(item.id);
    setTimeout(() => setRecentlyAddedId(null), 2000);
    setQuantityToAdd(prev => ({ ...prev, [item.id]: 1 }));
  };

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

  // Filter player's own inventory
  const filteredInventory = useMemo(() => {
    if (!inventoryFilter.trim()) return playerInventory;
    const term = normalize(inventoryFilter);
    return playerInventory.filter(item => normalize(item.name).includes(term));
  }, [playerInventory, inventoryFilter]);

  const totalInventoryUnits = useMemo(() => {
    return playerInventory.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [playerInventory]);

  return (
    <aside
      aria-label="Mochila e Requisição de Ingredientes"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #241c16 0%, #1a1410 100%)',
        border: '1px solid #4a382a',
        borderRadius: '12px',
        padding: '14px',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.7)',
        position: 'relative',
        gap: '10px'
      }}
    >
      {/* ========================================================
          1. TOP AREA: INGREDIENT SEARCH & REQUISITION (HIDDEN CATALOG)
         ======================================================== */}
      <section style={{
        background: 'rgba(18, 14, 11, 0.92)',
        border: '1px solid #3d2c20',
        borderRadius: '8px',
        padding: '10px 12px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.94rem',
            color: '#f5edd6',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>🔍</span> Requisitar Ingrediente
          </h2>
          <span style={{ fontSize: '0.68rem', color: '#a89885' }}>
            Digite o nome obtido em jogo
          </span>
        </div>

        {/* Search Input + Action Button Form */}
        <form onSubmit={handlePerformSearch} style={{ display: 'flex', gap: '6px' }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: '#14100d',
            border: searchFocused ? '1px solid #c59341' : '1px solid #4a382a',
            borderRadius: '6px',
            padding: '5px 8px',
            gap: '6px',
            boxShadow: searchFocused ? '0 0 8px rgba(197, 147, 65, 0.25)' : 'none',
            transition: 'all 0.15s ease'
          }}>
            <Search size={14} color={searchFocused ? '#c59341' : '#a39281'} />
            <input
              type="text"
              autoComplete="off"
              spellCheck="false"
              placeholder="Ex: Flor-da-vida, Sangue de dragão..."
              value={searchInput}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onChange={e => setSearchInput(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f3ede2',
                fontSize: '0.8rem',
                width: '100%',
                outline: 'none'
              }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setFoundIngredients([]);
                  setSearchExecuted(false);
                }}
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '2px' }}
                title="Limpar busca"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="submit"
            style={{
              padding: '6px 12px',
              background: 'linear-gradient(180deg, #c59341 0%, #8c5d1b 100%)',
              border: '1px solid #eab308',
              borderRadius: '6px',
              color: '#ffffff',
              fontFamily: 'var(--font-display)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap',
              transition: 'transform 0.1s ease'
            }}
          >
            <Search size={13} /> Buscar
          </button>
        </form>

        {/* Found Search Results (Only shown when player searches) */}
        {searchExecuted && (
          <div style={{ marginTop: '10px' }}>
            {lastSearchedTerm.length < 2 ? (
              <div style={{
                background: 'rgba(234, 179, 8, 0.08)',
                border: '1px dashed #ca8a04',
                borderRadius: '6px',
                padding: '7px 10px',
                color: '#fde047',
                fontSize: '0.74rem',
                textAlign: 'center'
              }}>
                Digite ao menos 2 letras do nome do ingrediente para buscar.
              </div>
            ) : foundIngredients.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.68rem', color: '#c59341', fontWeight: 600, textTransform: 'uppercase' }}>
                  Resultado da Busca ({foundIngredients.length})
                </span>

                {foundIngredients.map(item => {
                  const rarity = getRarityBadge(item.rarity);
                  const qty = getSelectedQty(item.id);
                  const isRecentlyAdded = recentlyAddedId === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setInspectedItem(item)}
                      title="Clique para ver descrição do reagente"
                      style={{
                        background: '#1d1612',
                        border: '1px solid #5a4230',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s'
                      }}
                    >
                      {/* Left: Item Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span style={{ fontSize: '18px' }}>{getItemEmoji(item.category)}</span>
                        <div style={{ minWidth: 0 }}>
                          <p style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: '#ede3d1',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.name}
                          </p>
                          <span style={{
                            fontSize: '0.62rem',
                            color: rarity.color,
                            background: rarity.bg,
                            padding: '1px 4px',
                            borderRadius: '3px',
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}>
                            {rarity.text} • {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Right: Quantity Stepper & Add Button */}
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                      >
                        {/* Stepper */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          background: '#120e0b',
                          border: '1px solid #3d2c20',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <button
                            type="button"
                            onClick={() => handleSetQty(item.id, -1)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#a89885',
                              width: '20px',
                              height: '24px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Minus size={11} />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={qty}
                            onChange={e => handleDirectInputQty(item.id, e.target.value)}
                            style={{
                              width: '26px',
                              height: '24px',
                              background: 'transparent',
                              border: 'none',
                              color: '#f5edd6',
                              fontSize: '0.74rem',
                              textAlign: 'center',
                              fontWeight: 700,
                              outline: 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSetQty(item.id, 1)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#a89885',
                              width: '20px',
                              height: '24px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        {/* Add to backpack button */}
                        <button
                          type="button"
                          onClick={() => handleConfirmAdd(item)}
                          style={{
                            padding: '5px 9px',
                            background: isRecentlyAdded ? '#15803d' : '#2b2118',
                            color: isRecentlyAdded ? '#ffffff' : '#f5edd6',
                            border: isRecentlyAdded ? '1px solid #22c55e' : '1px solid #5a4430',
                            borderRadius: '5px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s'
                          }}
                          title="Adicionar à sua mochila com a quantidade indicada"
                        >
                          {isRecentlyAdded ? <Check size={12} /> : <Plus size={12} />}
                          {isRecentlyAdded ? 'Guardado!' : 'Pegar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px dashed #ef4444',
                borderRadius: '6px',
                padding: '8px 10px',
                color: '#fca5a5',
                fontSize: '0.74rem',
                lineHeight: '1.35',
                textAlign: 'center'
              }}>
                Nenhum ingrediente encontrado com o termo "{lastSearchedTerm}".<br />
                <span style={{ fontSize: '0.68rem', color: '#a89885' }}>
                  Verifique a grafia informada pelo Mestre da sua mesa.
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================
          2. BOTTOM AREA: PLAYER INVENTORY / BACKPACK (ACTUAL ITEMS)
         ======================================================== */}
      <section style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        position: 'relative'
      }}>
        {/* Backpack Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Backpack size={16} color="#c59341" />
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.96rem',
              color: '#f5edd6',
              letterSpacing: '0.5px'
            }}>
              Mochila do Jogador
            </h3>
          </div>
          <span style={{
            fontSize: '0.72rem',
            color: '#c59341',
            background: '#17120e',
            padding: '2px 8px',
            borderRadius: '10px',
            border: '1px solid #3d2c20',
            fontWeight: 600
          }}>
            {playerInventory.length} tipos ({totalInventoryUnits} un)
          </span>
        </div>

        {/* Quick Filter inside player's own backpack (if player has > 4 items) */}
        {playerInventory.length > 4 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#14100d',
            border: '1px solid #3d2c20',
            borderRadius: '5px',
            padding: '4px 8px',
            marginBottom: '8px',
            gap: '6px'
          }}>
            <Search size={12} color="#7c6e60" />
            <input
              type="text"
              placeholder="Filtrar sua mochila..."
              value={inventoryFilter}
              onChange={e => setInventoryFilter(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#d4c8b8',
                fontSize: '0.74rem',
                width: '100%',
                outline: 'none'
              }}
            />
            {inventoryFilter && (
              <button
                onClick={() => setInventoryFilter('')}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: 0 }}
              >
                <X size={11} />
              </button>
            )}
          </div>
        )}

        {/* Player Inventory Items List - Single Clean Column (Matches original aesthetic) */}
        <div
          tabIndex={0}
          aria-label="Lista de ingredientes na mochila do jogador"
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            paddingRight: '4px'
          }}
        >
          {filteredInventory.map(item => {
            const rarity = getRarityBadge(item.rarity);
            const countInCauldron = slottedIngredients.filter(s => (s.normName || normalize(s.name)) === (item.normName || normalize(item.name))).length;
            const availableCount = Math.max(0, item.quantity - countInCauldron);
            const canAddToCauldron = !disabledSlots && availableCount > 0;

            return (
              <div
                key={item.id}
                draggable={availableCount > 0}
                onDragStart={e => handleDragStart(e, item)}
                onClick={() => setInspectedItem(item)}
                title={`${item.name} (Possui: ${item.quantity}) - Clique para ver detalhes ou arraste ao caldeirão`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 10px',
                  background: countInCauldron > 0 ? '#261a12' : '#1c1511',
                  border: `1px solid ${countInCauldron > 0 ? '#c59341' : item.rarity === 'lendário' ? '#92400e' : '#3d2e23'}`,
                  borderRadius: '6px',
                  cursor: availableCount > 0 ? 'grab' : 'pointer',
                  transition: 'transform 0.12s, border-color 0.12s',
                  position: 'relative'
                }}
              >
                {/* Emoji Box */}
                <div style={{
                  fontSize: '18px',
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

                {/* Info Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#ede3d1',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
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
                    <span style={{
                      fontSize: '0.72rem',
                      color: availableCount === 0 ? '#ef4444' : '#facc15',
                      fontWeight: 700
                    }}>
                      x{item.quantity}
                    </span>
                    {countInCauldron > 0 && (
                      <span style={{ fontSize: '0.64rem', color: '#c59341' }}>
                        ({countInCauldron} no caldeirão)
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct Add Button */}
                <button
                  disabled={!canAddToCauldron}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canAddToCauldron) {
                      onAddIngredientToCauldron(item);
                    }
                  }}
                  title={
                    disabledSlots
                      ? 'Caldeirão já está cheio (máximo 4)'
                      : availableCount === 0
                        ? 'Todas as suas unidades já estão no caldeirão'
                        : 'Adicionar 1 ao caldeirão'
                  }
                  style={{
                    background: 'transparent',
                    border: '1px solid #5a4230',
                    color: !canAddToCauldron ? '#4b382a' : '#c59341',
                    borderRadius: '4px',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: !canAddToCauldron ? 'not-allowed' : 'pointer',
                    flexShrink: 0
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            );
          })}

          {/* Empty Inventory State */}
          {playerInventory.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '36px 16px',
              color: '#8a7968',
              background: 'rgba(20, 16, 13, 0.4)',
              borderRadius: '8px',
              border: '1px dashed #3d2c20',
              margin: 'auto 0'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎒✨</div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', color: '#c59341', marginBottom: '6px' }}>
                Sua mochila está vazia
              </p>
              <p style={{ fontSize: '0.74rem', lineHeight: '1.4', color: '#a89885' }}>
                Requisite os itens que seu personagem coletou digitando o nome no campo de busca acima, ou role uma <b>Coleta nos Biomas</b> no topo da bancada.
              </p>
            </div>
          )}

          {/* Filter No Match */}
          {playerInventory.length > 0 && filteredInventory.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '24px 10px',
              color: '#8a7968',
              fontSize: '0.78rem'
            }}>
              Nenhum item na sua mochila corresponde ao filtro "{inventoryFilter}".
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          3. INSPECTED ITEM DRAWER / CARD POPUP
         ======================================================== */}
      {inspectedItem && (
        <div style={{
          padding: '12px',
          background: '#ede1cb',
          color: '#29211a',
          borderRadius: '8px',
          border: '1px solid #b8a688',
          boxShadow: '0 4px 16px rgba(0,0,0,0.7)',
          position: 'relative',
          marginTop: 'auto',
          flexShrink: 0
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
            <span style={{ fontSize: '24px' }}>{getItemEmoji(inspectedItem.category)}</span>
            <div>
              <h3 style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                color: '#241a12'
              }}>
                {inspectedItem.name}
              </h3>
              <span style={{ fontSize: '0.66rem', color: '#6e5a48', textTransform: 'uppercase', fontWeight: 600 }}>
                {inspectedItem.category} • {inspectedItem.rarity}
                {playerInventory.some(i => i.id === inspectedItem.id) && ` • Possui: ${inspectedItem.quantity}`}
              </span>
            </div>
          </div>

          {inspectedItem.originRegion && (
            <div style={{
              fontSize: '0.68rem',
              color: '#5c4530',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '6px'
            }}>
              <span>📍 Origem:</span> <span>{inspectedItem.originRegion}</span>
            </div>
          )}

          <p style={{ fontSize: '0.76rem', color: '#453526', lineHeight: '1.35', marginBottom: '10px' }}>
            {inspectedItem.description}
          </p>

          <div style={{ display: 'flex', gap: '6px' }}>
            {/* Direct Add button (only if player has item in backpack) */}
            {playerInventory.some(i => i.id === inspectedItem.id) ? (
              <>
                <button
                  disabled={disabledSlots}
                  onClick={() => {
                    onAddIngredientToCauldron(inspectedItem);
                  }}
                  style={{
                    flex: 2,
                    padding: '7px 10px',
                    background: disabledSlots ? '#a89885' : '#2b2118',
                    color: disabledSlots ? '#e5dec9' : '#f5edd6',
                    border: 'none',
                    borderRadius: '5px',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: disabledSlots ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={13} />
                  {disabledSlots ? 'Caldeirão Cheio (Máx 4)' : 'Mergulhar no Caldeirão'}
                </button>

                {/* Remove / Discard from inventory */}
                <button
                  onClick={() => {
                    const newQty = inspectedItem.quantity - 1;
                    onUpdateInventoryQuantity(inspectedItem.id, newQty);
                    if (newQty <= 0) {
                      setInspectedItem(null);
                    } else {
                      setInspectedItem({ ...inspectedItem, quantity: newQty });
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '7px 8px',
                    background: 'rgba(185, 28, 28, 0.15)',
                    color: '#991b1b',
                    border: '1px solid #b91c1c',
                    borderRadius: '5px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                  title="Descartar 1 unidade da mochila"
                >
                  <Trash2 size={12} /> Descartar 1
                </button>
              </>
            ) : (
              <button
                onClick={() => handleConfirmAdd(inspectedItem)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: '#166534',
                  color: '#ffffff',
                  border: '1px solid #22c55e',
                  borderRadius: '5px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={14} /> Guardar 1x na Mochila
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
