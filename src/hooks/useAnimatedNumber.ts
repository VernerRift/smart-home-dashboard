import { useState, useEffect, useRef } from 'react';

// Easing-функция для более плавной анимации (замедление в конце)
const easeOutQuad = (t: number) => t * (2 - t);

export const useAnimatedNumber = (targetValue: number, duration: number = 500) => {
  const [currentValue, setCurrentValue] = useState(targetValue);
  const animationFrameId = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const startValue = useRef(currentValue);

  useEffect(() => {
    startValue.current = currentValue;
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) {
        startTime.current = timestamp;
      }

      const elapsedTime = timestamp - startTime.current;
      const progress = Math.min(elapsedTime / duration, 1);
      const easedProgress = easeOutQuad(progress);

      const nextValue = startValue.current + (targetValue - startValue.current) * easedProgress;
      setCurrentValue(nextValue);

      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue);
      }
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [targetValue, duration]); // Убрали currentValue из зависимостей

  return Math.round(currentValue);
};
