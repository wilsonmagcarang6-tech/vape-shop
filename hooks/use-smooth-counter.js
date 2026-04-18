import { useState, useEffect } from 'react';

/**
 * A hook that animates a value from 0 to the target value over a specified duration.
 * @param {number} targetValue The value to animate to.
 * @param {number} duration The animation duration in milliseconds.
 * @param {number} delay Delay before starting the animation in milliseconds.
 * @returns {object} An object containing the current display value and whether the animation is complete.
 */
export function useSmoothCounter(targetValue, duration = 1000, delay = 0) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime - delay) / duration, 1);

      if (progress >= 0) {
        setDisplayValue(Math.floor(progress * targetValue));
      }

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
        setIsComplete(true);
      }
    };

    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animationFrame);
    };
  }, [targetValue, duration, delay]);

  return { displayValue, isComplete };
}
