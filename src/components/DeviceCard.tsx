import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useDashboardStore } from '../store/useDashboardStore';
import type { Device } from '../store/useDashboardStore';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const availableIcons = [
  'Router', 'Database', 'Camera', 'Server', 'Flame', 'Waves', 'Refrigerator',
  'Zap', 'Lamp', 'Bed', 'PlusCircle', 'Tv', 'Laptop', 'Microwave', 'Fan', 'Activity', 'Plug'
];

interface DeviceCardProps {
  device: Device;
  isEditing?: boolean;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, isEditing = false }) => {
  const toggleDevice = useDashboardStore(state => state.toggleDevice);
  const updateDevice = useDashboardStore(state => state.updateDevice);
  const removeDevice = useDashboardStore(state => state.removeDevice);
  const pendingDevices = useDashboardStore(state => state.pendingDevices);
  
  const isPending = pendingDevices.includes(device.id);

  const [editValues, setEditValues] = useState({
    name: device.name,
    iconName: device.iconName,
    powerDrawW: device.powerDrawW,
    isCritical: device.isCritical,
  });

  useEffect(() => {
    if (!isEditing) {
      setEditValues({
        name: device.name,
        iconName: device.iconName,
        powerDrawW: device.powerDrawW,
        isCritical: device.isCritical,
      });
    }
  }, [isEditing, device.name, device.iconName, device.powerDrawW, device.isCritical]);

  const handleToggle = () => {
    if (isPending) return;
    toggleDevice(device.id);
  };

  const handleInputChange = (field: keyof typeof editValues, value: string | number | boolean) => {
    const newValues = { ...editValues, [field]: value };
    setEditValues(newValues);
    updateDevice(device.id, newValues);
  };

  const handleDelete = () => {
    if (window.confirm(`Вы уверены, что хотите удалить устройство "${device.name}"?`)) {
      removeDevice(device.id);
    }
  };

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: device.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const IconComponent = (Icons[device.iconName as keyof typeof Icons] as LucideIcon) || Icons.Plug;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'rounded-2xl p-5 flex flex-col justify-between relative',
        'bg-slate-900 dark:bg-slate-800 shadow-lg',
        !isDragging && 'transition-all duration-300', // Отключаем CSS-анимации во время перетаскивания
        isPending && 'opacity-70',
        isDragging && 'shadow-2xl shadow-blue-500/50 z-10'
      )}
    >
      {isEditing && (
        <button
          onClick={handleDelete}
          className="absolute top-4 right-4 text-slate-500 hover:text-rose-500 transition-colors p-1 z-20"
          title="Удалить устройство"
        >
          <Icons.Trash2 size={18} />
        </button>
      )}

      <div className="flex justify-between items-start mb-4 gap-4">
        
        {isEditing ? (
          <div className="flex items-start gap-2 w-full pr-8">
            <button 
              {...attributes} 
              {...listeners} 
              className="cursor-grab active:cursor-grabbing text-slate-500 mt-1 flex-shrink-0 touch-none p-2 -ml-2 rounded-lg hover:bg-slate-800"
            >
              <Icons.GripVertical size={20} />
            </button>
            <div className="flex flex-col gap-2 w-full pt-1">
              <div className="flex items-center gap-2 w-full">
                <select 
                  value={editValues.iconName} 
                  onChange={(e) => handleInputChange('iconName', e.target.value)} 
                  className="bg-slate-700 text-white rounded-md px-2 py-1 flex-shrink-0"
                >
                  {availableIcons.map(iconName => <option key={iconName} value={iconName}>{iconName}</option>)}
                </select>
                <input 
                  type="text" 
                  value={editValues.name} 
                  onChange={(e) => handleInputChange('name', e.target.value)} 
                  className="bg-slate-700 text-white rounded-md px-2 py-1 w-full" 
                  placeholder="Название" 
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 min-w-0"> 
            <div className={clsx('p-2 rounded-lg flex-shrink-0', device.isOn ? 'bg-blue-500/10' : 'bg-slate-700')}>
              <IconComponent
                size={24}
                className={clsx('transition-colors duration-300', device.isOn ? 'text-blue-400' : 'text-slate-500')}
              />
            </div>
            <h3 className="font-semibold text-lg text-slate-100 truncate">{device.name}</h3>
          </div>
        )}

        {!isEditing && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {isPending && <Icons.Loader2 size={20} className="animate-spin text-blue-500" />}
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
        )}
      </div>

      <div className="flex justify-between items-end">
        {isEditing ? (
           <div className="flex flex-col gap-3 pl-8">
             <div className="flex items-center gap-2">
               <input 
                 type="number" 
                 value={editValues.powerDrawW} 
                 onChange={(e) => handleInputChange('powerDrawW', Number(e.target.value))} 
                 className="bg-slate-700 text-white rounded-md px-2 py-1 w-24" 
               />
               <span className="text-sm text-slate-400">Вт</span>
               <div className="group relative flex items-center gap-1 text-slate-500 ml-2 cursor-help">
                 <Icons.Info size={16} />
                 <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                   Только для демо
                 </span>
               </div>
             </div>
             
             <div className="flex items-center gap-3">
               <label htmlFor={`critical-${device.id}`} className="relative inline-flex items-center cursor-pointer">
                 <input
                   type="checkbox"
                   id={`critical-${device.id}`}
                   className="sr-only peer"
                   checked={editValues.isCritical}
                   onChange={(e) => handleInputChange('isCritical', e.target.checked)}
                 />
                 <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
               </label>
               <span className="text-sm text-slate-300">Критически важное</span>
             </div>
           </div>
        ) : (
          <div>
            <p className="text-sm text-slate-400">Потребление</p>
            <p className={clsx('text-2xl font-semibold transition-opacity duration-300', device.isOn ? 'text-white' : 'text-slate-500 opacity-70')}>
              {device.isOn ? `${device.powerDrawW} Вт` : '0 Вт'}
            </p>
          </div>
        )}
        
        {device.isCritical && !isEditing && (
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
