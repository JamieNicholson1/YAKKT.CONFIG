/// <reference types="@react-three/fiber" />
'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { Stage, OrbitControls, useProgress, useGLTF, BakeShadows, Html } from '@react-three/drei';
import { Suspense, useState, useEffect, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import useConfiguratorStore from '@/store/configurator';
import { AnimatedModel } from '@/components/3d/AnimatedModel';
import { LoadingIndicator } from '@/components/3d/LoadingIndicator';

// Screenshot capture component
const ScreenshotHandler = ({ onReady }: { onReady: (capture: () => string) => void }) => {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const captureScreenshot = () => {
      // Ensure the scene is rendered
      gl.render(scene, camera);
      
      // Get the canvas data
      return gl.domElement.toDataURL('image/png');
    };

    onReady(captureScreenshot);
  }, [gl, scene, camera, onReady]);

  return null;
};

export interface SceneRef {
  captureScreenshot: () => string;
}

// Loading manager component
const LoadingManager = ({ children }: { children: React.ReactNode }) => {
  const { progress } = useProgress();
  return (
    <>
      <LoadingIndicator progress={progress} />
      {children}
    </>
  );
};

// Simple spinner for Suspense fallback
const SimpleSpinner = () => (
  <Html center style={{ pointerEvents: 'none' }}>
    <div className="flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      {/* Optional: <p className="mt-2 text-xs text-gray-500">Loading 3D View...</p> */}
    </div>
  </Html>
);

