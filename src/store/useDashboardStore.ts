import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import { socketService } from '../services/socketService';

export interface Device {
  id: string;
  name: string;
  isOn: boolean;
  powerDrawW: number;
  isCritical: boolean;
  iconName: string;
}

export interface HistoryPoint {
  time: string;
  load: number;
}

interface DashboardState {
  devices: Device[];
  pendingDevices: string[];
  history: HistoryPoint[];
  isConnected: boolean;
  
  connect: () => void;
  toggleDevice: (id: string) => void;
  addDevice: () => void;
  updateDevice: (id: string, updates: Partial<Omit<Device, 'id'>>) => void;
  removeDevice: (id: string) => void;
  reorderDevices: (oldIndex: number, newIndex: number) => void;
  setDevicesState: (backendDevices: Device[]) => void;
  setConnectionStatus: (status: boolean) => void;
  addHistoryPoint: () => void;
  getTotalConsumption: () => number;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  devices: [], // Начальное состояние пустое, все придет с сервера
  pendingDevices: [],
  history: [],
  isConnected: false,

  connect: () => socketService.connect({
    onOpen: () => set({ isConnected: true }),
    onMessage: (data) => get().setDevicesState(data),
    onClose: () => set({ isConnected: false }),
  }),

  toggleDevice: (id: string) => {
    set(state => ({
      pendingDevices: [...state.pendingDevices, id],
      devices: state.devices.map(d => d.id === id ? { ...d, isOn: !d.isOn } : d),
    }));
    socketService.sendToggleCommand(id);
  },

  addDevice: () => {
    socketService.sendAddDeviceCommand();
  },

  updateDevice: (id, updates) => {
    // Оптимистичное обновление на фронтенде перед подтверждением с сервера
    set(state => ({
      devices: state.devices.map(d => d.id === id ? { ...d, ...updates } : d),
    }));
    socketService.sendUpdateDeviceCommand(id, updates);
  },

  removeDevice: (id: string) => {
    set(state => ({
      devices: state.devices.filter(d => d.id !== id),
    }));
    socketService.sendRemoveDeviceCommand(id);
  },

  reorderDevices: (oldIndex: number, newIndex: number) => {
    set(state => {
      const newDevices = arrayMove(state.devices, oldIndex, newIndex);
      socketService.sendReorderCommand(newDevices.map(d => d.id));
      return { devices: newDevices };
    });
  },

  setDevicesState: (backendDevices) => set(state => {
    const newPending = [...state.pendingDevices];
    const newDevices = backendDevices.map(backendDevice => {
      const frontendDevice = state.devices.find(d => d.id === backendDevice.id);
      if (!frontendDevice) return backendDevice;

      const isPending = state.pendingDevices.includes(backendDevice.id);
      if (isPending && backendDevice.isOn === frontendDevice.isOn) {
        const index = newPending.indexOf(backendDevice.id);
        if (index > -1) newPending.splice(index, 1);
      }
      
      if(isPending) {
        return { ...backendDevice, isOn: frontendDevice.isOn };
      }

      return { ...frontendDevice, ...backendDevice };
    });
    return { devices: newDevices, pendingDevices: newPending };
  }),

  setConnectionStatus: (status: boolean) => set({ isConnected: status }),
  getTotalConsumption: () => get().devices.filter(d => d.isOn).reduce((sum, d) => sum + d.powerDrawW, 0),
  addHistoryPoint: () => {
    const totalLoad = get().getTotalConsumption();
    const time = new Date().toLocaleTimeString('ru-RU');
    set(state => ({ history: [...state.history, { time, load: totalLoad }].slice(-60) }));
  },
}));
