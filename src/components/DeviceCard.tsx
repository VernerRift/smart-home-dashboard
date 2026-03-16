import React from 'react';
import clsx from 'clsx';
import { useDashboardStore } from '../store/useDashboardStore';
import type { Device } from '../store/useDashboardStore';
import { Flame, Refrigerator, Waves, Lamp, Bed, Zap, Activity, Plug, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Flame, Refrigerator, Waves, Lamp, Bed, Zap, Activity,
};

const DeviceCard: React.FC<{ device: Device }> = ({ device }) => {
  // Возвращаем использование метода toggleDevice из стора
  const toggleDevice = useDashboardStore(state => state.toggleDevice);
  const pendingDevices = useDashboardStore(state => state.pendingDevices);
  
  const isPending = pendingDevices.includes(device.id);

  const handleToggle = () => {
    if (isPending) return;
    toggleDevice(device.id); // Теперь это безопасно
  };

  const IconComponent = iconMap[device.iconName] || Plug;

  return (
    <div
      className={clsx(
        'rounded-2xl p-5 flex flex-col justify-between transition-all duration-300',
        'bg-slate-900 dark:bg-slate-800 shadow-lg',
        isPending && 'opacity-70'
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className={clsx('p-2 rounded-lg', device.isOn ? 'bg-blue-500/10' : 'bg-slate-700')}>
            <IconComponent
              size={24}
              className={clsx('transition-colors duration-300', device.isOn ? 'text-blue-400' : 'text-slate-500')}
            />
          </div>
          <h3 className="font-semibold text-lg text-slate-100">{device.name}</h3>
        </div>

        <div className="flex items-center gap-2">
          {isPending && <Loader2 size={20} className="animate-spin text-blue-500" />}
          <label
            htmlFor={`toggle-${device.id}`}
            className={clsx(
              'relative inline-flex items-center',
              isPending ? 'cursor-not-allowed' : 'cursor-pointer'
            )}
          >
            <input
              type="checkbox"
              id={`toggle-${device.id}`}
              className="sr-only peer"
              checked={device.isOn}
              onChange={handleToggle}
              disabled={isPending}
            />
            <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <p className="text-sm text-slate-400">Потребление</p>
          <p className={clsx('text-2xl font-semibold transition-opacity duration-300', device.isOn ? 'text-white' : 'text-slate-500 opacity-70')}>
            {device.isOn ? `${device.powerDrawW} Вт` : '0 Вт'}
          </p>
        </div>
        {device.isCritical && (
          <div className="flex items-center gap-2 bg-rose-500/10 text-rose-400 text-xs font-medium px-3 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            Критично
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceCard;
