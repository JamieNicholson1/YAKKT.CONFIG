import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface SavingsBannerProps {
  percentage: number;
}

const SavingsBanner: React.FC<SavingsBannerProps> = ({ percentage }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Trigger confetti when the banner appears
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#22c55e', '#16a34a', '#15803d']
      });

      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#22c55e', '#16a34a', '#15803d']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Start fade out animation after 4.5 seconds
    const fadeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 4500);

    return () => clearTimeout(fadeTimer);
  }, []);

  return (
    <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none transition-all duration-500 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
    }`}>
      <div className="bg-green-500/90 text-white px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm">
        <div className="font-mono text-2xl font-bold tracking-wide text-center">
          {percentage}% SAVED!
        </div>
        <div className="text-sm font-mono text-center mt-1 text-green-100">
          Great choice on the upgrades!
        </div>
      </div>
    </div>
  );
};

export default SavingsBanner; 