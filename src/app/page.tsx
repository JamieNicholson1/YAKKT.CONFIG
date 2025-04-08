'use client';

import React, { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import useConfiguratorStore from '@/store/configurator';
import { toast } from '@/components/ui/use-toast';

// Import non-3D components directly
import { LoadingIndicator } from '@/components/3d/LoadingIndicator';

// Dynamically import ConfiguratorLayout with ssr disabled
const ConfiguratorLayout = dynamic(
  () => import('@/components/layout/ConfiguratorLayout'),
  { ssr: false }
);

export default function HomePage() {
  const searchParams = useSearchParams();
  const configParam = searchParams.get('config');
  const [isClient, setIsClient] = useState(false);
  
  // Ensure we only render on client side
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Show a simple loading state while client-side JS is initializing
  if (!isClient) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading configurator...</p>
        </div>
      </div>
    );
  }
  
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

  return (
    <main className="w-full h-screen flex flex-col">
      <ConfiguratorLayout />
    </main>
  );
}
