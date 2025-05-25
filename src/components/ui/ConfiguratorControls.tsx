import React, { useEffect, useState } from 'react';
import useConfiguratorStore from '@/store/configurator';
import { VanOption } from '@/types/configurator';
import { 
  ChevronDown, 
  Square, 
  PackageOpen, 
  Package, 
  Truck, 
  Wrench,
  ShieldCheck,
  CircleDot,
  PanelTopClose,
  PanelBottomClose
} from 'lucide-react';

const CATEGORY_GROUPS = {
  base: ['chassis'],
  exterior: ['windows', 'wheels', 'exterior-accessories'],
  storage: ['roof-racks', 'roof-rack-accessories', 'rear-door-carriers', 'rear-door-accessories']
};

// Add keyframes for the pulsate animation
const styles = `
@keyframes pulsate {
  0% { 
    background-color: transparent;
    box-shadow: inset 0 0 0 0 rgba(251, 191, 36, 0);
  }
  50% { 
    background-color: rgba(251, 191, 36, 0.25);
    box-shadow: inset 0 0 20px rgba(251, 191, 36, 0.15);
  }
  100% { 
    background-color: transparent;
    box-shadow: inset 0 0 0 0 rgba(251, 191, 36, 0);
  }
}
`;

const ConfiguratorControls: React.FC = () => {
  const {
    chassis,
    options,
    chassisId,
    selectedOptionIds,
    setChassis,
    toggleOption,
    setInitialData,
  } = useConfiguratorStore();

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  // Load initial data
  useEffect(() => {
    const mockData = {
      chassis: [
        {
          id: 'mwb-crafter',
          name: 'VW Crafter MWB',
          basePrice: 0,
          modelUrl: '/models/van-models/mwb-crafter/chassis/chassis.glb',
          description: 'Medium Wheelbase VW Crafter',
        }
      ],
      options: [
        // Windows and Flares
        {
          id: 'flares',
          name: 'Flares',
          price: 950,
          modelUrl: [
            '/models/van-models/mwb-crafter/windows-and-flares/flaresns.glb',
            '/models/van-models/mwb-crafter/windows-and-flares/flaresos.glb'
          ],
          category: 'windows' as const,
          isExclusive: true,
          conflictsWith: [],
          description: 'Wheel arch flares',
        },

        // Wheels
        {
          id: 'standard-wheels',
          name: 'Standard Wheels',
          price: 0,
          modelUrl: '/models/van-models/mwb-crafter/wheels/standard.glb',
          category: 'wheels' as const,
          isExclusive: true,
          conflictsWith: ['black-rhino-wheels'],
          description: 'Standard VW Crafter wheels',
        },
        {
          id: 'black-rhino-wheels',
          name: 'Black Rhino Warlord BFG AT',
          price: 0,
          modelUrl: '/models/van-models/mwb-crafter/wheels/black-rhino-at.glb',
          category: 'wheels' as const,
          isExclusive: true,
          conflictsWith: ['standard-wheels'],
          description: 'Black Rhino all-terrain wheels',
        },

        // Roof Racks
        {
          id: 'roof-rack-base',
          name: 'Base Rack',
          price: 1850,
          modelUrl: [
            '/models/van-models/mwb-crafter/roof-racks/carrier-supports.glb',
            '/models/van-models/mwb-crafter/roof-racks/front-fairing.glb',
            '/models/van-models/mwb-crafter/roof-racks/rear-fairing.glb',
            '/models/van-models/mwb-crafter/roof-racks/right-rails.glb',
            '/models/van-models/mwb-crafter/roof-racks/left-rails.glb'
          ],
          category: 'roof-racks' as const,
          isExclusive: true,
          conflictsWith: [],
          description: 'Base roof rack system with supports, fairings, and rails',
        },

        // Deck Panels
        {
          id: 'rear-deck',
          name: 'Rear Deck',
          price: 600,
          modelUrl: '/models/van-models/mwb-crafter/roof-racks/deck-panels/deck-back.glb',
          category: 'deck-panels' as const,
          isExclusive: false,
          conflictsWith: ['rear-deck-maxxfan'],
          dependsOn: ['roof-rack-base'],
          description: 'Rear section deck panel',
        },
        {
          id: 'rear-deck-maxxfan',
          name: 'Rear Deck Rear MaxxFan',
          price: 550,
          modelUrl: '/models/van-models/mwb-crafter/roof-racks/deck-panels/deck-panels-maxxfan-rear.glb',
          category: 'deck-panels' as const,
          isExclusive: true,
          conflictsWith: ['rear-deck'],
          dependsOn: ['roof-rack-base'],
          description: 'Rear deck with Maxxfan installation',
        },
        {
          id: 'middle-deck',
          name: 'Middle Deck',
          price: 600,
          modelUrl: '/models/van-models/mwb-crafter/roof-racks/deck-panels/deck-middle.glb',
          category: 'deck-panels' as const,
          isExclusive: false,
          conflictsWith: [],
          dependsOn: ['roof-rack-base'],
          description: 'Middle section deck panel',
        },
        {
          id: 'front-deck',
          name: 'Front Deck',
          price: 600,
          modelUrl: '/models/van-models/mwb-crafter/roof-racks/deck-panels/deck-front.glb',
          category: 'deck-panels' as const,
          isExclusive: false,
          conflictsWith: [],
          dependsOn: ['roof-rack-base'],
          description: 'Front section deck panel',
        },

        // Roof Rack Accessories
        {
          id: 'awning-brackets',
          name: 'Awning Brackets',
          price: 175,
          modelUrl: '/models/van-models/mwb-crafter/roof-rack-accessories/awningbrackets.glb',
          category: 'roof-rack-accessories' as const,
          isExclusive: false,
          conflictsWith: [],
          dependsOn: ['roof-rack-base'],
          description: 'Mounting brackets for awning installation',
        },
        {
          id: 'fiamma-awning',
          name: 'Fiamma F45s Awning 3.2m Black/Anthra',
          price: 800,
          modelUrl: '/models/van-models/mwb-crafter/roof-rack-accessories/fiammaf45s-awning-closed.glb',
          category: 'roof-rack-accessories' as const,
          isExclusive: false,
          conflictsWith: [],
          dependsOn: ['roof-rack-base', 'rear-deck', 'rear-deck-maxxfan', 'middle-deck', 'front-deck', 'awning-brackets'],
          description: 'Fiamma F45s retractable awning',
        },
        {
          id: 'roof-rack-ladder',
          name: 'Side Ladder',
          price: 800,
          modelUrl: '/models/van-models/mwb-crafter/roof-rack-accessories/ladder.glb',
          category: 'roof-rack-accessories' as const,
          isExclusive: false,
          conflictsWith: [],
          dependsOn: ['roof-rack-base', 'rear-deck', 'rear-deck-maxxfan', 'middle-deck', 'front-deck'],
          description: 'Access ladder for roof rack',
        },
        {
          id: 'front-runner-wolfpack-pro-2x-l',
          name: 'Front Runner Wolfpack Pro - 2x L',
          price: 59,
          modelUrl: '/models/van-models/mwb-crafter/roof-rack-accessories/wolfpack-2x-l.glb',
          category: 'roof-rack-accessories' as const,
          isExclusive: false,
          conflictsWith: [],
          dependsOn: ['roof-rack-base'],
          description: 'Two Front Runner WolfPack Pro storage boxes (Left side)',
        },
        {
          id: 'front-runner-wolfpack-pro-2x-r',
          name: 'Front Runner Wolfpack Pro - 2x R',
          price: 59,
          modelUrl: '/models/van-models/mwb-crafter/roof-rack-accessories/wolfpack-2x-r.glb',
          category: 'roof-rack-accessories' as const,
          isExclusive: false,
          conflictsWith: [],
          dependsOn: ['roof-rack-base'],
          description: 'Two Front Runner WolfPack Pro storage boxes (Right side)',
        },
        {
          id: 'front-runner-wolfpack-pro-1x-m',
          name: 'Front Runner Wolfpack Pro - 1x M',
          price: 59,
          modelUrl: '/models/van-models/mwb-crafter/roof-rack-accessories/wolfpack-1x-m.glb',
          category: 'roof-rack-accessories' as const,
          isExclusive: false,
          conflictsWith: [],
          dependsOn: ['roof-rack-base'],
          description: 'Single Front Runner WolfPack Pro storage box (Middle)',
        },

        // Rear Door Carriers
        {
          id: 'nearside-mini-carrier',
          name: 'NS Mini Carrier',
          price: 670,
          modelUrl: '/models/van-models/mwb-crafter/rear-door-carriers/ns-minicarrier.glb',
          category: 'rear-door-carriers' as const,
          subCategory: 'nearside' as const,
          isExclusive: true,
          conflictsWith: ['nearside-midi-carrier'],
          description: 'Nearside mini storage carrier',
        },
        {
          id: 'offside-mini-carrier',
          name: 'OS Mini Carrier',
          price: 670,
          modelUrl: '/models/van-models/mwb-crafter/rear-door-carriers/os-minicarrier.glb',
          category: 'rear-door-carriers' as const,
          subCategory: 'offside' as const,
          isExclusive: true,
          conflictsWith: ['offside-midi-carrier'],
          description: 'Offside mini storage carrier',
        },
        {
          id: 'nearside-midi-carrier',
          name: 'NS Midi Carrier',
          price: 1200,
          modelUrl: '/models/van-models/mwb-crafter/rear-door-carriers/ns-midicarrier.glb',
          category: 'rear-door-carriers' as const,
          subCategory: 'nearside' as const,
          isExclusive: true,
          conflictsWith: ['nearside-mini-carrier'],
          description: 'Nearside midi storage carrier',
        },
        {
          id: 'offside-midi-carrier',
          name: 'OS Midi Carrier',
          price: 1200,
          modelUrl: '/models/van-models/mwb-crafter/rear-door-carriers/os-midicarrier.glb',
          category: 'rear-door-carriers' as const,
          subCategory: 'offside' as const,
          isExclusive: true,
          conflictsWith: ['offside-mini-carrier'],
          description: 'Offside midi storage carrier',
        },

        // Rear Door Accessories
        {
          id: 'wheel-carrier',
          name: 'Wheel Carrier Module',
          price: 450,
          modelUrl: '/models/van-models/mwb-crafter/rear-door-accessories/options/wheel-carrier.glb',
          category: 'rear-door-accessories' as const,
          isExclusive: false,
          conflictsWith: [],
          dependsOn: ['nearside-mini-carrier', 'nearside-midi-carrier', 'offside-mini-carrier', 'offside-midi-carrier'],
          description: 'Rear door spare wheel carrier',
        },

        // Exterior Accessories
        {
          id: 'bravo-snorkel',
          name: 'Bravo Snorkel',
          price: 495,
          modelUrl: '/models/van-models/mwb-crafter/exterior-accessories/bravo-snorkel.glb',
          category: 'exterior-accessories' as const,
          isExclusive: false,
          conflictsWith: [],
          description: 'Bravo raised air intake snorkel',
        },
        {
          id: 'front-bull-bar',
          name: 'Front Bull Bar',
          price: 680,
          modelUrl: '/models/van-models/mwb-crafter/exterior-accessories/front-bull-bar.glb',
          category: 'exterior-accessories' as const,
          isExclusive: false,
          conflictsWith: [],
          description: 'Heavy-duty front bull bar protection',
        },
        {
          id: 'lazer-lights-grille',
          name: 'Lazer Lights - Grille',
          price: 600,
          modelUrl: '/models/van-models/mwb-crafter/exterior-accessories/lazerlights.glb',
          category: 'exterior-accessories' as const,
          isExclusive: false,
          conflictsWith: [],
          description: 'Grille-mounted Lazer LED lights',
        },
      ],
    };

    setInitialData(mockData.chassis, mockData.options);
  }, [setInitialData]);

  const handleChassisChange = (id: string) => {
    setChassis(id);
    // Close the chassis category specifically
    setOpenCategories(prev => ({
      ...prev,
      chassis: false
    }));
  };

  const handleOptionToggle = (option: VanOption) => {
    toggleOption(option.id);
  };

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const groupedOptions = options.reduce<Record<string, VanOption[]>>((acc, option) => {
    const category = option.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(option);
    return acc;
  }, {});

  const handleCollapseAll = () => {
    setOpenCategories({});
  };

  const handleExpandAll = () => {
    const newOpenCategories: Record<string, boolean> = {};
    Object.keys(groupedOptions).forEach(categoryKey => {
      newOpenCategories[categoryKey] = true;
    });
    setOpenCategories(newOpenCategories);
  };

  const anyCategoryOpen = Object.values(openCategories).some(isOpen => isOpen);

  // Check if any option in a category is selected
  const isCategorySelected = (category: string): boolean => {
    return options
      .filter(option => option.category === category)
      .some(option => selectedOptionIds.has(option.id));
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      'chassis': 'Vehicle Model',
      'windows': 'Windows & Flares',
      'wheels': 'Wheels',
      'roof-racks': 'Roof Racks',
      'roof-rack-accessories': 'Roof Rack Accessories',
      'rear-door-carriers': 'Rear Door Carriers',
      'rear-door-accessories': 'Rear Door Accessories',
      'exterior-accessories': 'Exterior Accessories'
    };
    return names[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'chassis': <Truck className="w-5 h-5" />,
      'windows': <Square className="w-5 h-5" />,
      'wheels': <CircleDot className="w-5 h-5" />,
      'roof-racks': <PackageOpen className="w-5 h-5" />,
      'roof-rack-accessories': <Package className="w-5 h-5" />,
      'rear-door-carriers': <Package className="w-5 h-5" />,
      'rear-door-accessories': <Wrench className="w-5 h-5" />,
      'exterior-accessories': <ShieldCheck className="w-5 h-5" />
    };
    return icons[category] || <Package className="w-5 h-5" />;
  };

  // Add this new function to check if an option is available
  const isOptionAvailable = (option: VanOption): boolean => {
    if (!option.dependsOn) return true;
    return option.dependsOn.some(dependencyId => selectedOptionIds.has(dependencyId));
  };

  // Add this function to render deck panel options
  const renderDeckPanels = () => {
    const deckPanelOptions = options.filter(option => option.category === 'deck-panels');
    const isBaseRackSelected = selectedOptionIds.has('roof-rack-base');

    if (!isBaseRackSelected) {
      return (
        <div className="text-sm text-gray-500 italic text-center px-4 py-3">
          Please Select Base Rack First
        </div>
      );
    }

    return deckPanelOptions.map((option) => {
      const isAvailable = isOptionAvailable(option);
      return (
        <button
          key={option.id}
          onClick={() => handleOptionToggle(option)}
          className={`w-full px-4 py-3 transition-all duration-200 ${
            selectedOptionIds.has(option.id)
              ? 'bg-amber-50 text-amber-700'
              : isAvailable
                ? 'text-gray-900 hover:bg-gray-50'
                : 'text-gray-400 cursor-not-allowed'
          }`}
          disabled={!chassisId || !isAvailable}
        >
          <div className="flex justify-between items-center">
            <div className="font-medium text-left text-sm">{option.name}</div>
            <div className={`font-medium text-sm ${selectedOptionIds.has(option.id) ? 'text-amber-600' : 'text-gray-600'} min-w-[100px] text-right`}>
              {option.price === 0 ? 'Base Model' : `+ £${option.price.toLocaleString()}`}
            </div>
          </div>
        </button>
      );
    });
  };

  return (
    <div className="space-y-2 font-mono">
      {/* Add the styles */}
      <style>{styles}</style>
      
      {Object.entries(CATEGORY_GROUPS).map(([groupKey, categories]) => (
        <div key={groupKey} className="space-y-0">
          {categories.map(category => {
            const categoryOptions = groupedOptions[category] || [];
            const isChassis = category === 'chassis';
            const isRoofRacks = category === 'roof-racks';
            const shouldPulsate = isChassis && !chassisId;
            
            return (
              <div key={category} className="border-b border-gray-200">
                <button
                  onClick={() => toggleCategory(category)}
                  className={`
                    w-full flex items-center justify-between py-4 px-4
                    transition-all duration-300 ease-in-out 
                    hover:bg-gray-50 active:scale-[0.99]
                    ${shouldPulsate ? 'animate-[pulsate_2s_ease-in-out_infinite] rounded-lg' : ''}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(category)}
                    <span className={`text-gray-900 uppercase tracking-wide text-sm ${shouldPulsate ? 'text-amber-600' : ''}`}>
                      {getCategoryName(category)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(isChassis ? chassisId : isCategorySelected(category)) && (
                      <div className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-medium animate-fadeIn">
                        Selected
                      </div>
                    )}
                    <div className={`transform transition-all duration-300 ease-spring ${openCategories[category] ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                </button>
                
                <div 
                  className={`
                    transition-all duration-500 ease-spring 
                    ${openCategories[category] 
                      ? 'max-h-[1000px] opacity-100 scale-y-100' 
                      : 'max-h-0 opacity-0 scale-y-95'
                    } 
                    overflow-hidden
                  `}
                >
                  <div className="transform transition-all duration-300 ease-spring origin-top">
                    <div className="py-2">
                      {isChassis ? (
                        // Chassis selection
                        <div className="space-y-1">
                          {chassis.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleChassisChange(item.id)}
                              className={`
                                w-full px-4 py-3 
                                transition-all duration-200 
                                hover:bg-gray-50 
                                active:scale-[0.99]
                                ${chassisId === item.id
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  : 'text-gray-900'
                                }
                              `}
                            >
                              <div className="flex justify-between items-center">
                                <div className="font-medium text-left text-sm">{item.name}</div>
                                <div className={`font-medium text-sm ${chassisId === item.id ? 'text-amber-600' : 'text-gray-600'}`}>
                                  Base Model
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        // Regular options
                        <div className="space-y-1">
                          {categoryOptions.map((option) => {
                            const isAvailable = isOptionAvailable(option);
                            const isSelected = selectedOptionIds.has(option.id);
                            return (
                              <button
                                key={option.id}
                                onClick={() => handleOptionToggle(option)}
                                className={`
                                  w-full px-4 py-3 
                                  transition-all duration-200 
                                  ${isSelected
                                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                    : isAvailable
                                      ? 'text-gray-900 hover:bg-gray-50'
                                      : 'text-gray-400 cursor-not-allowed'
                                  }
                                  active:scale-[0.99]
                                `}
                                disabled={!chassisId || !isAvailable}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="font-medium text-left text-sm">{option.name}</div>
                                  <div className={`
                                    font-medium text-sm min-w-[100px] text-right
                                    ${isSelected ? 'text-amber-600' : 'text-gray-600'}
                                  `}>
                                    {option.id === 'black-rhino-wheels' || option.id === 'standard-wheels' ? 'Visual' : 
                                      option.price === 0 ? 'Base Model' : `+ £${option.price.toLocaleString()}`}
                                  </div>
                                </div>
                              </button>
                            );
                          })}

                          {/* Show Deck Panels as sub-category under Roof Racks */}
                          {isRoofRacks && selectedOptionIds.has('roof-rack-base') && (
                            <div className="mt-4 border-t border-gray-200 animate-fadeIn">
                              <div className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50/80 backdrop-blur-sm">
                                Deck Panels
                              </div>
                              <div className="space-y-1">
                                {renderDeckPanels()}
                              </div>
                            </div>
                          )}

                          {category === 'roof-rack-accessories' && !selectedOptionIds.has('roof-rack-base') && (
                            <div className="text-sm text-gray-500 italic text-center px-4 py-3 animate-fadeIn">
                              Please Select A Roof Rack
                            </div>
                          )}
                          {category === 'rear-door-accessories' && 
                            !(selectedOptionIds.has('nearside-mini-carrier') || 
                              selectedOptionIds.has('nearside-midi-carrier') || 
                              selectedOptionIds.has('offside-mini-carrier') || 
                              selectedOptionIds.has('offside-midi-carrier')) && (
                            <div className="text-sm text-gray-500 italic text-center px-4 py-3 animate-fadeIn">
                              Please Select A Rear Door Carrier
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Floating Action Button */}
      {options.length > 0 && (
        <button
          onClick={anyCategoryOpen ? handleCollapseAll : handleExpandAll}
          className="fixed bottom-28 right-4 z-50 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm py-2 px-4 rounded-full shadow-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 flex items-center space-x-2"
          aria-label={anyCategoryOpen ? "Collapse all categories" : "Expand all categories"}
        >
          {anyCategoryOpen ? (
            <PanelTopClose className="w-4 h-4" />
          ) : (
            <PanelBottomClose className="w-4 h-4" />
          )}
          <span>
            {anyCategoryOpen ? 'Collapse All' : 'Expand All'}
          </span>
        </button>
      )}
    </div>
  );
};

export default ConfiguratorControls; 