import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Ingredient, Recipe, Rarity } from '../types';
import { 
  X, 
  Store, 
  Sparkles, 
  Utensils, 
  RefreshCw, 
  Check, 
  Plus, 
  Minus, 
  BookOpen, 
  ChevronRight,
  PackageCheck
} from 'lucide-react';

export type ShopType = 'cozinha' | 'alquimia';

export interface ShopIngredientStock {
  ingredient: Ingredient;
  stock: number;
  maxStock: number;
}

interface Props {
  isOpen: boolean;
  shopType: ShopType;
  onClose: () => void;
  onSwitchShop: (type: ShopType) => void;
  playerInventory: Ingredient[];
  discoveredRecipeIds: Set<string>;
  discoveredRecipes?: Recipe[];
  onBuyIngredient: (ingredient: Ingredient, quantity: number, totalCost: number) => void;
  onBuyRecipe: (recipe: Recipe, cost: number) => void;
  masterIngredients: Ingredient[];
  allAlchemyRecipes: Recipe[];
  allGastroRecipes: Recipe[];
}

export const ShopModal: React.FC<Props> = ({
  isOpen,
  shopType,
  onClose,
  onSwitchShop,
  playerInventory,
  discoveredRecipeIds,
  discoveredRecipes,
  onBuyIngredient,
  onBuyRecipe,
  masterIngredients,
  allAlchemyRecipes,
  allGastroRecipes
}) => {
  // Local states for shops stock
  const [kitchenStock, setKitchenStock] = useState<ShopIngredientStock[]>([]);
  const [alchemyStock, setAlchemyStock] = useState<ShopIngredientStock[]>([]);
  const [kitchenRecipes, setKitchenRecipes] = useState<Recipe[]>([]);
  const [alchemyRecipes, setAlchemyRecipes] = useState<Recipe[]>([]);

  // Selected quantity for each ingredient: { [ingredientId]: quantity }
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});
  
  // Feedback message / toast inside shop
  const [shopNotice, setShopNotice] = useState<string | null>(null);
  const [isRestocking, setIsRestocking] = useState(false);

  // Hovered recipe item for floating box portal (to overlap everything and avoid clipping)
  const [hoveredRecipeItem, setHoveredRecipeItem] = useState<{
    ingredient: Ingredient;
    matchingRecipes: Recipe[];
    rect: DOMRect;
  } | null>(null);

  // Clear hovered recipe tooltip on shop change, modal close or restocking
  useEffect(() => {
    setHoveredRecipeItem(null);
  }, [shopType, isOpen, isRestocking]);

  // Dismiss floating box on window scroll or resize
  useEffect(() => {
    if (!hoveredRecipeItem) return;
    const handleDismiss = () => setHoveredRecipeItem(null);
    window.addEventListener('resize', handleDismiss);
    window.addEventListener('scroll', handleDismiss, true);
    return () => {
      window.removeEventListener('resize', handleDismiss);
      window.removeEventListener('scroll', handleDismiss, true);
    };
  }, [hoveredRecipeItem]);


  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Consolidated list of recipes in player's possession
  const playerDiscoveredRecipes = useMemo(() => {
    if (discoveredRecipes && discoveredRecipes.length > 0) {
      return discoveredRecipes;
    }
    const all = [...allAlchemyRecipes, ...allGastroRecipes];
    return all.filter(r => discoveredRecipeIds.has(r.id));
  }, [discoveredRecipes, allAlchemyRecipes, allGastroRecipes, discoveredRecipeIds]);

  // Map of normalized ingredient name -> array of recipes that use it
  const playerRecipesByIngredient = useMemo(() => {
    const map = new Map<string, Recipe[]>();
    playerDiscoveredRecipes.forEach(recipe => {
      const ingList = [
        ...(recipe.normalizedIngredients || []),
        ...(recipe.ingredients || [])
      ];
      const seen = new Set<string>();
      ingList.forEach(rawIng => {
        if (!rawIng) return;
        const norm = normalize(rawIng);
        if (norm && !seen.has(norm)) {
          seen.add(norm);
          const list = map.get(norm) || [];
          list.push(recipe);
          map.set(norm, list);
        }
      });
    });
    return map;
  }, [playerDiscoveredRecipes]);

  // Helper to retrieve player recipes for a given ingredient
  const getIngredientPlayerRecipes = useCallback((ingredient: Ingredient): Recipe[] => {
    const normsToCheck = [
      ingredient.normName ? normalize(ingredient.normName) : '',
      ingredient.name ? normalize(ingredient.name) : '',
      ingredient.id ? normalize(ingredient.id) : ''
    ].filter(Boolean);

    for (const n of normsToCheck) {
      const list = playerRecipesByIngredient.get(n);
      if (list && list.length > 0) {
        return list;
      }
    }
    return [];
  }, [playerRecipesByIngredient]);


  // Ingredient unit price mapping:
  // T$50 para comuns, T$200 para incomuns, T$400 para raros, T$1000 para lendários
  const getIngredientUnitPrice = (rarity: Rarity): number => {
    switch (rarity) {
      case 'lendário':
        return 1000;
      case 'raro':
        return 400;
      case 'incomum':
        return 200;
      default:
        return 50;
    }
  };

  // Master ingredients map by normName for fast lookup
  const masterMap = useMemo(() => {
    const map = new Map<string, Ingredient>();
    masterIngredients.forEach(ing => {
      const norm = ing.normName || normalize(ing.name);
      map.set(norm, ing);
    });
    return map;
  }, [masterIngredients]);

  // Set of normalized names of ingredients used in gastronomy
  const gastroIngredientNorms = useMemo(() => {
    const set = new Set<string>();
    allGastroRecipes.forEach(r => {
      (r.normalizedIngredients || r.ingredients).forEach(name => {
        set.add(normalize(name));
      });
    });
    return set;
  }, [allGastroRecipes]);

  // Set of normalized names of ingredients used in alchemy
  const alqIngredientNorms = useMemo(() => {
    const set = new Set<string>();
    allAlchemyRecipes.forEach(r => {
      (r.normalizedIngredients || r.ingredients).forEach(name => {
        set.add(normalize(name));
      });
    });
    return set;
  }, [allAlchemyRecipes]);

  // Recipe price calculation based on ingredients:
  // T$200: só com itens comuns
  // T$400: pelo menos um item incomum
  // T$800: pelo menos um item raro
  // T$2000: pelo menos um item lendário
  const getRecipePriceAndTier = useCallback((recipe: Recipe) => {
    const rarities: Rarity[] = (recipe.normalizedIngredients || recipe.ingredients).map(ingName => {
      const item = masterMap.get(normalize(ingName));
      return item ? item.rarity : 'comum';
    });

    if (rarities.includes('lendário')) {
      return { price: 2000, tierName: 'Lendária', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.18)' };
    }
    if (rarities.includes('raro')) {
      return { price: 800, tierName: 'Rara', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.18)' };
    }
    if (rarities.includes('incomum')) {
      return { price: 400, tierName: 'Incomum', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.18)' };
    }
    return { price: 200, tierName: 'Comum', color: '#d1d5db', bg: 'rgba(209, 213, 219, 0.12)' };
  }, [masterMap]);

  // Helper to pick stratified ingredients (e.g. 6 comuns, 3 incomuns, 2 raros, 1 lendário, total = 12)
  const generateShopIngredients = useCallback((pool: Ingredient[]): ShopIngredientStock[] => {
    const comuns = pool.filter(i => i.rarity === 'comum').sort(() => 0.5 - Math.random());
    const incomuns = pool.filter(i => i.rarity === 'incomum').sort(() => 0.5 - Math.random());
    const raros = pool.filter(i => i.rarity === 'raro').sort(() => 0.5 - Math.random());
    const lendarios = pool.filter(i => i.rarity === 'lendário').sort(() => 0.5 - Math.random());

    const picked: Ingredient[] = [];

    // Aim for: 1 lendário (if available), 2 raros, 3 incomuns, remaining comuns to reach 12
    if (lendarios.length > 0) picked.push(lendarios[0]);
    picked.push(...raros.slice(0, Math.min(2, raros.length)));
    picked.push(...incomuns.slice(0, Math.min(3, incomuns.length)));
    
    const needed = 12 - picked.length;
    picked.push(...comuns.slice(0, Math.min(needed, comuns.length)));

    // If still less than 12, fill from rest of pool
    if (picked.length < 12) {
      const pickedIds = new Set(picked.map(p => p.id));
      const remaining = pool.filter(p => !pickedIds.has(p.id)).sort(() => 0.5 - Math.random());
      picked.push(...remaining.slice(0, 12 - picked.length));
    }

    return picked.slice(0, 12).map(ingredient => ({
      ingredient,
      stock: 5,
      maxStock: 5
    }));
  }, []);

  // Helper to pick 4 recipes
  const generateShopRecipes = useCallback((recipesPool: Recipe[]): Recipe[] => {
    const undiscovered = recipesPool.filter(r => !discoveredRecipeIds.has(r.id)).sort(() => 0.5 - Math.random());
    if (undiscovered.length >= 4) {
      return undiscovered.slice(0, 4);
    }
    const alreadyDiscovered = recipesPool.filter(r => discoveredRecipeIds.has(r.id)).sort(() => 0.5 - Math.random());
    return [...undiscovered, ...alreadyDiscovered].slice(0, 4);
  }, [discoveredRecipeIds]);

  // Restock Kitchen Shop
  const handleRestockKitchen = useCallback(() => {
    setIsRestocking(true);
    const kitchenPool = masterIngredients.filter(i => i.isEdible || gastroIngredientNorms.has(i.normName || normalize(i.name)));
    const newStock = generateShopIngredients(kitchenPool);
    const newRecipes = generateShopRecipes(allGastroRecipes);
    setKitchenStock(newStock);
    setKitchenRecipes(newRecipes);

    const storageData = {
      items: newStock.map(s => ({ id: s.ingredient.id, stock: s.stock })),
      recipeIds: newRecipes.map(r => r.id)
    };
    localStorage.setItem('caldeiro_shop_cozinha_v2', JSON.stringify(storageData));

    const qtyInit: Record<string, number> = {};
    newStock.forEach(s => { qtyInit[s.ingredient.id] = 1; });
    setSelectedQty(prev => ({ ...prev, ...qtyInit }));

    setTimeout(() => {
      setIsRestocking(false);
      setShopNotice('Novo carregamento de mantimentos e especiarias chegou à Loja de Cozinha!');
      setTimeout(() => setShopNotice(null), 3000);
    }, 300);
  }, [masterIngredients, gastroIngredientNorms, allGastroRecipes, generateShopIngredients, generateShopRecipes]);

  // Restock Alchemy Shop
  const handleRestockAlchemy = useCallback(() => {
    setIsRestocking(true);
    const alqPool = masterIngredients.filter(i => !i.isEdible || alqIngredientNorms.has(i.normName || normalize(i.name)));
    const newStock = generateShopIngredients(alqPool);
    const newRecipes = generateShopRecipes(allAlchemyRecipes);
    setAlchemyStock(newStock);
    setAlchemyRecipes(newRecipes);

    const storageData = {
      items: newStock.map(s => ({ id: s.ingredient.id, stock: s.stock })),
      recipeIds: newRecipes.map(r => r.id)
    };
    localStorage.setItem('caldeiro_shop_alquimia_v2', JSON.stringify(storageData));

    const qtyInit: Record<string, number> = {};
    newStock.forEach(s => { qtyInit[s.ingredient.id] = 1; });
    setSelectedQty(prev => ({ ...prev, ...qtyInit }));

    setTimeout(() => {
      setIsRestocking(false);
      setShopNotice('A Guilda dos Boticários recebeu uma nova remessa de reagentes e fórmulas!');
      setTimeout(() => setShopNotice(null), 3000);
    }, 300);
  }, [masterIngredients, alqIngredientNorms, allAlchemyRecipes, generateShopIngredients, generateShopRecipes]);

  // Initialize stocks from localStorage or generate on first load
  useEffect(() => {
    if (masterIngredients.length === 0) return;

    // Kitchen init
    const savedKitchen = localStorage.getItem('caldeiro_shop_cozinha_v2');
    if (savedKitchen) {
      try {
        const parsed = JSON.parse(savedKitchen);
        const restoredStock: ShopIngredientStock[] = (parsed.items || [])
          .map((item: { id: string; stock: number }) => {
            const ing = masterIngredients.find(m => m.id === item.id);
            return ing ? { ingredient: ing, stock: item.stock, maxStock: 5 } : null;
          })
          .filter(Boolean);

        const restoredRecipes: Recipe[] = (parsed.recipeIds || [])
          .map((id: string) => allGastroRecipes.find(r => r.id === id))
          .filter(Boolean);

        if (restoredStock.length === 12 && restoredRecipes.length === 4) {
          setKitchenStock(restoredStock);
          setKitchenRecipes(restoredRecipes);
        } else {
          handleRestockKitchen();
        }
      } catch {
        handleRestockKitchen();
      }
    } else {
      handleRestockKitchen();
    }

    // Alchemy init
    const savedAlchemy = localStorage.getItem('caldeiro_shop_alquimia_v2');
    if (savedAlchemy) {
      try {
        const parsed = JSON.parse(savedAlchemy);
        const restoredStock: ShopIngredientStock[] = (parsed.items || [])
          .map((item: { id: string; stock: number }) => {
            const ing = masterIngredients.find(m => m.id === item.id);
            return ing ? { ingredient: ing, stock: item.stock, maxStock: 5 } : null;
          })
          .filter(Boolean);

        const restoredRecipes: Recipe[] = (parsed.recipeIds || [])
          .map((id: string) => allAlchemyRecipes.find(r => r.id === id))
          .filter(Boolean);

        if (restoredStock.length === 12 && restoredRecipes.length === 4) {
          setAlchemyStock(restoredStock);
          setAlchemyRecipes(restoredRecipes);
        } else {
          handleRestockAlchemy();
        }
      } catch {
        handleRestockAlchemy();
      }
    } else {
      handleRestockAlchemy();
    }
  }, [masterIngredients, allGastroRecipes, allAlchemyRecipes, handleRestockKitchen, handleRestockAlchemy]);

  // Current active shop data
  const currentStock = shopType === 'cozinha' ? kitchenStock : alchemyStock;
  const currentRecipes = shopType === 'cozinha' ? kitchenRecipes : alchemyRecipes;

  // Change quantity stepper
  const handleSetQty = (id: string, newQty: number, maxAvailable: number) => {
    const clamped = Math.max(1, Math.min(maxAvailable, newQty));
    setSelectedQty(prev => ({ ...prev, [id]: clamped }));
  };

  // Buy ingredient action
  const handlePurchaseIngredient = (itemStock: ShopIngredientStock) => {
    const { ingredient, stock } = itemStock;
    if (stock <= 0) return;

    const qtyToBuy = Math.min(stock, selectedQty[ingredient.id] || 1);
    const unitPrice = getIngredientUnitPrice(ingredient.rarity);
    const totalCost = unitPrice * qtyToBuy;

    // Process purchase in parent (no player wallet balance restriction)
    onBuyIngredient(ingredient, qtyToBuy, totalCost);

    // Update local shop stock
    const updateStockList = (list: ShopIngredientStock[]) =>
      list.map(s => {
        if (s.ingredient.id === ingredient.id) {
          const nextStock = Math.max(0, s.stock - qtyToBuy);
          return { ...s, stock: nextStock };
        }
        return s;
      });

    if (shopType === 'cozinha') {
      setKitchenStock(prev => {
        const next = updateStockList(prev);
        const storageData = {
          items: next.map(s => ({ id: s.ingredient.id, stock: s.stock })),
          recipeIds: kitchenRecipes.map(r => r.id)
        };
        localStorage.setItem('caldeiro_shop_cozinha_v2', JSON.stringify(storageData));
        return next;
      });
    } else {
      setAlchemyStock(prev => {
        const next = updateStockList(prev);
        const storageData = {
          items: next.map(s => ({ id: s.ingredient.id, stock: s.stock })),
          recipeIds: alchemyRecipes.map(r => r.id)
        };
        localStorage.setItem('caldeiro_shop_alquimia_v2', JSON.stringify(storageData));
        return next;
      });
    }

    // Reset selected quantity
    setSelectedQty(prev => ({
      ...prev,
      [ingredient.id]: Math.min(1, Math.max(0, stock - qtyToBuy))
    }));

    setShopNotice(`+${qtyToBuy}x "${ingredient.name}" guardado(s) na sua mochila (T$ ${totalCost}).`);
    setTimeout(() => setShopNotice(null), 3000);
  };

  // Buy recipe action
  const handlePurchaseRecipe = (recipe: Recipe) => {
    if (discoveredRecipeIds.has(recipe.id)) return;

    const { price } = getRecipePriceAndTier(recipe);
    onBuyRecipe(recipe, price);

    setShopNotice(`Pergaminho de "${recipe.name}" aprendido e registrado no Grimório (T$ ${price})!`);
    setTimeout(() => setShopNotice(null), 3000);
  };

  // Get current quantity in player's backpack
  const getPlayerBackpackQty = (ingredient: Ingredient) => {
    const norm = ingredient.normName || normalize(ingredient.name);
    const item = playerInventory.find(i => (i.normName || normalize(i.name)) === norm);
    return item ? item.quantity : 0;
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
        return { color: '#38bdf8', text: 'Raro', bg: 'rgba(56, 189, 248, 0.15)' };
      case 'incomum':
        return { color: '#22c55e', text: 'Incomum', bg: 'rgba(34, 197, 94, 0.15)' };
      default:
        return { color: '#a8a29e', text: 'Comum', bg: 'rgba(168, 162, 158, 0.1)' };
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.86)',
        backdropFilter: 'blur(7px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="modal-dialog-card shop-modal-card"
        style={{
          background: shopType === 'cozinha'
            ? 'linear-gradient(180deg, #241910 0%, #15100c 100%)'
            : 'linear-gradient(180deg, #1b1322 0%, #110d18 100%)',
          border: shopType === 'cozinha' ? '1px solid #7c4d28' : '1px solid #5b327a',
          borderRadius: '16px',
          padding: '22px',
          maxWidth: '1120px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: shopType === 'cozinha'
            ? '0 12px 48px rgba(0,0,0,0.85), 0 0 32px rgba(234, 88, 12, 0.15)'
            : '0 12px 48px rgba(0,0,0,0.85), 0 0 32px rgba(147, 51, 234, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid #4a382a',
            color: '#a89885',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10
          }}
          title="Fechar mercado"
        >
          <X size={16} />
        </button>

        {/* ========================================================
            TOP HEADER: SHOP TABS, TITLE & RESTOCK
           ======================================================== */}
        <header style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
          {/* Shop Switcher Tabs + Restock Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            paddingRight: '36px'
          }}>
            {/* Dual Tabs */}
            <div style={{
              display: 'flex',
              background: '#0d0a08',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid #3d2c20',
              gap: '4px'
            }}>
              <button
                onClick={() => onSwitchShop('cozinha')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: '7px',
                  border: 'none',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: shopType === 'cozinha'
                    ? 'linear-gradient(180deg, #ea580c 0%, #9a3412 100%)'
                    : 'transparent',
                  color: shopType === 'cozinha' ? '#ffffff' : '#9ca3af',
                  boxShadow: shopType === 'cozinha' ? '0 2px 10px rgba(234, 88, 12, 0.4)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <Utensils size={16} />
                <span>Loja de Cozinha</span>
              </button>

              <button
                onClick={() => onSwitchShop('alquimia')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: '7px',
                  border: 'none',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: shopType === 'alquimia'
                    ? 'linear-gradient(180deg, #9333ea 0%, #6b21a8 100%)'
                    : 'transparent',
                  color: shopType === 'alquimia' ? '#ffffff' : '#9ca3af',
                  boxShadow: shopType === 'alquimia' ? '0 2px 10px rgba(147, 51, 234, 0.4)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <Sparkles size={16} />
                <span>Loja de Alquimia</span>
              </button>
            </div>

            {/* Restock Button */}
            <button
              onClick={shopType === 'cozinha' ? handleRestockKitchen : handleRestockAlchemy}
              disabled={isRestocking}
              title="Sortear novo carregamento de mercadorias"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(180deg, #2b1f15 0%, #1c140e 100%)',
                border: '1px solid #c59341',
                color: '#fef08a',
                padding: '8px 14px',
                borderRadius: '8px',
                fontFamily: 'var(--font-display)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: isRestocking ? 'wait' : 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                transition: 'all 0.15s'
              }}
            >
              <RefreshCw size={14} color="#facc15" style={{ animation: isRestocking ? 'spin 1s linear infinite' : 'none' }} />
              <span>Novo Carregamento</span>
            </button>
          </div>

          {/* Banner Description */}
          <div style={{
            background: 'rgba(0,0,0,0.25)',
            borderLeft: shopType === 'cozinha' ? '3px solid #ea580c' : '3px solid #a855f7',
            padding: '8px 14px',
            borderRadius: '0 6px 6px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.08rem',
                color: '#f5edd6',
                letterSpacing: '0.5px'
              }}>
                {shopType === 'cozinha' ? '🍲 Empório Culinário & Mercearia' : '⚗️ Boticário Imperial & Reagentes'}
              </h2>
              <p style={{ fontSize: '0.74rem', color: '#a89885', marginTop: '2px' }}>
                {shopType === 'cozinha'
                  ? 'Ingredientes frescos de taverna e receitas gastronômicas prontas para o seu Caldeirão.'
                  : 'Reagentes arcanos, essências raras e fórmulas de poções e óleos de Tormenta 20.'}
              </p>
            </div>
          </div>

          {/* In-Shop Feedback Toast */}
          {shopNotice && (
            <div style={{
              background: 'rgba(21, 128, 61, 0.95)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <Check size={15} />
              <span>{shopNotice}</span>
            </div>
          )}
        </header>

        {/* ========================================================
            MODAL SCROLLABLE CONTENT (12 INGREDIENTS + 4 RECIPES)
           ======================================================== */}
        <div
          onScroll={() => {
            if (hoveredRecipeItem) setHoveredRecipeItem(null);
          }}
          style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px'
        }}>
          {/* ----------------------------------------------------
              SECTION 1: 12 INGREDIENTS (STOCK OF 5 PER ITEM)
             ---------------------------------------------------- */}
          <section>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.96rem',
                color: '#f5edd6',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Store size={16} color="#c59341" />
                <span>Ingredientes Disponíveis</span>
              </h3>
            </div>

            {/* Grid of 12 Ingredients */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '10px',
              paddingTop: '10px'
            }}>
              {currentStock.map(itemStock => {
                const { ingredient, stock } = itemStock;
                const rarity = getRarityBadge(ingredient.rarity);
                const unitPrice = getIngredientUnitPrice(ingredient.rarity);
                const currentSelected = Math.min(Math.max(1, selectedQty[ingredient.id] || 1), Math.max(1, stock));
                const totalCost = unitPrice * currentSelected;
                const isOutOfStock = stock <= 0;
                const playerBackpackCount = getPlayerBackpackQty(ingredient);

                // Check if this ingredient is part of any recipe the player possesses
                const matchingRecipes = getIngredientPlayerRecipes(ingredient);
                const isPartOfPlayerRecipe = matchingRecipes.length > 0;

                return (
                  <div
                    key={ingredient.id}
                    className={isPartOfPlayerRecipe && !isOutOfStock ? 'shop-item-card-recipe-match' : ''}
                    onMouseEnter={(e) => {
                      if (isPartOfPlayerRecipe && !isOutOfStock) {
                        setHoveredRecipeItem({
                          ingredient,
                          matchingRecipes,
                          rect: e.currentTarget.getBoundingClientRect()
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredRecipeItem(null);
                    }}
                    style={{
                      background: isOutOfStock ? '#15110e' : '#1c1511',
                      border: isOutOfStock
                        ? '1px solid #2d2118'
                        : isPartOfPlayerRecipe
                          ? '1px solid rgba(34, 197, 94, 0.75)'
                          : `1px solid ${rarity.color + '44'}`,
                      borderRadius: '8px',
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px',
                      opacity: isOutOfStock ? 0.6 : 1,
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      position: 'relative',
                      boxShadow: isPartOfPlayerRecipe && !isOutOfStock
                        ? '0 0 14px rgba(34, 197, 94, 0.25), inset 0 0 10px rgba(34, 197, 94, 0.08)'
                        : 'none'
                    }}
                  >
                    {/* Top Info */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <span style={{ fontSize: '20px', position: 'relative', display: 'inline-flex' }}>
                            {getItemEmoji(ingredient.category)}
                            {isPartOfPlayerRecipe && !isOutOfStock && (
                              <span
                                style={{
                                  position: 'absolute',
                                  top: '-2px',
                                  right: '-3px',
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  background: '#22c55e',
                                  boxShadow: '0 0 6px #22c55e'
                                }}
                              />
                            )}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <p style={{
                              fontSize: '0.84rem',
                              fontWeight: 700,
                              color: isPartOfPlayerRecipe && !isOutOfStock ? '#86efac' : '#ede3d1',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }} title={ingredient.name}>
                              {ingredient.name}
                            </p>
                            <span style={{
                              fontSize: '0.62rem',
                              color: rarity.color,
                              background: rarity.bg,
                              padding: '1px 5px',
                              borderRadius: '3px',
                              fontWeight: 600,
                              textTransform: 'uppercase'
                            }}>
                              {rarity.text}
                            </span>
                          </div>
                        </div>

                        {/* Top Right: Recipe Indicator (Visual badge without text) + Stock Pill */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {isPartOfPlayerRecipe && !isOutOfStock && (
                            <div
                              className="shop-item-recipe-indicator"
                              aria-label="Item de receita"
                            >
                              <BookOpen size={13} color="#86efac" />
                            </div>
                          )}

                          {/* Stock Pill */}
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isOutOfStock ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                            color: isOutOfStock ? '#f87171' : '#facc15',
                            border: `1px solid ${isOutOfStock ? '#ef4444' : '#ca8a04'}`,
                            flexShrink: 0
                          }}>
                            {isOutOfStock ? 'Esgotado' : `Estoque: ${stock}/5`}
                          </span>
                        </div>
                      </div>

                      {/* Origin & Backpack Tracker */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '6px',
                        fontSize: '0.68rem',
                        color: '#8c7e6f'
                      }}>
                        <span>Preço: <b style={{ color: '#fef08a' }}>T$ {unitPrice}</b> cada</span>
                        <span>Mochila: <b style={{ color: '#d4c8b8' }}>{playerBackpackCount} un</b></span>
                      </div>
                    </div>

                    {/* Bottom: Stepper + Buy Button */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '4px',
                      paddingTop: '8px',
                      borderTop: '1px solid #2a1f18'
                    }}>
                      {/* Quantity Stepper (1 to remaining stock) */}
                      {!isOutOfStock ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          background: '#120e0b',
                          border: '1px solid #4a382a',
                          borderRadius: '5px',
                          overflow: 'hidden'
                        }}>
                          <button
                            type="button"
                            disabled={currentSelected <= 1}
                            onClick={() => handleSetQty(ingredient.id, currentSelected - 1, stock)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: currentSelected <= 1 ? '#55473a' : '#a89885',
                              width: '22px',
                              height: '28px',
                              cursor: currentSelected <= 1 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Minus size={11} />
                          </button>
                          <span style={{
                            width: '26px',
                            textAlign: 'center',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#f5edd6'
                          }}>
                            {currentSelected}
                          </span>
                          <button
                            type="button"
                            disabled={currentSelected >= stock}
                            onClick={() => handleSetQty(ingredient.id, currentSelected + 1, stock)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: currentSelected >= stock ? '#55473a' : '#a89885',
                              width: '22px',
                              height: '28px',
                              cursor: currentSelected >= stock ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      ) : null}

                      {/* Buy Action Button */}
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handlePurchaseIngredient(itemStock)}
                        title={
                          isOutOfStock
                            ? 'Item sem estoque no momento'
                            : `Adquirir ${currentSelected}x ${ingredient.name}`
                        }
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: '5px',
                          border: isOutOfStock ? '1px solid #3d2c20' : '1px solid #eab308',
                          background: isOutOfStock
                            ? '#1c1511'
                            : 'linear-gradient(180deg, #c59341 0%, #8c5d1b 100%)',
                          color: isOutOfStock ? '#6e5a48' : '#ffffff',
                          fontFamily: 'var(--font-display)',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: !isOutOfStock ? '0 2px 6px rgba(0,0,0,0.4)' : 'none',
                          transition: 'all 0.15s'
                        }}
                      >
                        {isOutOfStock ? (
                          <span>Esgotado</span>
                        ) : (
                          <>
                            <PackageCheck size={14} />
                            <span>T$ {totalCost}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Floating box is rendered globally via portal below to overlap everything without clipping */}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ----------------------------------------------------
              SECTION 2: 4 RECIPES FOR SALE
             ---------------------------------------------------- */}
          <section style={{
            background: 'rgba(15, 11, 8, 0.6)',
            border: '1px solid #3d2c20',
            borderRadius: '12px',
            padding: '14px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.98rem',
                  color: '#f5edd6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <BookOpen size={16} color="#c59341" />
                  <span>Fórmulas & Receitas</span>
                </h3>
                <p style={{ fontSize: '0.72rem', color: '#a89885', marginTop: '2px' }}>
                  Ao adquirir, a fórmula é imediatamente registrada no seu Grimório e liberada para preparo no Caldeirão.
                </p>
              </div>
            </div>

            {/* Grid of 4 Recipes */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '12px'
            }}>
              {currentRecipes.map(recipe => {
                const { price, tierName, color, bg } = getRecipePriceAndTier(recipe);
                const isAlreadyKnown = discoveredRecipeIds.has(recipe.id);

                return (
                  <div
                    key={recipe.id}
                    style={{
                      background: '#19130f',
                      border: isAlreadyKnown ? '1px solid #15803d' : `1px solid ${color}44`,
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      position: 'relative'
                    }}
                  >
                    {/* Header */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div>
                          <h4 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            color: '#f5edd6',
                            lineHeight: 1.3
                          }}>
                            {recipe.name}
                          </h4>
                          <span style={{
                            fontSize: '0.62rem',
                            color,
                            background: bg,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            marginTop: '4px',
                            display: 'inline-block'
                          }}>
                            Fórmula {tierName} • {recipe.category}
                          </span>
                        </div>

                        {/* Price Badge */}
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          color: '#fef08a',
                          background: 'rgba(0,0,0,0.4)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid #c59341',
                          whiteSpace: 'nowrap'
                        }}>
                          T$ {price}
                        </span>
                      </div>

                      {/* Effect description */}
                      <p style={{
                        fontSize: '0.72rem',
                        color: '#b8a688',
                        lineHeight: 1.35,
                        margin: '8px 0',
                        fontFamily: 'var(--font-flavor)'
                      }}>
                        "{recipe.effect}"
                      </p>

                      {/* Required Reagents Pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {recipe.ingredients.map((ing, idx) => {
                          const norm = normalize(ing);
                          const playerHas = playerInventory.some(i => (i.normName || normalize(i.name)) === norm);
                          return (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.62rem',
                                padding: '1px 6px',
                                borderRadius: '3px',
                                background: playerHas ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0,0,0,0.35)',
                                color: playerHas ? '#86efac' : '#9ca3af',
                                border: `1px solid ${playerHas ? '#22c55e' : '#3d2c20'}`
                              }}
                              title={playerHas ? `Você possui "${ing}" na mochila` : `Não possui "${ing}"`}
                            >
                              {playerHas ? '✓ ' : ''}{ing}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Buy Recipe Action */}
                    <button
                      type="button"
                      disabled={isAlreadyKnown}
                      onClick={() => handlePurchaseRecipe(recipe)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: isAlreadyKnown ? '1px solid #166534' : '1px solid #c59341',
                        background: isAlreadyKnown
                          ? '#14532d'
                          : 'linear-gradient(180deg, #c59341 0%, #8c5d1b 100%)',
                        color: isAlreadyKnown ? '#bbf7d0' : '#ffffff',
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: isAlreadyKnown ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s'
                      }}
                    >
                      {isAlreadyKnown ? (
                        <>
                          <Check size={14} />
                          <span>Já no Grimório</span>
                        </>
                      ) : (
                        <>
                          <BookOpen size={14} />
                          <span>T$ {price}</span>
                          <ChevronRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Recipe Item Floating Box Portal - overlaps everything on the page */}
      {hoveredRecipeItem && typeof document !== 'undefined' && createPortal(
        (() => {
          const { rect, matchingRecipes } = hoveredRecipeItem;
          const spaceAbove = rect.top;
          const placeAbove = spaceAbove >= 85;
          const centerX = rect.left + rect.width / 2;
          const clampedLeft = Math.max(160, Math.min(window.innerWidth - 160, centerX));

          return (
            <div
              className={`shop-recipe-floating-portal ${placeAbove ? 'place-above' : 'place-below'}`}
              role="tooltip"
              style={{
                position: 'fixed',
                left: `${clampedLeft}px`,
                top: placeAbove ? `${rect.top - 8}px` : `${rect.bottom + 8}px`,
                transform: placeAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
                pointerEvents: 'none',
                zIndex: 9999999,
                width: 'max-content',
                maxWidth: 'min(320px, calc(100vw - 32px))',
                background: 'rgba(14, 20, 14, 0.98)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid #22c55e',
                borderRadius: '8px',
                padding: '10px 14px',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.95), 0 0 22px rgba(34, 197, 94, 0.5)',
                color: '#f5edd6',
                lineHeight: 1.35,
                userSelect: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', filter: 'drop-shadow(0 0 6px #22c55e)' }}>📜</span>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#86efac',
                  letterSpacing: '0.3px',
                  whiteSpace: 'nowrap'
                }}>
                  item de receita
                </span>
              </div>
              {matchingRecipes.length > 0 && (
                <div style={{
                  marginTop: '6px',
                  paddingTop: '5px',
                  borderTop: '1px solid rgba(34, 197, 94, 0.3)',
                  fontSize: '0.74rem',
                  color: '#d4c8b8',
                  lineHeight: 1.35,
                  whiteSpace: 'normal',
                  textAlign: 'left'
                }}>
                  <span style={{ color: '#4ade80', fontWeight: 600 }}>Receita(s): </span>
                  {matchingRecipes.slice(0, 3).map(r => r.name).join(', ')}
                  {matchingRecipes.length > 3 ? ` (+${matchingRecipes.length - 3})` : ''}
                </div>
              )}
            </div>
          );
        })(),
        document.body
      )}
    </div>
  );
};
