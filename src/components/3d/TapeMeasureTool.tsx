'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, Html } from '@react-three/drei';

interface TapeMeasureToolProps {
  isActive: boolean;
}

export const TapeMeasureTool: React.FC<TapeMeasureToolProps> = ({ isActive }) => {
  const { scene, camera, raycaster, pointer, gl, size } = useThree(); // Added gl and size
  const [points, setPoints] = useState<THREE.Vector3[]>([]);
  const [measurement, setMeasurement] = useState<{ distance: string; position: THREE.Vector3 } | null>(null);
  const [tempLineEnd, setTempLineEnd] = useState<THREE.Vector3 | null>(null);
  const isDragging = useRef(false); // To differentiate click from drag on orbit controls

  const handleClick = useCallback((event: MouseEvent) => {
    if (!isActive || points.length >= 2 || isDragging.current) return;

    const rect = gl.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      // Only consider intersections with Meshes that are visible
      const firstVisibleMeshIntersection = intersects.find(intersect => intersect.object instanceof THREE.Mesh && intersect.object.visible);
      if (!firstVisibleMeshIntersection) return;

      const intersectPoint = firstVisibleMeshIntersection.point;
      const newPoints = [...points, intersectPoint.clone()];
      setPoints(newPoints);

      if (newPoints.length === 2) {
        const distanceInSceneUnits = newPoints[0].distanceTo(newPoints[1]);
        console.log('Raw distance from distanceTo() (scene units):', distanceInSceneUnits);
        const distanceInCm = (distanceInSceneUnits * 100).toFixed(1);
        
        // Position label slightly above and offset from the second point, towards camera
        const midPoint = new THREE.Vector3().addVectors(newPoints[0], newPoints[1]).multiplyScalar(0.5);
        const labelPosition = newPoints[1].clone(); //.lerp(midPoint, 0.1); // Closer to point B
        // Small offset to prevent z-fighting and make it more readable if on a surface
        labelPosition.add(new THREE.Vector3(0, 0.05, 0)); 

        setMeasurement({
          distance: `${distanceInCm} cm`,
          position: labelPosition,
        });
        setTempLineEnd(null);
      } else if (newPoints.length === 1) {
        setMeasurement(null);
      }
    }
  }, [isActive, points, scene, camera, raycaster, pointer, gl.domElement]);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!isActive || points.length !== 1) {
      setTempLineEnd(null);
      return;
    }

    const rect = gl.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const firstVisibleMeshIntersection = intersects.find(intersect => intersect.object instanceof THREE.Mesh && intersect.object.visible);
      if (firstVisibleMeshIntersection) {
        setTempLineEnd(firstVisibleMeshIntersection.point.clone());
      }
    } else {
      setTempLineEnd(null);
    }
  }, [isActive, points, scene, camera, raycaster, pointer, gl.domElement]);

  // Detect if OrbitControls is dragging to prevent clicks during drag
  useEffect(() => {
    const canvasElement = gl.domElement;
    const onPointerDown = () => { isDragging.current = false; };
    const onPointerMoveDuringDrag = () => { isDragging.current = true; }; // If move happens after down, it's a drag
    
    canvasElement.addEventListener('pointerdown', onPointerDown);
    canvasElement.addEventListener('pointermove', onPointerMoveDuringDrag);
    
    return () => {
      canvasElement.removeEventListener('pointerdown', onPointerDown);
      canvasElement.removeEventListener('pointermove', onPointerMoveDuringDrag);
    };
  }, [gl.domElement]);


  useEffect(() => {
    const canvasElement = gl.domElement;
    if (isActive) {
      canvasElement.addEventListener('click', handleClick);
      canvasElement.addEventListener('pointermove', handlePointerMove);
      // Change cursor style
      canvasElement.style.cursor = 'crosshair';
    } else {
      canvasElement.style.cursor = 'auto'; // Reset cursor
    }
    
    return () => {
      canvasElement.removeEventListener('click', handleClick);
      canvasElement.removeEventListener('pointermove', handlePointerMove);
      canvasElement.style.cursor = 'auto'; // Ensure cursor is reset on unmount/cleanup
    };
  }, [isActive, handleClick, handlePointerMove, gl.domElement]);
  
  useEffect(() => {
    if (!isActive) {
      setPoints([]);
      setMeasurement(null);
      setTempLineEnd(null);
    }
  }, [isActive]);

  if (!isActive && points.length === 0) return null; // Only render if active or if points are set (even if tool becomes inactive)

  return (
    <>
      {/* Measurement line (solid) */}
      {points.length === 2 && points[0] && points[1] && (
        <Line
          points={[points[0], points[1]]}
          color="#FFA500" // Orange color
          lineWidth={2.5}
          dashed={false}
        />
      )}
      {/* Temporary line from first point to cursor (dashed) */}
      {points.length === 1 && points[0] && tempLineEnd && (
         <Line
            points={[points[0], tempLineEnd]}
            color="#FFA500"
            lineWidth={1.5}
            dashed={true}
            dashSize={0.05}
            gapSize={0.025}
        />
      )}
      {/* Measurement text label */}
      {measurement && (
        <Html position={measurement.position} zIndexRange={[100,0]} /* Ensure HTML is on top */ >
          <div
            style={{
              padding: '4px 8px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              transform: 'translate(-50%, -150%)', // Adjust to position above point B
            }}
          >
            {measurement.distance}
          </div>
        </Html>
      )}
      {/* Visual markers for selected points */}
      {points.map((p, i) => (
        <mesh key={`point-${i}`} position={p}>
          <sphereGeometry args={[0.015, 16, 16]} /> {/* Smaller spheres */}
          <meshStandardMaterial color="#FFA500" emissive="#FFA500" emissiveIntensity={1} roughness={0.4} metalness={0.1} />
        </mesh>
      ))}
    </>
  );
}; 