import { create } from 'zustand';
import { ConfiguratorState, VanOption, ConfigSelection } from '@/types/configurator';

const NON_DISCOUNTABLE_ITEM_IDS = [
  'flares',
  'front-bull-bar',
  'lazer-lights-grille',
  'fiamma-awning',
  'front-runner-wolfpack-pro-2x-l',
  'front-runner-wolfpack-pro-2x-r',
  'front-runner-wolfpack-pro-1x-m'
];

const calculatePrice = (state: ConfigSelection, options: VanOption[], chassisPrice: number = 0): number => {
  if (!state.chassisId) return 0;
  
  const addOnsPrice = Array.from(state.selectedOptionIds).reduce((total, optionId) => {
    const option = options.find(opt => opt.id === optionId);
    return total + (option?.price || 0);
  }, 0);

  return chassisPrice + addOnsPrice;
};

const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  // Base state
  chassisId: null,
  selectedOptionIds: new Set(),
  chassis: [],
  options: [],
  priceData: {
    totalPrice: 0,
    chassisPrice: 0,
    addOnPrices: {},
  },
  isLoading: false,
  error: null,

  // Additional required properties
  vehicleModel: null,
  windowsFlares: [],
  wheels: null,
  exteriorAccessories: [],
  rearDoorCarriers: [],
  rearDoorAccessories: [],
  roofRack: null,
  roofRackAccessories: [],
  totalPrice: 0,

  // Actions
  setChassis: (chassisId: string) => {
    const chassis = get().chassis.find(c => c.id === chassisId);
    if (!chassis) return;

    set(state => ({
      chassisId,
      priceData: {
        ...state.priceData,
        chassisPrice: chassis.basePrice,
        totalPrice: calculatePrice(
          { chassisId, selectedOptionIds: state.selectedOptionIds },
          state.options,
          chassis.basePrice
        ),
      },
    }));
  },

  toggleOption: (optionId: string) => {
    set(state => {
      const option = state.options.find(opt => opt.id === optionId);
      if (!option) return state;

      const newSelectedOptions = new Set(state.selectedOptionIds);

      if (newSelectedOptions.has(optionId)) {
        newSelectedOptions.delete(optionId);
      } else {
        // Handle exclusive options
        if (option.isExclusive) {
          option.conflictsWith.forEach(conflictId => {
            newSelectedOptions.delete(conflictId);
          });
        }
        newSelectedOptions.add(optionId);
      }

      const chassis = state.chassis.find(c => c.id === state.chassisId);
      
      return {
        ...state,
        selectedOptionIds: newSelectedOptions,
        priceData: {
          ...state.priceData,
          totalPrice: calculatePrice(
            { chassisId: state.chassisId, selectedOptionIds: newSelectedOptions },
            state.options,
            chassis?.basePrice || 0
          ),
          addOnPrices: Array.from(newSelectedOptions).reduce((acc, id) => {
            const opt = state.options.find(o => o.id === id);
            if (opt) acc[id] = opt.price;
            return acc;
          }, {} as Record<string, number>),
        },
      };
    });
  },

  reset: () => {
    set({
      chassisId: null,
      selectedOptionIds: new Set(),
      priceData: {
        totalPrice: 0,
        chassisPrice: 0,
        addOnPrices: {},
      },
      vehicleModel: null,
      windowsFlares: [],
      wheels: null,
      exteriorAccessories: [],
      rearDoorCarriers: [],
      rearDoorAccessories: [],
      roofRack: null,
      roofRackAccessories: [],
      totalPrice: 0,
    });
  },

  // Data loading
  setInitialData: (chassis, options) => {
    set({
      chassis,
      options,
      isLoading: false,
      error: null,
    });
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
}));

export default useConfiguratorStore; 