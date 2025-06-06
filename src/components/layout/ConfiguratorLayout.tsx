'use client';

import React, { useState, useRef, useEffect } from 'react';
import Scene, { SceneRef } from '@/components/3d/Scene';
import ConfiguratorControls from '@/components/ui/ConfiguratorControls';
import PriceDisplay from '@/components/ui/PriceDisplay';
import {
  ShoppingCart,
  Loader2,
  Camera,
  X,
  Share2,
  Save,
  Users,
  Download,
  Link,
  Instagram,
  Ruler,
} from 'lucide-react';
import NextImage from 'next/image';
import useConfiguratorStore from '@/store/configurator';
import useCheckout from '@/hooks/useCheckout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BuildCard from '@/components/ui/BuildCard';
import SavingsBanner from '@/components/ui/SavingsBanner';
import useCommunityBuilds from '@/hooks/useCommunityBuilds';
import { toast } from '@/components/ui/use-toast';

const ConfiguratorLayout: React.FC = () => {
  // Feature flags for easy toggling - uncomment to enable
  // const ENABLE_RENDER_TAB = true;
  
  const [activeTab, setActiveTab] = useState<'configure' | 'summary' | 'ai' | 'community'>('configure');
  const [showSavingsBanner, setShowSavingsBanner] = useState(false);
  const [hasShownSavingsCelebration, setHasShownSavingsCelebration] = useState(false);
  const { priceData, chassisId } = useConfiguratorStore();
  const { totalPrice } = priceData;
  const { isLoading: checkoutLoading, error: checkoutError, handleCheckout } = useCheckout();
  const sceneRef = useRef<SceneRef>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [buildName, setBuildName] = useState('My Custom Van');
  const [authorName, setAuthorName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [email, setEmail] = useState<string>('');
  const [isTapeMeasureActive, setIsTapeMeasureActive] = useState(false);
  
  // Load community builds from Supabase
  const { 
    builds: communityBuilds, 
    isLoading: communityLoading, 
    error: communityError,
    saveBuild,
    likeBuild,
    loadBuild,
  } = useCommunityBuilds();

  // Calculate savings based on total price
  const calculateSavings = (total: number): { percentage: number; amount: number } => {
    // We should use the discountablePrice from the store instead of the total price
    const { priceData } = useConfiguratorStore.getState();
    const { discountablePrice } = priceData;
    
    if (discountablePrice < 1750) return { percentage: 0, amount: 0 };
    
    const amountOver1750 = discountablePrice - 1750;
    const savingTiers = Math.floor(amountOver1750 / 200);
    const savingPercentage = Math.min(savingTiers + 1, 17.5); // Increased cap from 12.5% to 17.5%
    const savingAmount = Math.round((discountablePrice * savingPercentage) / 100);
    
    return {
      percentage: savingPercentage,
      amount: savingAmount
    };
  };

  const savings = calculateSavings(totalPrice);

  // Control savings banner visibility
  useEffect(() => {
    if (savings.percentage >= 10 && !hasShownSavingsCelebration) {
      setShowSavingsBanner(true);
      setHasShownSavingsCelebration(true);
      const timer = setTimeout(() => {
        setShowSavingsBanner(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else if (savings.percentage < 10 && showSavingsBanner) {
      setShowSavingsBanner(false);
    }
  }, [savings.percentage, hasShownSavingsCelebration, showSavingsBanner]);

  // Reset sharing state when component unmounts
  useEffect(() => {
    return () => {
      setIsSharing(false);
      setShowShareModal(false);
    };
  }, []);

  // Handle checkout button click
  const handleCheckoutClick = () => {
    handleCheckout();
  };

  // Handle screenshot capture
  const handleCaptureClick = () => {
    if (!sceneRef.current) return;
    
    const screenshot = sceneRef.current.captureScreenshot();
    if (!screenshot) return;

    setScreenshots(prev => [...prev, screenshot]);
  };

  // Handle AI render generation
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (screenshots.length === 0) {
      setError('Please capture at least one screenshot first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: screenshots[screenshots.length - 1],
          prompt: additionalPrompt ? `${prompt}, ${additionalPrompt}` : prompt
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setAiImage(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle screenshot clear
  const handleClearScreenshots = () => {
    setScreenshots([]);
    setAiImage(null);
  };

  // Handle like build 
  const handleLike = async (buildId: string) => {
    const success = await likeBuild(buildId);
    
    if (success) {
      toast({
        title: "Success",
        description: "You liked this build!",
      });
    }
  };

  // Handle load build
  const handleLoadBuild = async (buildId: string) => {
    const success = await loadBuild(buildId);
  };

  // Handle save build
  const handleSaveBuild = async () => {
    if (!chassisId) {
      toast({
        title: "Error",
        description: "Please select a chassis before saving",
        variant: "destructive",
      });
      return;
    }

    if (!buildName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your build",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const author = authorName.trim() || 'Anonymous';
      const authorColor = generateRandomColor();

      const result = await saveBuild(
        buildName, 
        "", // Empty description
        author, 
        authorColor,
        email // Pass email to saveBuild function
      );

      if (result) {
        toast({
          title: "Success",
          description: "Your build has been saved to the community",
        });
        
        // Switch to community tab to see the new build
        setActiveTab('community');
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save your build. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Generate share card with screenshot and configuration details
  const generateShareCard = async (
    buildName: string,
    authorName: string,
    chassisName: string,
    optionsList: string[],
    screenshotUrl: string | null
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const width = 1200;
        const height = 630;
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('Failed to create canvas context');
          return;
        }
        
        // Helper function to complete drawing and resolve with image data
        const finalizeCard = () => {
          try {
            // We need to catch any potential security errors here
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
          } catch (err) {
            console.error('Error converting canvas to data URL:', err);
            // Create a simple fallback card if canvas operations fail
            createFallbackCard(ctx);
          }
        };
        
        // Create a simple fallback card with just text content if all else fails
        const createFallbackCard = (context: CanvasRenderingContext2D) => {
          // Clear canvas and start over with simple text
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, width, height);
          
          context.fillStyle = '#000000';
          context.font = 'bold 32px "Space Mono", monospace';
          context.textAlign = 'center';
          context.fillText('YAKKT CONFIGURATOR', width/2, 100);
          
          context.fillStyle = '#F59E0B';
          context.font = 'bold 48px "Space Mono", monospace';
          context.fillText(buildName || 'My Custom Van', width/2, 180);
          
          context.fillStyle = '#000000';
          context.font = '24px "Space Mono", monospace';
          context.fillText(`Chassis: ${chassisName}`, width/2, 250);
          
          context.fillStyle = '#4B5563';
          context.font = '20px "Space Mono", monospace';
          context.textAlign = 'center';
          
          // List options in center of card
          let yPos = 320;
          const displayOptions = optionsList.length > 6 ? 
            optionsList.slice(0, 5).concat([`+ ${optionsList.length - 5} more`]) : 
            optionsList;
            
          displayOptions.forEach((option, i) => {
            context.fillText(`• ${option}`, width/2, yPos);
            yPos += 40;
          });
          
          try {
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
          } catch (finalErr) {
            // If even the fallback fails, return a static placeholder
            reject('Failed to generate share image');
          }
        };
        
        // Load and draw the screenshot if available
        if (screenshotUrl) {
          const screenshot = new window.Image();
          
          // Set crossOrigin to anonymous to prevent tainted canvas
          screenshot.crossOrigin = 'anonymous';
          
          screenshot.onload = () => {
            try {
              // Draw a clean, modern card layout
              drawCleanCardLayout(ctx, screenshot);
              
              // Finalize and get data URL
              finalizeCard();
            } catch (canvasErr) {
              console.error('Error drawing screenshot on canvas:', canvasErr);
              createFallbackCard(ctx);
            }
          };
          
          screenshot.onerror = () => {
            console.error('Failed to load screenshot');
            // If screenshot fails to load, draw a clean layout without screenshot
            drawCleanCardLayout(ctx, null);
            finalizeCard();
          };
          
          // Handle security errors
          try {
            screenshot.src = screenshotUrl;
          } catch (srcErr) {
            console.error('Error setting screenshot source:', srcErr);
            drawCleanCardLayout(ctx, null);
            finalizeCard();
          }
        } else {
          // No screenshot, just draw clean layout
          drawCleanCardLayout(ctx, null);
          finalizeCard();
        }
        
        // Function to draw a clean, modern card layout
        function drawCleanCardLayout(context: CanvasRenderingContext2D, image: HTMLImageElement | null) {
          // Premium white background
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, width, height);
          
          // Draw the image section with crisp lines and proper sizing
          const imageSection = { 
            x: 40, 
            y: 40,
            width: width * 0.5 - 60, 
            height: height - 80
          };
          
          // Draw a subtle background
          context.fillStyle = '#F9FAFB';
          context.fillRect(
            imageSection.x, 
            imageSection.y, 
            imageSection.width, 
            imageSection.height
          );
          
          if (image) {
            // Draw the screenshot, maintaining aspect ratio
            const imgRatio = image.width / image.height;
            let renderWidth = imageSection.width - 40; // Add padding
            let renderHeight = renderWidth / imgRatio;
            
            // Adjust if needed to fit in the box
            if (renderHeight > imageSection.height - 40) {
              renderHeight = imageSection.height - 40;
              renderWidth = renderHeight * imgRatio;
            }
            
            // Center the image in the allocated space
            const xOffset = imageSection.x + (imageSection.width - renderWidth) / 2;
            const yOffset = imageSection.y + (imageSection.height - renderHeight) / 2;
            
            context.drawImage(image, xOffset, yOffset, renderWidth, renderHeight);
          } else {
            // Minimal placeholder
            context.fillStyle = '#E5E7EB';
            context.fillRect(
              imageSection.x + 40, 
              imageSection.y + imageSection.height/2 - 40, 
              imageSection.width - 80, 
              80
            );
            
            context.fillStyle = '#9CA3AF';
            context.font = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
            context.textAlign = 'center';
            context.fillText(
              'Van Preview', 
              imageSection.x + imageSection.width / 2, 
              imageSection.y + imageSection.height / 2 + 6
            );
          }
          
          // Text section - Apple/Tesla style with lots of whitespace and minimal design
          const textX = width * 0.5 + 20;
          let currentY = 60;
          
          // Use system fonts that will render properly on canvas
          const titleFont = 'bold 46px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
          const headerFont = 'bold 26px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
          const normalFont = '20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
          const smallFont = '16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
          
          // YAKKT text
          context.font = headerFont;
          context.fillStyle = '#111111';
          context.textAlign = 'left';
          context.fillText('YAKKT', textX, currentY);
          
          // Configurator with lighter weight
          context.font = '24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
          context.fillStyle = '#4B5563';
          context.fillText('CONFIGURATOR', textX + 90, currentY);
          currentY += 80;
          
          // Build name - large, bold, and prominent
          context.font = titleFont;
          context.fillStyle = '#111111';
          context.fillText(buildName || 'My Custom Van', textX, currentY);
          currentY += 30;
          
          // Draw author if available
          if (authorName) {
            context.font = normalFont;
            context.fillStyle = '#6B7280';
            context.fillText(`Designed by ${authorName}`, textX, currentY);
            currentY += 60;
          } else {
            currentY += 30;
          }
          
          // Draw an elegant thin divider line
          context.fillStyle = '#E5E7EB';
          context.fillRect(textX, currentY, width * 0.43, 1);
          currentY += 40;
          
          // Chassis with minimal styling
          context.font = headerFont;
          context.fillStyle = '#111111';
          context.fillText('Chassis', textX, currentY);
          currentY += 30;
          
          context.font = normalFont;
          context.fillStyle = '#374151';
          context.fillText(chassisName, textX, currentY);
          currentY += 50;
          
          // Options header
          context.font = headerFont;
          context.fillStyle = '#111111';
          context.fillText('Selected Options', textX, currentY);
          currentY += 30;
          
          // Draw options list with clean bullets
          const displayOptions = optionsList.length > 6 ? 
            [...optionsList.slice(0, 5), `+ ${optionsList.length - 5} more options`] : 
            [...optionsList];
          
          context.font = normalFont;
          displayOptions.forEach((option, index) => {
            // Clean dot bullet point
            context.fillStyle = '#D1D5DB';
            context.beginPath();
            context.arc(textX + 6, currentY - 7, 4, 0, Math.PI * 2);
            context.fill();
            
            // Option text
            const color = index === displayOptions.length - 1 && optionsList.length > 6 ? 
              '#F59E0B' : '#374151';
            
            context.fillStyle = color;
            context.fillText(option, textX + 20, currentY);
            currentY += 36;
          });
          
          // Footer text with minimal styling
          const footerY = height - 40;
          context.font = smallFont;
          context.fillStyle = '#9CA3AF';
          context.fillText('yakkt.com', textX, footerY);
          
          // Draw a subtle premium accent
          context.fillStyle = '#F59E0B';
          context.beginPath();
          context.moveTo(width - 40, 40);
          context.lineTo(width - 20, 40);
          context.lineTo(width - 20, 60);
          context.fill();
        }
      } catch (error) {
        console.error('Error generating share card:', error);
        reject('Failed to generate share card');
      }
    });
  };

  // Handle share build
  const handleShareBuild = async () => {
    if (!chassisId) {
      toast({
        title: "Error",
        description: "Please select a chassis before sharing",
        variant: "destructive",
      });
      return;
    }

    // Prevent multiple share attempts
    if (isSharing || showShareModal) return;
    
    setIsSharing(true);

    try {
      // Get store state
      const store = useConfiguratorStore.getState();
      const { chassis, options, selectedOptionIds } = store;

      // Find selected chassis and options
      const selectedChassis = chassis.find((c) => c.id === chassisId);
      const selectedOptionNames = Array.from(selectedOptionIds).map(id => {
        const option = options.find((opt) => opt.id === id);
        return option ? option.name : '';
      }).filter(Boolean);

      // Generate a shareable URL with the current configuration
      const currentConfig = {
        chassisId,
        options: Array.from(selectedOptionIds),
        name: buildName,
        description: "", // Empty description
      };

      // Create a base64 encoded string of the configuration
      const encodedConfig = Buffer.from(JSON.stringify(currentConfig)).toString('base64');
      
      // Generate share URL
      const shareUrl = `${window.location.origin}?config=${encodedConfig}`;
      
      // Set share URL to state (do this early in case image fails)
      setShareUrl(shareUrl);
      
      // Capture a screenshot of the current view
      let screenshotUrl = null;
      try {
        if (sceneRef.current) {
          screenshotUrl = sceneRef.current.captureScreenshot();
        }
      } catch (screenErr) {
        console.error('Error capturing screenshot:', screenErr);
        // Continue without screenshot
      }
      
      // Try to create a share card with the screenshot and configuration details
      try {
        const cardImageUrl = await generateShareCard(
          buildName,
          authorName,
          selectedChassis?.name || 'Custom Chassis',
          selectedOptionNames,
          screenshotUrl
        );
        
        // Set card image URL to state
        setCardImageUrl(cardImageUrl);
      } catch (cardErr) {
        console.error('Error generating card:', cardErr);
        
        // Use a static fallback if card generation fails
        setCardImageUrl(null);
        
        toast({
          title: "Warning",
          description: "Could not generate custom image, but your share link is ready!",
          variant: "default",
        });
      }
      
      // Show the share modal regardless of image success
      setShowShareModal(true);
      
      toast({
        title: "Success",
        description: "Share link created! You can copy it from the dialog.",
      });
    } catch (err) {
      console.error('Share error:', err);
      toast({
        title: "Error",
        description: "Failed to generate share link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Handle download of share card
  const handleDownloadCard = () => {
    if (!cardImageUrl) {
      // If no image URL but we have configuration, try to generate an image on the fly
      if (shareUrl) {
        toast({
          title: "Info",
          description: "Generating image for download...",
        });
        
        // Get necessary data and try to generate card again
        const store = useConfiguratorStore.getState();
        const { chassis, options, selectedOptionIds } = store;
        const selectedChassis = chassis.find((c) => c.id === chassisId);
        const selectedOptionNames = Array.from(selectedOptionIds).map(id => {
          const option = options.find((opt) => opt.id === id);
          return option ? option.name : '';
        }).filter(Boolean);
        
        // Try to generate a card for download
        generateShareCard(
          buildName,
          authorName,
          selectedChassis?.name || 'Custom Chassis',
          selectedOptionNames,
          null
        ).then(imageUrl => {
          // Download the newly generated image
          downloadImage(imageUrl);
        }).catch(err => {
          console.error('Failed to generate download image:', err);
          toast({
            title: "Error",
            description: "Could not generate image for download",
            variant: "destructive",
          });
        });
        
        return;
      }
      
      toast({
        title: "Error",
        description: "No image available to download",
        variant: "destructive",
      });
      return;
    }
    
    // Download the existing image
    downloadImage(cardImageUrl);
  };
  
  // Helper function to download an image
  const downloadImage = (imageUrl: string) => {
    try {
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = imageUrl;
      downloadLink.download = `${buildName.replace(/\s+/g, '-').toLowerCase() || 'yakkt-van'}.png`;
      
      // Append to body, click, and remove
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Success",
        description: "Image downloaded successfully!",
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Error",
        description: "Failed to download image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle copy link to clipboard
  const handleCopyLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Success",
        description: "Link copied to clipboard!",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle sharing to Instagram (opens a new window)
  const handleShareToInstagram = () => {
    // Instagram doesn't have a direct sharing API for web
    // We can only open Instagram and let user manually share
    window.open('https://www.instagram.com/', '_blank');
    
    toast({
      title: "Info",
      description: "Please save the image and share manually on Instagram",
    });
  };

  // Generate a random color for author avatar
  const generateRandomColor = (): string => {
    // Generate pastel colors that are visually pleasing
    const hue = Math.floor(Math.random() * 360); // Random hue
    const saturation = 60 + Math.floor(Math.random() * 30); // Medium-high saturation
    const lightness = 45 + Math.floor(Math.random() * 15); // Medium lightness
    
    // Convert HSL to Hex
    const h = hue / 360;
    const s = saturation / 100;
    const l = lightness / 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Handle change of author name
  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthorName(e.target.value);
  };

  const handleBuildNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBuildName(e.target.value);
  };

  const tabContent = () => {
    switch (activeTab) {
      case 'configure':
        return <ConfiguratorControls />;
      case 'summary':
        return <PriceDisplay detailed />;
      case 'community':
        return (
          <div className="space-y-6">
            <div className="space-y-5 pt-2">
              <div className="flex flex-col space-y-4">
                {/* Name Your Van field */}
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="community-van-name" className="font-mono text-xs text-gray-700 font-medium">
                    Name Your Van
                  </label>
                  <input
                    id="community-van-name"
                    value={buildName}
                    onChange={handleBuildNameChange}
                    placeholder="Midnight Rover"
                    className="font-mono text-sm border border-gray-200 p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                  />
                </div>
                
                {/* Your Name field */}
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="community-author-name" className="font-mono text-xs text-gray-700 font-medium">
                    Your Name
                  </label>
                  <input
                    id="community-author-name"
                    value={authorName}
                    onChange={handleAuthorChange}
                    placeholder="Alex"
                    className="font-mono text-sm border border-gray-200 p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                  />
                </div>
                
                {/* Your Email field */}
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="community-email" className="font-mono text-xs text-gray-700 font-medium">
                    Your Email
                  </label>
                  <input
                    id="community-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@email.com"
                    className="font-mono text-sm border border-gray-200 p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 w-full"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <Button
                    variant="default"
                    onClick={handleSaveBuild}
                    disabled={isSaving}
                    className="flex-1 h-7 font-mono text-xs bg-black hover:bg-amber-500 text-white"
                  >
                      {isSaving ? (
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      ) : (
                      <Save className="w-3 h-3 mr-1.5" />
                      )}
                    Save My Build
                  </Button>
                  
                  <Button
                    variant="default"
                    onClick={handleShareBuild}
                    disabled={isSharing || showShareModal}
                    className="flex-1 h-7 font-mono text-xs bg-black hover:bg-amber-500 text-white"
                  >
                      {isSharing ? (
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      ) : (
                      <Share2 className="w-3 h-3 mr-1.5" />
                      )}
                    Share My Build
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center pt-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 stroke-[2.5px] text-black" />
                  <h2 className="font-mono text-sm text-black">Popular Configurations</h2>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {communityLoading && (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              )}
              
              {communityError && (
                <div className="py-4 text-center text-red-500 font-mono text-sm">
                  Failed to load community builds. Please try again.
                </div>
              )}
              
              {!communityLoading && !communityError && communityBuilds.length === 0 && (
                <div className="py-4 text-center text-gray-500 font-mono text-sm">
                  No community builds yet. Be the first to save your configuration!
                </div>
              )}

              {communityBuilds.map((build) => (
                <BuildCard
                  key={build.id}
                  title={build.title}
                  author={build.author}
                  likes={build.likes}
                  selectedOptions={build.selected_options}
                  authorColor={build.author_color}
                  onLike={() => handleLike(build.id!)}
                  onLoad={() => handleLoadBuild(build.id!)}
                />
              ))}
            </div>
          </div>
        );
      default:
        return <ConfiguratorControls />;
    }
  };

  // JSX for the layout
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Main 3D Scene Area */} 
      <div className="flex-grow h-1/2 md:h-full relative group">
        <Scene ref={sceneRef} isTapeMeasureActive={isTapeMeasureActive} />

        {/* Floating Action Buttons for 3D Scene - Top Right */} 
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-20">
          <Button 
            variant="outline"
            size="icon"
            className={`bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full shadow-lg ${isTapeMeasureActive ? 'ring-2 ring-amber-500' : ''}`}
            onClick={() => setIsTapeMeasureActive(!isTapeMeasureActive)}
            aria-label={isTapeMeasureActive ? "Deactivate Tape Measure" : "Activate Tape Measure"}
          >
            <Ruler className={`h-5 w-5 ${isTapeMeasureActive ? 'text-amber-500' : 'text-gray-600 dark:text-gray-300'}`} />
          </Button>
        </div>

        {showSavingsBanner && savings.percentage >= 10 && (
          <SavingsBanner percentage={savings.percentage} />
        )}
      </div>

      {/* Controls Panel */}
      <div className="w-full lg:w-[360px] lg:min-w-[360px] bg-white shadow-xl lg:rounded-l-xl flex flex-col h-[50vh] lg:h-full overflow-y-auto lg:mr-3">
        {/* Tabs */}
        <div className="flex border-b sticky top-0 bg-white z-10 lg:rounded-tl-xl">
          <button
            onClick={() => setActiveTab('configure')}
            className={`flex-1 py-2 px-2 lg:px-3 text-center font-mono uppercase text-sm tracking-wide ${
              activeTab === 'configure' 
                ? 'text-amber-500 border-b-2 border-amber-500' 
                : 'text-black'
            }`}
            aria-label="Configure tab"
            tabIndex={0}
          >
            Configure
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`flex-1 py-2 px-3 text-center font-mono uppercase text-sm tracking-wide ${
              activeTab === 'community' 
                ? 'text-amber-500 border-b-2 border-amber-500' 
                : 'text-black'
            }`}
            aria-label="Community tab"
            tabIndex={0}
          >
            Community
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-2 px-3 text-center font-mono uppercase text-sm tracking-wide ${
              activeTab === 'summary' 
                ? 'text-amber-500 border-b-2 border-amber-500' 
                : 'text-black'
            }`}
            aria-label="Summary tab"
            tabIndex={0}
          >
            Summary
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 lg:p-4">
          {tabContent()}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t sticky bottom-0 bg-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-mono">Total Price</span>
              <span className="text-lg font-bold font-mono">£{priceData.finalPrice.toLocaleString()}</span>
              {savings.percentage > 0 && (
                <span className="text-xs text-green-600 font-mono">
                  Save {savings.percentage}% (£{savings.amount.toFixed(0)})
                </span>
              )}
            </div>
            
            <Button
              variant="default"
              size="lg"
              className="bg-black hover:bg-amber-500 text-white font-mono uppercase tracking-wide px-6"
              onClick={handleCheckoutClick}
              disabled={!chassisId || checkoutLoading}
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Checkout
                </>
              )}
            </Button>
          </div>
          
          {checkoutError && (
            <p className="mt-2 text-red-500 text-xs font-mono">{checkoutError}</p>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Share Your Build</h2>
                <button 
                  onClick={() => {
                    setShowShareModal(false);
                    // Reset sharing state when modal is closed
                    setIsSharing(false);
                  }}
                  className="text-gray-500 hover:text-black transition-colors rounded-full p-1 hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {cardImageUrl ? (
                <div className="w-full relative overflow-hidden rounded-md shadow-md bg-white">
                  <NextImage
                    src={cardImageUrl}
                    alt="Your YAKKT van build"
                    width={1200}
                    height={630}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              ) : (
                <div className="w-full py-12 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-600 mb-2">Custom image generation unavailable</p>
                  <p className="text-sm text-gray-500">You can still share your configuration using the link below</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button 
                  onClick={handleDownloadCard} 
                  className="bg-black hover:bg-amber-500 text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                  disabled={!cardImageUrl && !shareUrl}
                >
                  <Download className="w-4 h-4" />
                  Download Image
                </Button>
                
                <Button 
                  onClick={handleCopyLink} 
                  className="bg-black hover:bg-amber-500 text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                  disabled={!shareUrl}
                >
                  <Link className="w-4 h-4" />
                  Copy Link
                </Button>
                
                <Button 
                  onClick={handleShareToInstagram} 
                  className="bg-black hover:bg-amber-500 text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Instagram className="w-4 h-4" />
                  Instagram
                </Button>
              </div>
              
              <p className="text-sm text-gray-500 text-center mt-4">
                Copy the link to share your build directly, or download the image to share on social media!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfiguratorLayout;