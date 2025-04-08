'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ConfiguratorLayout from '@/components/layout/ConfiguratorLayout';
import useConfiguratorStore from '@/store/configurator';
import { toast } from '@/components/ui/use-toast';

export default function Home() {
  const searchParams = useSearchParams();
  const configParam = searchParams.get('config');
  
  useEffect(() => {
    // Load configuration from URL parameter if available
    if (configParam) {
      try {
        // Decode the base64 URL parameter
        const decodedConfig = JSON.parse(Buffer.from(configParam, 'base64').toString());
        
        // Extract configuration data
        const { chassisId, options, name, description } = decodedConfig;
        
        if (chassisId) {
          // Reset current configuration
          useConfiguratorStore.getState().reset();
          
          // Set chassis
          useConfiguratorStore.getState().setChassis(chassisId);
          
          // Set options
          if (Array.isArray(options)) {
            options.forEach(optionId => {
              useConfiguratorStore.getState().toggleOption(optionId);
            });
          }
          
          toast({
            title: "Configuration Loaded",
            description: `Loaded shared configuration${name ? `: ${name}` : ''}`,
          });
        }
      } catch (err) {
        console.error('Failed to load shared configuration:', err);
        toast({
          title: "Error",
          description: "Failed to load shared configuration",
          variant: "destructive",
        });
      }
    }
  }, [configParam]);

  return <ConfiguratorLayout />;
}
