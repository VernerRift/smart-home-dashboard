import React from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { WifiOff } from 'lucide-react';
import clsx from 'clsx';

export const ConnectionStatus: React.FC = () => {
  // Подтягиваем статус подключения из стора
  const isConnected = useDashboardStore((state) => state.isConnected);

  return (
    <>
      {isConnected ? (
        // --- Состояние "Онлайн" ---
        <div
          className={clsx(
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium',
            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          )}
        >
          <span className="relative flex h-2 w-2">
            {/* Анимированная точка для эффекта "сердцебиения" */}
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Система онлайн
        </div>
      ) : (
        // --- Состояние "Офлайн" ---
        <div
          className={clsx(
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium',
            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          )}
        >
          <WifiOff size={14} />
          Связь потеряна
        </div>
      )}
    </>
  );
};
