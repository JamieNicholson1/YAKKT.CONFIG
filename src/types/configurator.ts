export interface Chassis {
  id: string;
  name: string;
  basePrice: number;
  modelUrl: string;
  description: string;
}

export interface VanOption {
  id: string;
  name: string;
  price: number;
  modelUrl: string;
  category: 'windows' | 'wheels' | 'roof-racks' | 'rear-accessories' | 'exterior-accessories';
  subCategory?: 'nearside' | 'offside' | 'rack-accessories';
  isExclusive: boolean;
  conflictsWith: string[];
  description: string;
}

export interface ConfigSelection {
  chassisId: string | null;
  selectedOptionIds: Set<string>;
}

export interface PriceData {
  totalPrice: number;
  chassisPrice: number;
  addOnPrices: Record<string, number>;
}

export interface ConfiguratorState extends ConfigSelection {
  chassis: Chassis[];
  options: VanOption[];
  priceData: PriceData;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setChassis: (chassisId: string) => void;
  toggleOption: (optionId: string) => void;
  setInitialData: (chassis: Chassis[], options: VanOption[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export interface ConfiguratorStore extends ConfiguratorState {
  setInitialData: (chassis: Chassis[], options: VanOption[]) => void;
  setChassis: (id: string) => void;
  toggleOption: (id: string) => void;
  getTotalPrice: () => number;
}

export type ConfiguratorAction = 
  | { type: 'SET_CHASSIS'; payload: string }
  | { type: 'TOGGLE_OPTION'; payload: string }
  | { type: 'SET_OPTIONS'; payload: string[] }
  | { type: 'RESET' }; 