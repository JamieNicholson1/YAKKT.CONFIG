'use client';

import { Canvas } from '@react-three/fiber';
import { Stage, OrbitControls } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import useConfiguratorStore from '@/store/configurator';
import { Model } from '@/components/3d';

const LoadingSpinner = () => (
  <mesh>
    <sphereGeometry args={[0.5, 32, 32]} />
    <meshStandardMaterial color="#2563eb" />
  </mesh>
);

const Scene = () => {
  const [isClient, setIsClient] = useState(false);
  const { chassis, options, chassisId, selectedOptionIds } = useConfiguratorStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const selectedChassis = chassis.find(c => c.id === chassisId);
  const selectedOptions = options.filter(o => selectedOptionIds.has(o.id));

  // Debug logging
  console.log('Scene render:', {
    chassisId,
    selectedChassis,
    selectedOptionIds: Array.from(selectedOptionIds),
    selectedOptions
  });

  return (
    <div className="w-full h-full">
      <Canvas shadows camera={{ position: [8, 4, 8], fov: 50 }}>
        <color attach="background" args={['#f5f5f5']} />
        <fog attach="fog" args={['#f5f5f5', 10, 20]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[10, 10, 5]}
          intensity={1}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <Stage adjustCamera={false} shadows="contact">
          <Suspense fallback={<LoadingSpinner />}>
            {/* Load chassis model if selected */}
            {selectedChassis && (
              <Model
                key={selectedChassis.id}
                modelPath={selectedChassis.modelUrl}
                position={[0, 0, 0]}
                rotation={[0, 0, 0]}
                scale={1}
              />
            )}

            {/* Load selected option models */}
            {selectedOptions.map((option) => (
              <Model
                key={option.id}
                modelPath={option.modelUrl}
                position={[0, 0, 0]}
                rotation={[0, 0, 0]}
                scale={1}
              />
            ))}
          </Suspense>
        </Stage>

        <OrbitControls
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={15}
        />
      </Canvas>
    </div>
  );
};

export default Scene; 