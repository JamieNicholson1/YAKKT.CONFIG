'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Download, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function RenderPage() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get screenshot from localStorage
    const screenshot = localStorage.getItem('yakkt_screenshot');
    if (!screenshot) {
      setError('No image available. Please return to the configurator and try again.');
      return;
    }
    setOriginalImage(screenshot);
    // Clean up localStorage
    localStorage.removeItem('yakkt_screenshot');
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (!originalImage) {
      setError('No image available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: originalImage,
          prompt,
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
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!aiImage) return;
    
    const link = document.createElement('a');
    link.href = aiImage;
    link.download = 'ai-render.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!aiImage) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My YAKKT Campervan AI Render',
          text: 'Check out my custom campervan configuration!',
          url: aiImage,
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(aiImage);
        alert('Image URL copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">AI Render</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/')}
        >
          Back to Configurator
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Original Image */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Your Configuration</h2>
          {originalImage ? (
            <div className="relative aspect-video">
              <Image 
                src={originalImage} 
                alt="Van configuration" 
                fill
                className="object-contain rounded-lg"
                priority
              />
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">No image available</p>
            </div>
          )}
        </Card>

        {/* AI Render Section */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">AI Render</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium mb-2">
                  Describe your dream scene
                </label>
                <Input
                  id="prompt"
                  placeholder="e.g., 'Show my van in Yosemite National Park at sunset'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full"
                />
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={isLoading || !originalImage}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate AI Render'
                )}
              </Button>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              {aiImage && (
                <div className="mt-4">
                  <div className="relative aspect-video">
                    <Image 
                      src={aiImage} 
                      alt="AI generated render" 
                      fill
                      className="object-contain rounded-lg"
                      priority
                    />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleDownload}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleShare}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
} 