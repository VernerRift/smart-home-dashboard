import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDashboardStore } from '../store/useDashboardStore';
import { SortableDeviceCard } from './SortableDeviceCard';

export const DeviceList: React.FC = () => {
  const { devices, reorderDevices } = useDashboardStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px movement before drag starts (allows clicks on buttons inside card)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = devices.findIndex((device) => device.id === active.id);
      const newIndex = devices.findIndex((device) => device.id === over.id);

      reorderDevices(oldIndex, newIndex);
    }
  };

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={devices.map(d => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3">
            {devices.map((device) => (
              <SortableDeviceCard key={device.id} device={device} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
