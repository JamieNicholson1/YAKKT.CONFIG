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
  modelUrl: string | string[];
  category: 'windows' | 'wheels' | 'roof-racks' | 'deck-panels' | 'roof-rack-accessories' | 'rear-door-carriers' | 'rear-door-accessories' | 'exterior-accessories';
  subCategory?: 'nearside' | 'offside' | 'rack-accessories';
  isExclusive: boolean;
  conflictsWith: string[];
  dependsOn?: string[];
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

// Base types for the configurator

export type Price = number;

export interface BaseModel {
  id: string;
  name: string;
  price: Price;
  modelPath: string;
  isSelected?: boolean;
}

export interface VehicleModel extends BaseModel {
  type: 'vehicle';
  basePrice: Price;
}

export interface WindowsFlares extends BaseModel {
  type: 'windows-flares';
}

export interface Wheels extends BaseModel {
  type: 'wheels';
  isBaseModel?: boolean;
}

export interface ExteriorAccessory extends BaseModel {
  type: 'exterior-accessory';
}

export interface RearDoorCarrier extends BaseModel {
  type: 'rear-door-carrier';
  position: 'NS' | 'OS';
  size: 'Mini' | 'Midi';
}

export interface RearDoorAccessory extends BaseModel {
  type: 'rear-door-accessory';
}

export interface RoofRack extends BaseModel {
  type: 'roof-rack';
  features: ('base' | 'full-deck' | 'front-maxxfan' | 'rear-maxxfan' | 'solar')[];
}

export interface RoofRackAccessory extends BaseModel {
  type: 'roof-rack-accessory';
}

// Configuration data types
export interface ConfiguratorState {
  vehicleModel: VehicleModel | null;
  windowsFlares: WindowsFlares[];
  wheels: Wheels | null;
  exteriorAccessories: ExteriorAccessory[];
  rearDoorCarriers: RearDoorCarrier[];
  rearDoorAccessories: RearDoorAccessory[];
  roofRack: RoofRack | null;
  roofRackAccessories: RoofRackAccessory[];
  totalPrice: Price;
}

// Configuration options
export interface ConfiguratorOptions {
  vehicleModels: VehicleModel[];
  windowsFlares: WindowsFlares[];
  wheels: Wheels[];
  exteriorAccessories: ExteriorAccessory[];
  rearDoorCarriers: RearDoorCarrier[];
  rearDoorAccessories: RearDoorAccessory[];
  roofRacks: RoofRack[];
  roofRackAccessories: RoofRackAccessory[];
} 