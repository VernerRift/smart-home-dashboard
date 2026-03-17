import { create } from 'zustand';
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
  setDevicesState: (backendDevices: Partial<Device>[]) => void;
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

  setDevicesState: (backendDevices) => set(state => {
    const newPending = [...state.pendingDevices];
    
    // Преобразуем входящие данные с сервера
    const newDevices = backendDevices.map(backendDevice => {
      // Ищем устройство в текущем стейте (если оно там есть)
      const frontendDevice = state.devices.find(d => d.id === backendDevice.id);
      
      // Если устройство новое (его нет на фронте), просто возвращаем его с сервера
      if (!frontendDevice) {
        return backendDevice as Device;
      }

      // Если устройство уже есть на фронте, проверяем pending статус
      const isPending = state.pendingDevices.includes(backendDevice.id as string);
      
      if (isPending && backendDevice.isOn === frontendDevice.isOn) {
        // Сервер подтвердил наш статус isOn. Убираем из pending.
        const index = newPending.indexOf(backendDevice.id as string);
        if (index > -1) newPending.splice(index, 1);
      }
      
      if(isPending) {
        // Сервер еще не обработал нажатие, сохраняем оптимистичный isOn с фронта, 
        // но берем свежие остальные данные с бэка.
        return { ...backendDevice, isOn: frontendDevice.isOn } as Device;
      }

      // Если не в pending, просто принимаем все свежие данные с бэка
      return { ...frontendDevice, ...backendDevice } as Device;
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
