import { useState, useEffect, useRef } from 'react';

const easeOutQuad = (t: number) => t * (2 - t);

export const useAnimatedNumber = (targetValue: number, duration: number = 500) => {
  const [currentValue, setCurrentValue] = useState(targetValue);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const startValue = currentValue;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const elapsedTime = timestamp - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const easedProgress = easeOutQuad(progress);

      const nextValue = startValue + (targetValue - startValue) * easedProgress;
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
  }, [targetValue, duration]); // Зависимость только от targetValue и duration

  // Синхронизируем начальное состояние, если оно изменилось извне
  useEffect(() => {
    setCurrentValue(targetValue);
  }, [targetValue]);

  return Math.round(currentValue);
};
