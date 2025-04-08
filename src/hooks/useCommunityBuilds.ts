'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Build, 
  getCommunityBuilds, 
  saveBuild as supabaseSaveBuild, 
  likeBuild as supabaseLikeBuild, 
  getBuildById 
} from '@/lib/supabase';
import useConfiguratorStore from '@/store/configurator';
import { toast } from './temp-fix-toast';

const useCommunityBuilds = () => {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    chassisId, 
    selectedOptionIds, 
    chassis, 
    options,
    setChassis,
    toggleOption,
    reset
  } = useConfiguratorStore();

  const loadCommunityBuilds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await getCommunityBuilds();
      
      if (error) {
        console.error('Error fetching community builds:', error);
        setError(error.message);
        toast({
          title: 'Error',
          description: 'Failed to load community builds. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      if (data && data.length > 0) {
        setBuilds(data);
      } else {
        setBuilds([]);
        console.info('No community builds found');
      }
    } catch (err) {
      console.error('Error loading community builds:', err);
      setError(err instanceof Error ? err.message : 'Failed to load community builds');
      toast({
        title: 'Error',
        description: 'Failed to load community builds. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load builds on mount and set up refresh interval
  useEffect(() => {
    loadCommunityBuilds();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadCommunityBuilds, 30000);
    
    return () => clearInterval(interval);
  }, [loadCommunityBuilds]);

  // Save current configuration to Supabase
  const saveBuild = async (title: string, description: string, author: string, authorColor: string, email?: string) => {
    if (!chassisId) {
      console.error('Cannot save build: No chassis selected');
      return false;
    }

    try {
      // Get selected options readable names
      const selectedOptions = Array.from(selectedOptionIds).map(id => {
        const option = options.find(opt => opt.id === id);
        return option ? option.name : id;
      });

      // Get selected chassis name
      const selectedChassis = chassis.find(c => c.id === chassisId)?.name || chassisId;

      // Create build object
      const build: Omit<Build, 'id' | 'likes' | 'created_at'> = {
        title: title || 'My Custom Van',
        description: description || '',
        author: author || 'Anonymous',
        author_color: authorColor || '#000000',
        selected_options: selectedOptions,
        selected_chassis: selectedChassis,
        selected_option_ids: Array.from(selectedOptionIds),
        email: email || ''
      };

      console.log('Saving build:', build);
      
      const { data, error } = await supabaseSaveBuild(build);
      
      if (error) {
        console.error('Error saving build:', error);
        toast({
          title: 'Error',
          description: 'Failed to save build. Please try again.',
          variant: 'destructive',
        });
        return false;
      }
      
      // Update local state with the new build
      setBuilds(prev => [data as Build, ...prev]);
      
      return true;
    } catch (err) {
      console.error('Exception in saveBuild:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while saving. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Like a community build
  const likeBuild = async (buildId: string) => {
    try {
      const { success, error } = await supabaseLikeBuild(buildId);
      
      if (error) {
        console.error('Error liking build:', error);
        return false;
      }
      
      if (success) {
        // Update the like count in local state
        setBuilds(prev => 
          prev.map(build => 
            build.id === buildId 
              ? { ...build, likes: (build.likes || 0) + 1 } 
              : build
          )
        );
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Exception in likeBuild:', err);
      return false;
    }
  };

  // Load a community build into the configurator
  const loadBuild = async (buildId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await getBuildById(buildId);
      
      if (error || !data) {
        console.error('Error loading build:', error);
        toast({
          title: 'Error',
          description: 'Failed to load build. Please try again.',
          variant: 'destructive',
        });
        return false;
      }
      
      // First reset the current configuration
      reset();
      
      // Find the chassis by name and set it
      const chassisToSelect = chassis.find(c => c.name === data.selected_chassis || c.id === data.selected_chassis);
      
      if (chassisToSelect) {
        setChassis(chassisToSelect.id);
      } else {
        console.warn(`Chassis not found: ${data.selected_chassis}`);
      }
      
      // Apply each selected option
      if (data.selected_option_ids && Array.isArray(data.selected_option_ids)) {
        // Use option IDs if available (more reliable)
        data.selected_option_ids.forEach(optionId => {
          const option = options.find(opt => opt.id === optionId);
          if (option) {
            toggleOption(optionId);
          } else {
            console.warn(`Option not found: ${optionId}`);
          }
        });
      } else if (data.selected_options && Array.isArray(data.selected_options)) {
        // Fall back to option names (less reliable)
        data.selected_options.forEach(optionName => {
          const option = options.find(opt => opt.name === optionName);
          if (option) {
            toggleOption(option.id);
          } else {
            console.warn(`Option not found by name: ${optionName}`);
          }
        });
      }
      
      toast({
        title: 'Success',
        description: `Loaded "${data.title}" configuration`,
      });
      
      return true;
    } catch (err) {
      console.error('Exception in loadBuild:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while loading the build.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to manually refresh the builds list
  const refreshBuilds = () => {
    loadCommunityBuilds();
  };

  return {
    builds,
    isLoading,
    error,
    saveBuild,
    likeBuild,
    loadBuild,
    refreshBuilds
  };
};

export default useCommunityBuilds; 