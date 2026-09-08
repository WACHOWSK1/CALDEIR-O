import React, { useState, useEffect, useMemo } from 'react';
import { Ingredient, Recipe, CraftMode, CauldronState, ExperimentLog } from './types';
import alchemyData from './data/alchemyRecipes.json';
import gastronomyData from './data/gastronomyRecipes.json';
import initialIngredientsData from './data/ingredients.json';
import { WorkbenchHeader } from './components/WorkbenchHeader';
import { Cauldron } from './components/Cauldron';
import { IngredientShelf } from './components/IngredientShelf';
import { RecipeBook } from './components/RecipeBook';
import { DiscoveryModal } from './components/DiscoveryModal';
import { BiomeCollectorModal } from './components/BiomeCollectorModal';
import { RecipeChestModal } from './components/RecipeChestModal';
import { ShopModal, ShopType } from './components/ShopModal';
import { X } from 'lucide-react';

export const App: React.FC = () => {
  const [mode, setMode] = useState<CraftMode>('alquimia');
  const [cauldronState, setCauldronState] = useState<CauldronState>('idle');
  const [slottedIngredients, setSlottedIngredients] = useState<Ingredient[]>([]);

  // Master ingredients catalog (kept in memory, hidden from players)
  const masterIngredients = useMemo(() => initialIngredientsData as Ingredient[], []);

  // Player Inventory (Only items actually possessed by the player)
  const [playerInventory, setPlayerInventory] = useState<Ingredient[]>(() => {
    const savedStr = localStorage.getItem('caldeiro_player_inventory_v1');
    if (savedStr) {
      try {
        const parsed = JSON.parse(savedStr);
        if (Array.isArray(parsed)) {
          return parsed.filter((item: Ingredient) => item && item.quantity > 0);
        }
      } catch (e) {
        console.error('Erro ao restaurar inventario do jogador:', e);
      }
    }
    return [];
  });

  const [discoveredRecipes, setDiscoveredRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('caldeiro_discovered');
    return saved ? JSON.parse(saved) : [];
  });

  const [experimentHistory, setExperimentHistory] = useState<ExperimentLog[]>(() => {
    const saved = localStorage.getItem('caldeiro_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [newDiscovery, setNewDiscovery] = useState<Recipe | null>(null);
  const [isCollectorOpen, setIsCollectorOpen] = useState(false);
  const [isChestRollerOpen, setIsChestRollerOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [shopType, setShopType] = useState<ShopType>('cozinha');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'prateleira' | 'caldeirao' | 'grimorio'>('caldeirao');

  // Active recipes list based on mode
  const currentModeRecipes = mode === 'alquimia' ? (alchemyData as Recipe[]) : (gastronomyData as Recipe[]);
  const discoveredInCurrentMode = discoveredRecipes.filter(r => 
    mode === 'alquimia' ? (r.id.startsWith('alq') || r.id.startsWith('herb_alq') || r.id.startsWith('exp_alq')) 
                        : (r.id.startsWith('gas') || r.id.startsWith('herb_gas') || r.id.startsWith('exp_gas'))
  );

  // Helper for consistent diacritics and casing normalization
  const getNorm = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Persistence for player's backpack
  useEffect(() => {
    localStorage.setItem('caldeiro_player_inventory_v1', JSON.stringify(playerInventory));
  }, [playerInventory]);

  useEffect(() => {
    localStorage.setItem('caldeiro_discovered', JSON.stringify(discoveredRecipes));
  }, [discoveredRecipes]);

  useEffect(() => {
    localStorage.setItem('caldeiro_history', JSON.stringify(experimentHistory));
  }, [experimentHistory]);

  const showNotification = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // Buy ingredient handler from shop (adds to inventory and notifies)
  const handleBuyIngredient = (ingredient: Ingredient, quantity: number, totalCost: number) => {
    setPlayerInventory(prev => {
      const norm = ingredient.normName || getNorm(ingredient.name);
      const existingIndex = prev.findIndex(i => (i.normName || getNorm(i.name)) === norm);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity
        };
        return next;
      } else {
        return [{ ...ingredient, quantity }, ...prev];
      }
    });
    showNotification(`+${quantity}x "${ingredient.name}" comprado(s) por T$ ${totalCost} e guardados na mochila.`);
  };

  // Buy recipe handler from shop (adds to grimoire and notifies)
  const handleBuyRecipe = (recipe: Recipe, cost: number) => {
    if (!discoveredRecipes.some(r => r.id === recipe.id)) {
      setDiscoveredRecipes(prev => [recipe, ...prev]);
    }
    showNotification(`Pergaminho de "${recipe.name}" aprendido por T$ ${cost} e anotado no Grimório!`);
  };

  // Pre-emptive check: has this exact slotted combination already failed in history?
  const isKnownFailure = useMemo(() => {
    const minRequired = mode === 'alquimia' ? 2 : 1;
    if (slottedIngredients.length < minRequired) return false;
    const slottedNorms = slottedIngredients.map(i => i.normName || getNorm(i.name)).sort();

    return experimentHistory.some(exp => {
      if (exp.isSuccess) return false;
      if (exp.mode !== mode) return false;
      const expNorms = exp.ingredients.map(getNorm).sort();
      if (expNorms.length !== slottedNorms.length) return false;
      return expNorms.every((n, idx) => n === slottedNorms[idx]);
    });
  }, [slottedIngredients, experimentHistory, mode]);

  // Add item to player inventory with specific quantity (accumulates if already present)
  const handleAddToInventory = (ingredient: Ingredient, qtyToAdd: number) => {
    setPlayerInventory(prev => {
      const norm = ingredient.normName || getNorm(ingredient.name);
      const existingIndex = prev.findIndex(i => (i.normName || getNorm(i.name)) === norm);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + qtyToAdd
        };
        return next;
      } else {
        return [{ ...ingredient, quantity: qtyToAdd }, ...prev];
      }
    });
    showNotification(`+${qtyToAdd}x "${ingredient.name}" guardado(s) na sua mochila.`);
  };

  // Update or discard item from player inventory
  const handleUpdateInventoryQuantity = (ingredientId: string, newQty: number) => {
    setPlayerInventory(prev => {
      if (newQty <= 0) {
        return prev.filter(i => i.id !== ingredientId);
      }
      return prev.map(i => i.id === ingredientId ? { ...i, quantity: newQty } : i);
    });
  };

  // Add ingredient from backpack to cauldron (max 4, limited to available quantity)
  const handleAddIngredient = (ingredient: Ingredient) => {
    if (slottedIngredients.length >= 4) {
      showNotification('O caldeirão já está com a capacidade máxima de 4 reagentes.');
      return;
    }

    const norm = ingredient.normName || getNorm(ingredient.name);
    const invItem = playerInventory.find(i => (i.normName || getNorm(i.name)) === norm);
    const maxAvailable = invItem ? invItem.quantity : 0;
    const countInCauldron = slottedIngredients.filter(s => (s.normName || getNorm(s.name)) === norm).length;

    if (countInCauldron >= maxAvailable) {
      showNotification(`Você já colocou todas as suas ${maxAvailable} unidade(s) de "${ingredient.name}" no caldeirão.`);
      return;
    }

    setSlottedIngredients(prev => [...prev, ingredient]);
    showNotification(`"${ingredient.name}" colocado no caldeirão (${slottedIngredients.length + 1}/4).`);
    setCauldronState('receiving');
    setTimeout(() => setCauldronState('idle'), 350);
  };

  // Remove single ingredient from cauldron slot (returns to player's available stock)
  const handleRemoveIngredient = (index: number) => {
    setSlottedIngredients(prev => prev.filter((_, i) => i !== index));
    setCauldronState('idle');
  };

  // Reset cauldron slots
  const handleResetCauldron = () => {
    setSlottedIngredients([]);
    setCauldronState('idle');
  };

  // Check and craft recipe - Consumes items from player's inventory!
  const handleCombine = () => {
    const minRequired = mode === 'alquimia' ? 2 : 1;
    if (slottedIngredients.length < minRequired) return;

    setCauldronState('reacting');

    // Normalize selected ingredients
    const selectedNorms = slottedIngredients
      .map(i => i.normName || getNorm(i.name))
      .sort();

    setTimeout(() => {
      // Find matching recipe in current active mode
      const matched = currentModeRecipes.find(recipe => {
        if (recipe.normalizedIngredients.length !== selectedNorms.length) return false;
        return recipe.normalizedIngredients.every((ing, idx) => ing === selectedNorms[idx]);
      });

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Deduct consumed ingredients from player inventory (removes item if quantity hits 0)
      setPlayerInventory(prev => {
        return prev
          .map(item => {
            const norm = item.normName || getNorm(item.name);
            const used = slottedIngredients.filter(s => (s.normName || getNorm(s.name)) === norm).length;
            if (used > 0) {
              return { ...item, quantity: Math.max(0, item.quantity - used) };
            }
            return item;
          })
          .filter(item => item.quantity > 0);
      });

      if (matched) {
        // Success
        setCauldronState('success');
        setNewDiscovery(matched);

        // Record into grimoire if new
        if (!discoveredRecipes.some(r => r.id === matched.id)) {
          setDiscoveredRecipes(prev => [matched, ...prev]);
        }

        // Add to history
        setExperimentHistory(prev => [
          {
            id: `exp_${Date.now()}`,
            timestamp: timeStr,
            mode,
            ingredients: slottedIngredients.map(i => i.name),
            resultName: matched.name,
            effect: matched.effect,
            isSuccess: true
          },
          ...prev
        ]);

        setSlottedIngredients([]);
      } else {
        // Unstable Mixture / Inedible
        setCauldronState('unstable');
        const failureMsg = mode === 'cozinha' && slottedIngredients.length === 1
          ? 'Este item é um reagente não-comestível e queimou na panela sem produzir alimento. Fórmulas compostas ou alquimia são necessárias.'
          : mode === 'cozinha'
            ? 'Os ingredientes não harmonizaram e a receita desandou. Os reagentes foram consumidos.'
            : 'A mistura ferveu e virou cinzas instáveis. Os reagentes foram consumidos e a tentativa foi anotada.';
        showNotification(failureMsg);

        setExperimentHistory(prev => [
          {
            id: `exp_${Date.now()}`,
            timestamp: timeStr,
            mode,
            ingredients: slottedIngredients.map(i => i.name),
            isSuccess: false
          },
          ...prev
        ]);

        setSlottedIngredients([]);
      }
    }, 650);
  };

  // Autofill recipe from Grimoire (Only allows if player actually has the ingredients in their backpack!)
  const handleAutoFillRecipe = (recipe: Recipe) => {
    const missing: string[] = [];
    const neededItems: Ingredient[] = [];
    const tempUsed = new Map<string, number>();

    for (const ingName of recipe.ingredients) {
      const norm = getNorm(ingName);
      const invItem = playerInventory.find(i => (i.normName || getNorm(i.name)) === norm);
      const currentUsed = tempUsed.get(norm) || 0;

      if (!invItem || invItem.quantity <= currentUsed) {
        missing.push(ingName);
      } else {
        tempUsed.set(norm, currentUsed + 1);
        neededItems.push(invItem);
      }
    }

    if (missing.length > 0) {
      showNotification(`Você não possui todos os reagentes necessários na mochila. Falta: ${missing.join(', ')}.`);
      return;
    }

    setSlottedIngredients(neededItems.slice(0, 4));
    setCauldronState('idle');
    showNotification(`Reagentes de "${recipe.name}" preparados no caldeirão.`);
  };

  // Add items gathered from Biome Collector directly into player's backpack
  const handleAddGatheredItems = (itemNames: string[]) => {
    setPlayerInventory(prev => {
      const next = [...prev];
      itemNames.forEach(name => {
        const norm = getNorm(name);
        const existing = next.find(i => (i.normName || getNorm(i.name)) === norm);
        if (existing) {
          existing.quantity += 1;
        } else {
          const masterItem = masterIngredients.find(i => (i.normName || getNorm(i.name)) === norm);
          if (masterItem) {
            next.unshift({ ...masterItem, quantity: 1 });
          } else {
            next.unshift({
              id: `gathered_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              name,
              normName: norm,
              category: 'Erva/Coletado',
              rarity: 'comum',
              quantity: 1,
              description: 'Item coletado nos ermos do cenário de Tormenta 20.',
              resourceType: 'Ingrediente',
              isEdible: false
            });
          }
        }
      });
      return next;
    });

    showNotification(`${itemNames.length} itens coletados guardados na sua mochila.`);
  };

  return (
    <div className="app-container">
      {/* Top Bar with Mode Switcher, Chest Roller & Biome Collector */}
      <WorkbenchHeader
        mode={mode}
        onToggleMode={newMode => {
          setMode(newMode);
          handleResetCauldron();
        }}
        discoveredCount={discoveredInCurrentMode.length}
        totalRecipes={currentModeRecipes.length}
        onOpenCollector={() => setIsCollectorOpen(true)}
        onOpenChestRoller={() => setIsChestRollerOpen(true)}
        onResetCauldron={handleResetCauldron}
      />

      {/* Floating Toast Notification (Zero Layout Shift!) */}
      {feedbackNotice && (
        <div 
          role="alert"
          className="floating-toast-alert"
          onClick={() => setFeedbackNotice(null)}
          title="Clique para dispensar"
        >
          <span className="toast-icon">✨</span>
          <span className="toast-text">{feedbackNotice}</span>
          <button 
            type="button" 
            className="toast-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              setFeedbackNotice(null);
            }}
            aria-label="Fechar notificação"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Mobile Surface Switcher */}
      <div className="mobile-surface-tabs">
        <button
          className={mobileTab === 'prateleira' ? 'active' : ''}
          onClick={() => setMobileTab('prateleira')}
        >
          🎒 Mochila ({playerInventory.length})
        </button>
        <button
          className={mobileTab === 'caldeirao' ? 'active' : ''}
          onClick={() => setMobileTab('caldeirao')}
        >
          🧙‍♂️ Caldeirão ({slottedIngredients.length}/4)
        </button>
        <button
          className={mobileTab === 'grimorio' ? 'active' : ''}
          onClick={() => setMobileTab('grimorio')}
        >
          📜 Grimório ({discoveredInCurrentMode.length})
        </button>
      </div>

      {/* Main 3-Flank Physical Workbench */}
      <main className="workbench-main">
        {/* Left Flank: Apothecary Backpack (Inventory only) */}
        <div className={`workbench-panel panel-shelf ${mobileTab === 'prateleira' ? 'mobile-active' : ''}`}>
          <IngredientShelf
            playerInventory={playerInventory}
            slottedIngredients={slottedIngredients}
            onUpdateInventoryQuantity={handleUpdateInventoryQuantity}
            onAddIngredientToCauldron={handleAddIngredient}
            disabledSlots={slottedIngredients.length >= 4}
          />
        </div>

        {/* Center: The Protagonist Cauldron */}
        <div className={`workbench-panel panel-cauldron ${mobileTab === 'caldeirao' ? 'mobile-active' : ''}`}>
          <Cauldron
            mode={mode}
            cauldronState={cauldronState}
            slottedIngredients={slottedIngredients}
            isKnownFailure={isKnownFailure}
            onRemoveIngredient={handleRemoveIngredient}
            onCombine={handleCombine}
            onReset={handleResetCauldron}
            onDropIngredient={handleAddIngredient}
          />
        </div>

        {/* Right Flank: Grimoire & History */}
        <div className={`workbench-panel panel-grimoire ${mobileTab === 'grimorio' ? 'mobile-active' : ''}`}>
          <RecipeBook
            mode={mode}
            discoveredRecipes={discoveredInCurrentMode}
            allRecipes={currentModeRecipes}
            experimentHistory={experimentHistory}
            onAutoFillRecipe={handleAutoFillRecipe}
          />
        </div>
      </main>

      {/* ========================================================
          MERCADO & COMÉRCIO DE ARTON (LOJAS LOGO ABAIXO DE TUDO)
         ======================================================== */}
      <section className="workbench-market-bar" aria-label="Lojas e Comércio de Arton">
        {/* Loja de Cozinha Button */}
        <div
          className="market-store-card kitchen-card"
          onClick={() => {
            setShopType('cozinha');
            setIsShopOpen(true);
          }}
          role="button"
          tabIndex={0}
          title="Abrir Loja de Cozinha"
        >
          <div className="market-store-header">
            <span className="market-store-badge kitchen-badge">Taverna & Culinária</span>
          </div>
          <div className="market-store-content">
            <div className="market-store-icon kitchen-icon">🍳</div>
            <div className="market-store-text">
              <h3>Loja de Cozinha</h3>
            </div>
            <button className="market-store-btn kitchen-btn" type="button">
              <span>Visitar Loja</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Loja de Alquimia Button */}
        <div
          className="market-store-card alchemy-card"
          onClick={() => {
            setShopType('alquimia');
            setIsShopOpen(true);
          }}
          role="button"
          tabIndex={0}
          title="Abrir Loja de Alquimia"
        >
          <div className="market-store-header">
            <span className="market-store-badge alchemy-badge">Guilda dos Boticários</span>
          </div>
          <div className="market-store-content">
            <div className="market-store-icon alchemy-icon">⚗️</div>
            <div className="market-store-text">
              <h3>Loja de Alquimia</h3>
            </div>
            <button className="market-store-btn alchemy-btn" type="button">
              <span>Visitar Loja</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Celebration Modal on New Discovery */}
      <DiscoveryModal
        recipe={newDiscovery}
        onClose={() => setNewDiscovery(null)}
      />

      {/* Tormenta 20 Biome Collector Modal */}
      <BiomeCollectorModal
        isOpen={isCollectorOpen}
        onClose={() => setIsCollectorOpen(false)}
        onAddGatheredItems={handleAddGatheredItems}
      />

      {/* Treasure Chest Recipe Roller Modal */}
      <RecipeChestModal
        isOpen={isChestRollerOpen}
        onClose={() => setIsChestRollerOpen(false)}
        allAlchemyRecipes={alchemyData as Recipe[]}
        allGastroRecipes={gastronomyData as Recipe[]}
        discoveredRecipeIds={new Set(discoveredRecipes.map(r => r.id))}
        onUnlockRecipe={recipe => {
          if (!discoveredRecipes.some(r => r.id === recipe.id)) {
            setDiscoveredRecipes(prev => [recipe, ...prev]);
          }
          showNotification(`Pergaminho de "${recipe.name}" aprendido com sucesso e registrado no Grimório!`);
        }}
      />

      {/* Tormenta 20 Shop Modal (Kitchen & Alchemy) */}
      <ShopModal
        isOpen={isShopOpen}
        shopType={shopType}
        onClose={() => setIsShopOpen(false)}
        onSwitchShop={type => setShopType(type)}
        playerInventory={playerInventory}
        discoveredRecipeIds={new Set(discoveredRecipes.map(r => r.id))}
        onBuyIngredient={handleBuyIngredient}
        onBuyRecipe={handleBuyRecipe}
        masterIngredients={masterIngredients}
        allAlchemyRecipes={alchemyData as Recipe[]}
        allGastroRecipes={gastronomyData as Recipe[]}
      />

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Navegação móvel da bancada">
        <button
          className={`mobile-bottom-nav-item ${mobileTab === 'prateleira' ? 'active' : ''}`}
          onClick={() => {
            setMobileTab('prateleira');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <span className="nav-icon-box">🎒</span>
          <span>Mochila</span>
        </button>

        <button
          className={`mobile-bottom-nav-item ${mobileTab === 'caldeirao' ? 'active' : ''}`}
          onClick={() => {
            setMobileTab('caldeirao');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <span className="nav-icon-box">
            🧙‍♂️
            {slottedIngredients.length > 0 && (
              <span className="nav-badge">{slottedIngredients.length}</span>
            )}
          </span>
          <span>Caldeirão</span>
        </button>

        <button
          className={`mobile-bottom-nav-item ${mobileTab === 'grimorio' ? 'active' : ''}`}
          onClick={() => {
            setMobileTab('grimorio');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <span className="nav-icon-box">
            📜
            {discoveredInCurrentMode.length > 0 && (
              <span className="nav-badge" style={{ background: '#c59341' }}>{discoveredInCurrentMode.length}</span>
            )}
          </span>
          <span>Grimório</span>
        </button>

        <button
          className="mobile-bottom-nav-item"
          onClick={() => {
            setShopType(mode === 'alquimia' ? 'alquimia' : 'cozinha');
            setIsShopOpen(true);
          }}
        >
          <span className="nav-icon-box">🏪</span>
          <span>Lojas</span>
        </button>
      </nav>
    </div>
  );
};
