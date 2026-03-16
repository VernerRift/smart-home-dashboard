import React from 'react';
import { Zap } from 'lucide-react';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

interface AnimatedConsumptionProps {
  value: number;
}

export const AnimatedConsumption: React.FC<AnimatedConsumptionProps> = ({ value }) => {
  // Используем хук для получения анимированного значения
  const animatedValue = useAnimatedNumber(value, 500);

  return (
    <div className="flex items-center justify-center gap-3 p-4 bg-slate-900 rounded-2xl">
      <Zap size={32} className="text-blue-500" />
      <div className="flex items-baseline">
        <span className="text-4xl font-bold text-white tracking-tight">
          {animatedValue}
        </span>
        <span className="ml-1 text-xl font-medium text-slate-400">
          Вт
        </span>
      </div>
    </div>
  );
};
