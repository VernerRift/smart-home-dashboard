import { create } from 'zustand';

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
  
  optimisticToggle: (id: string) => void; // <-- Только этот метод нужен для UI
  setDevicesState: (backendDevices: Partial<Device>[]) => void;
  setConnectionStatus: (status: boolean) => void;
  addHistoryPoint: () => void;
  getTotalConsumption: () => number;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  devices: [
    { id: 'boiler', name: 'Газовый котел Bosch Gaz 3000 W', isOn: true, powerDrawW: 120, isCritical: true, iconName: 'Flame' },
    { id: 'pumps', name: 'Циркуляционные насосы', isOn: true, powerDrawW: 90, isCritical: true, iconName: 'Activity' },
    { id: 'fridge', name: 'Холодильники', isOn: false, powerDrawW: 300, isCritical: false, iconName: 'Refrigerator' },
    { id: 'inverter', name: 'Инвертор', isOn: true, powerDrawW: 25, isCritical: true, iconName: 'Zap' },
    { id: 'living_room', name: 'Гостиная', isOn: true, powerDrawW: 60, isCritical: false, iconName: 'Lamp' },
    { id: 'bedroom', name: 'Спальня', isOn: false, powerDrawW: 40, isCritical: false, iconName: 'Bed' },
  ],
  pendingDevices: [],
  history: [],
  isConnected: false,

  optimisticToggle: (id: string) => {
    set(state => ({
      pendingDevices: [...state.pendingDevices, id],
      devices: state.devices.map(device =>
        device.id === id ? { ...device, isOn: !device.isOn } : device
      ),
    }));
  },

  setDevicesState: (backendDevices) => set(state => {
    const newPending = [...state.pendingDevices];
    const newDevices = state.devices.map(device => {
      const backendUpdate = backendDevices.find(d => d.id === device.id);
      if (!backendUpdate) return device;

      const isPending = state.pendingDevices.includes(device.id);
      let finalIsOn = device.isOn;

      if (isPending) {
        if (backendUpdate.isOn === device.isOn) {
          const index = newPending.indexOf(device.id);
          if (index > -1) newPending.splice(index, 1);
        }
        finalIsOn = device.isOn;
      } else {
        finalIsOn = backendUpdate.isOn ?? device.isOn;
      }

      return {
        ...device,
        isOn: finalIsOn,
        powerDrawW: backendUpdate.powerDrawW ?? device.powerDrawW,
      };
    });

    return {
      devices: newDevices,
      pendingDevices: newPending,
    };
  }),

  setConnectionStatus: (status: boolean) => set({ isConnected: status }),
  getTotalConsumption: () => get().devices.filter(d => d.isOn).reduce((sum, d) => sum + d.powerDrawW, 0),
  addHistoryPoint: () => {
    const totalLoad = get().getTotalConsumption();
    const time = new Date().toLocaleTimeString('ru-RU');
    set(state => ({ history: [...state.history, { time, load: totalLoad }].slice(-60) }));
  },
}));
