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

export const App: React.FC = () => {
  const [mode, setMode] = useState<CraftMode>('alquimia');
  const [cauldronState, setCauldronState] = useState<CauldronState>('idle');
  const [slottedIngredients, setSlottedIngredients] = useState<Ingredient[]>([]);

  // Initialize ingredients guaranteeing all 287 items from master catalog are present
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const masterList = initialIngredientsData as Ingredient[];
    const savedStr = localStorage.getItem('caldeiro_ingredients_v3');
    if (savedStr) {
      try {
        const savedMap = new Map<string, number>(JSON.parse(savedStr));
        return masterList.map(item => ({
          ...item,
          quantity: savedMap.has(item.normName) ? savedMap.get(item.normName)! : item.quantity
        }));
      } catch (e) {
        console.error('Erro ao restaurar inventario salvo:', e);
      }
    }
    return masterList;
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
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'prateleira' | 'caldeirao' | 'grimorio'>('caldeirao');

  // Active recipes list based on mode
  const currentModeRecipes = mode === 'alquimia' ? (alchemyData as Recipe[]) : (gastronomyData as Recipe[]);
  const discoveredInCurrentMode = discoveredRecipes.filter(r => 
    mode === 'alquimia' ? (r.id.startsWith('alq') || r.id.startsWith('herb_alq') || r.id.startsWith('exp_alq')) 
                        : (r.id.startsWith('gas') || r.id.startsWith('herb_gas') || r.id.startsWith('exp_gas'))
  );

  // Persistence
  useEffect(() => {
    const qtyMap = ingredients.map(i => [i.normName, i.quantity]);
    localStorage.setItem('caldeiro_ingredients_v3', JSON.stringify(qtyMap));
  }, [ingredients]);

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

  // Helper for consistent diacritics and casing normalization
  const getNorm = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // Pre-emptive check: has this exact slotted combination already failed in history?
  const isKnownFailure = useMemo(() => {
    if (slottedIngredients.length < 2) return false;
    const slottedNorms = slottedIngredients.map(i => i.normName || getNorm(i.name)).sort();

    return experimentHistory.some(exp => {
      if (exp.isSuccess) return false;
      const expNorms = exp.ingredients.map(getNorm).sort();
      if (expNorms.length !== slottedNorms.length) return false;
      return expNorms.every((n, idx) => n === slottedNorms[idx]);
    });
  }, [slottedIngredients, experimentHistory]);

  // Add ingredient to cauldron (max 4)
  const handleAddIngredient = (ingredient: Ingredient) => {
    if (slottedIngredients.length >= 4) {
      showNotification('O caldeirão já está com a capacidade máxima de 4 reagentes.');
      return;
    }

    // Check stock availability
    const countInCauldron = slottedIngredients.filter(s => s.normName === ingredient.normName).length;
    if (countInCauldron >= ingredient.quantity) {
      showNotification(`Você já colocou todas as suas ${ingredient.quantity} unidades de "${ingredient.name}" no caldeirão.`);
      return;
    }

    setSlottedIngredients(prev => [...prev, ingredient]);
    setCauldronState('receiving');
    setTimeout(() => setCauldronState('idle'), 350);
  };

  // Remove single ingredient from cauldron
  const handleRemoveIngredient = (index: number) => {
    setSlottedIngredients(prev => prev.filter((_, i) => i !== index));
    setCauldronState('idle');
  };

  // Reset cauldron slots
  const handleResetCauldron = () => {
    setSlottedIngredients([]);
    setCauldronState('idle');
  };

  // Check and craft recipe
  const handleCombine = () => {
    if (slottedIngredients.length < 2) return;

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

      // Deduct consumed ingredients from stock
      setIngredients(prev => prev.map(item => {
        const used = slottedIngredients.filter(s => s.normName === item.normName).length;
        if (used > 0) {
          return { ...item, quantity: Math.max(0, item.quantity - used) };
        }
        return item;
      }));

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
        // Unstable Mixture
        setCauldronState('unstable');
        showNotification('A mistura ferveu e virou cinzas instáveis. A combinação foi registrada em seu histórico para evitar repetições.');

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

  // Autofill recipe from Grimoire
  const handleAutoFillRecipe = (recipe: Recipe) => {
    // Map recipe ingredients to available items
    const needed = recipe.ingredients.map(ingName => {
      const norm = ingName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const found = ingredients.find(i => i.normName === norm || i.name.toLowerCase().trim() === norm);
      return found || {
        id: `temp_${Math.random()}`,
        name: ingName,
        normName: norm,
        category: 'Reagente',
        rarity: 'comum' as const,
        quantity: 1
      };
    });

    setSlottedIngredients(needed.slice(0, 4));
    setCauldronState('idle');
    showNotification(`Reagentes de "${recipe.name}" colocados no caldeirão.`);
  };

  // Add items gathered from Biome Collector
  const handleAddGatheredItems = (itemNames: string[]) => {
    setIngredients(prev => {
      const next = [...prev];
      itemNames.forEach(name => {
        const norm = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        const existing = next.find(i => i.normName === norm);
        if (existing) {
          existing.quantity += 1;
        } else {
          next.unshift({
            id: `gathered_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name,
            normName: norm,
            category: 'Erva/Coletado',
            rarity: 'comum',
            quantity: 1
          });
        }
      });
      return next;
    });

    showNotification(`${itemNames.length} itens coletados guardados na prateleira.`);
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

      {/* Ephemeral Feedback Notice */}
      {feedbackNotice && (
        <div 
          role="alert"
          style={{
            background: 'rgba(28, 21, 17, 0.95)',
            border: '1px solid #c59341',
            color: '#f5edd6',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.84rem',
            textAlign: 'center',
            marginBottom: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {feedbackNotice}
        </div>
      )}

      {/* Mobile Surface Switcher (On Demand Navigation) */}
      <div className="mobile-surface-tabs">
        <button
          className={mobileTab === 'prateleira' ? 'active' : ''}
          onClick={() => setMobileTab('prateleira')}
        >
          🎒 Prateleira ({ingredients.length})
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
        {/* Left Flank: Apothecary Shelves */}
        <div className={`workbench-panel panel-shelf ${mobileTab === 'prateleira' ? 'mobile-active' : ''}`}>
          <IngredientShelf
            ingredients={ingredients}
            onAddIngredient={handleAddIngredient}
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
    </div>
  );
};
