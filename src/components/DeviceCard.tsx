import React from 'react';
import { Zap } from 'lucide-react';
import clsx from 'clsx';
import { useDashboardStore } from '../store/useDashboardStore';
import type { Device } from '../store/useDashboardStore';

interface DeviceCardProps {
  device: Device;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
  const { toggleDevice } = useDashboardStore();

  const handleToggle = () => {
    toggleDevice(device.id);
  };

  return (
    <div
      className={clsx(
        'rounded-2xl p-5 flex flex-col justify-between transition-all duration-300',
        'bg-white dark:bg-gray-800 shadow-lg dark:shadow-2xl',
        !device.isOn && 'bg-gray-50 dark:bg-gray-800/50'
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className={clsx(
            'p-2 rounded-lg',
            device.isOn ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-200 dark:bg-gray-700'
          )}>
            <Zap
              size={24}
              className={clsx(
                'transition-colors duration-300',
                device.isOn ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              )}
            />
          </div>
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
            {device.name}
          </h3>
        </div>

        <label htmlFor={`toggle-${device.id}`} className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id={`toggle-${device.id}`}
            className="sr-only peer"
            checked={device.isOn}
            onChange={handleToggle}
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Потребление</p>
          <p
            className={clsx(
              'text-2xl font-semibold transition-opacity duration-300',
              device.isOn
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-400 dark:text-gray-500 opacity-70'
            )}
          >
            {device.isOn ? `${device.powerDrawW} Вт` : '0 Вт'}
          </p>
        </div>

        {device.isCritical && (
          <div className="flex items-center gap-2 bg-red-100 text-red-800 text-xs font-medium px-3 py-1 rounded-full dark:bg-red-900 dark:text-red-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Критично
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceCard;