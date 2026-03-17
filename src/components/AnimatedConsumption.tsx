import React from 'react';
import type { ReactNode } from 'react'; // Исправленный импорт
import { Zap } from 'lucide-react';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

interface AnimatedConsumptionProps {
  value: number;
  unit?: string;
  icon?: ReactNode;
}

export const AnimatedConsumption: React.FC<AnimatedConsumptionProps> = ({
  value,
  unit = 'Вт',
  icon,
}) => {
  const animatedValue = useAnimatedNumber(value, 500);
  const displayIcon = icon ?? <Zap size={32} className="text-blue-500" />;

  return (
    <div className="flex items-center justify-center gap-3 p-4 bg-slate-900 rounded-2xl">
      {displayIcon}
      <div className="flex items-baseline">
        <span className="text-4xl font-bold text-white tracking-tight">
          {animatedValue}
        </span>
        <span className="ml-1 text-xl font-medium text-slate-400">
          {unit}
        </span>
      </div>
    </div>
  );
};
