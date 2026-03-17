import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as Icons from 'lucide-react';
import { Device, useDashboardStore } from '../store/useDashboardStore';

interface SortableDeviceCardProps {
  device: Device;
}

export const SortableDeviceCard: React.FC<SortableDeviceCardProps> = ({ device }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: device.id });
  const { updateDevice, optimisticToggle } = useDashboardStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(device.name);
  const [editPower, setEditPower] = useState(device.powerDrawW.toString());

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  };

  const handleSave = () => {
    updateDevice(device.id, {
      name: editName,
      powerDrawW: parseInt(editPower, 10) || 0,
    });
    setIsEditing(false);
  };

  const IconComponent = (Icons as Record<string, React.ElementType>)[device.iconName] || Icons.HelpCircle;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-800 rounded-xl p-4 flex items-center justify-between border border-gray-700 transition-colors ${
        isDragging ? 'opacity-70 shadow-2xl border-blue-500' : 'shadow-lg hover:border-gray-600'
      }`}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing p-1 touch-none"
        >
          <Icons.GripVertical size={20} />
        </button>

        {/* Icon */}
        <div className={`p-3 rounded-lg flex-shrink-0 ${device.isOn ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
          <IconComponent size={24} />
        </div>

        {/* Info / Edit Mode */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex flex-col gap-2 mr-4">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-gray-100 text-sm focus:outline-none focus:border-blue-500 w-full"
                placeholder="Имя устройства"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editPower}
                  onChange={(e) => setEditPower(e.target.value)}
                  className="bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-gray-100 text-sm focus:outline-none focus:border-blue-500 w-24"
                  placeholder="Вт"
                />
                <span className="text-gray-400 text-sm">Вт</span>
              </div>
            </div>
          ) : (
            <div className="truncate pr-4">
              <h3 className="text-gray-100 font-medium truncate">{device.name}</h3>
              <p className="text-gray-400 text-sm">{device.powerDrawW} Вт</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isEditing && (
          <button
            onClick={() => optimisticToggle(device.id)}
            className={`p-2 rounded-lg transition-colors ${
              device.isOn 
                ? 'text-blue-400 hover:bg-blue-400/10' 
                : 'text-gray-400 hover:bg-gray-700'
            }`}
            title={device.isOn ? "Выключить" : "Включить"}
          >
            <Icons.Power size={20} />
          </button>
        )}

        {isEditing ? (
          <button
            onClick={handleSave}
            className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
            title="Сохранить"
          >
            <Icons.Check size={20} />
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
            title="Редактировать"
          >
            <Icons.Pencil size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
