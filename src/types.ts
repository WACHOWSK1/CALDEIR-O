export type Rarity = 'comum' | 'incomum' | 'raro' | 'lendário';

export type NaturalResourceType = 'Mantimento' | 'Ingrediente' | 'Fonte' | 'Matéria-Prima';

export interface Ingredient {
  id: string;
  name: string;
  normName: string;
  category: string;
  rarity: Rarity;
  quantity: number;
  description: string;
  resourceType: NaturalResourceType;
  originRegion?: string;
  isEdible: boolean;
  singleEffect?: string;
  price?: number;
}

export interface Recipe {
  id: string;
  name: string;
  effect: string;
  category: string;
  ingredients: string[];
  normalizedIngredients: string[];
}

export type CraftMode = 'alquimia' | 'cozinha';

export type CauldronState = 'idle' | 'receiving' | 'boiling' | 'reacting' | 'success' | 'unstable';

export interface ExperimentLog {
  id: string;
  timestamp: string;
  mode: CraftMode;
  ingredients: string[];
  resultName?: string;
  effect?: string;
  isSuccess: boolean;
}