const Scene = forwardRef<SceneRef>((props, ref) => {
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { chassis, options, chassisId, selectedOptionIds } = useConfiguratorStore();
  const [captureFunction, setCaptureFunction] = useState<(() => string) | null>(null);
  const [newOptionId, setNewOptionId] = useState<string | null>(null);
  // New performance settings state
  const [lowPerformanceMode, setLowPerformanceMode] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if device is mobile or low-performance
    const checkDevice = () => {
      const isMobileView = window.innerWidth <= 768;
      setIsMobile(isMobileView);
      
      // Check for low performance devices
      const isLowPerfDevice = isMobileView || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.navigator.hardwareConcurrency <= 4; // Low CPU cores
      
      setLowPerformanceMode(isLowPerfDevice);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Track newly added options
  useEffect(() => {
    const handleNewOption = () => {
      const currentOptions = Array.from(selectedOptionIds);
      if (currentOptions.length > 0) {
        setNewOptionId(currentOptions[currentOptions.length - 1]);
        // Clear the new option flag after animation
        setTimeout(() => setNewOptionId(null), 1000);
      }
    };
    handleNewOption();
  }, [selectedOptionIds]);

  const handleScreenshotReady = useCallback((capture: () => string) => {
    setCaptureFunction(() => capture);
  }, []);

  useImperativeHandle(ref, () => ({
    captureScreenshot: () => {
      if (!captureFunction) return '';
      return captureFunction();
    }
  }), [captureFunction]);

  // Memoize selected models to prevent unnecessary re-renders
  const selectedChassis = useMemo(() => 
    chassis.find(c => c.id === chassisId),
    [chassis, chassisId]
  );
  
  const selectedOptions = useMemo(() => 
    options.filter(o => selectedOptionIds.has(o.id)),
    [options, selectedOptionIds]
  );

  // Preload used models
  useEffect(() => {
    if (selectedChassis) {
      useGLTF.preload(selectedChassis.modelUrl);
    }
    
    selectedOptions.forEach(option => {
      // Only preload if modelUrl exists and is not empty
      if (option.modelUrl && (Array.isArray(option.modelUrl) ? option.modelUrl.length > 0 : option.modelUrl)) {
        const modelUrls = Array.isArray(option.modelUrl) ? option.modelUrl : [option.modelUrl];
        modelUrls.forEach(url => {
          if (url) useGLTF.preload(url); // Ensure url is not null/undefined/empty string before preloading
        });
      }
    });
  }, [selectedChassis, selectedOptions]);

  // Calculate optimal shadow settings based on performance
  const shadowSettings = useMemo(() => ({
    mapSize: lowPerformanceMode ? 1024 : 2048,
    bias: -0.0001,
    intensity: lowPerformanceMode ? 3.0 : 4.5,
    ambient: lowPerformanceMode ? 0.7 : 0.6,
  }), [lowPerformanceMode]);

  if (!isClient) return null;

  // Debug logging - remove in production
  if (process.env.NODE_ENV === 'development') {
    console.log('Scene render:', {
      chassisId,
      selectedChassis,
      selectedOptionIds: Array.from(selectedOptionIds),
      selectedOptions,
      lowPerformanceMode
    });
  }

  return (
    <div className="w-full h-full">
      <Canvas 
        shadows
        camera={{ position: [8, 4, 8], fov: 50 }}
        gl={{ 
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
          antialias: !lowPerformanceMode,
          depth: true
        }}
        dpr={lowPerformanceMode ? 1 : [1, 2]} // Lower resolution on mobile
        performance={{ min: 0.5 }}
      >
        <ScreenshotHandler onReady={handleScreenshotReady} />
        <color attach="background" args={['#f5f5f5']} />
        <fog attach="fog" args={['#f5f5f5', 10, 20]} />
        
        {/* Ambient lighting - reduced to make shadows more visible */}
        <ambientLight intensity={shadowSettings.ambient} />

        {/* Main directional light for shadow casting */}
        <directionalLight
          castShadow
          position={[3, 10, 4]}
          intensity={shadowSettings.intensity}
          shadow-mapSize={[shadowSettings.mapSize, shadowSettings.mapSize]}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-bias={shadowSettings.bias}
        />

        {/* Extra fill light to balance lighting */}
        <directionalLight 
          position={[-5, 3, -5]} 
          intensity={0.3} 
        />

        {/* Ground plane */}
        <mesh 
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.01, 0]}
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#f8f8f8" />
        </mesh>

        <Stage
          adjustCamera={false}
          shadows="contact"
          intensity={0.1}
          environment="city"
          preset={lowPerformanceMode ? "rembrandt" : "soft"}
        >
          <Suspense fallback={<SimpleSpinner />}>
            <LoadingManager>
              {selectedChassis && (
                <AnimatedModel
                  key={selectedChassis.id}
                  modelPath={selectedChassis.modelUrl}
                  position={[0, 0, 0]}
                  rotation={[0, 0, 0]}
                  scale={1}
                  castShadow={true}
                  lowPerformanceMode={lowPerformanceMode}
                />
              )}

              {selectedOptions.map((option) => {
                // Check if modelUrl exists and is not empty before attempting to render
                if (!option.modelUrl || (Array.isArray(option.modelUrl) && option.modelUrl.length === 0) || (!Array.isArray(option.modelUrl) && !option.modelUrl)) {
                  return null; // Don't render anything if no modelUrl
                }

                const modelUrls = Array.isArray(option.modelUrl) ? option.modelUrl : [option.modelUrl];
                return modelUrls.map((url, index) => {
                  if (!url) return null; // Skip if a URL in the array is empty/null
                  return (
                    <AnimatedModel
                      key={`${option.id}-${index}`}
                      modelPath={url}
                      position={[0, 0, 0]}
                      rotation={[0, 0, 0]}
                      scale={1}
                      castShadow={true}
                      isNew={option.id === newOptionId}
                      lowPerformanceMode={lowPerformanceMode}
                    />
                  );
                });
              })}
            </LoadingManager>
          </Suspense>
        </Stage>

        {/* Performance optimization: bake shadows into a texture */}
        <BakeShadows />

        <OrbitControls
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
          minDistance={3.5}
          maxDistance={15}
          enableDamping={true}
          dampingFactor={0.1}
          rotateSpeed={isMobile ? 0.3 : 0.5}
          zoomSpeed={isMobile ? 0.3 : 0.5}
          target={[0, 0, 0]}
          enablePan={true}
          panSpeed={isMobile ? 0.3 : 0.5}
          zoomToCursor={true}
          enableRotate={true}
          enableZoom={true}
        />
      </Canvas>
    </div>
  );
});

Scene.displayName = 'Scene';

export default Scene; 