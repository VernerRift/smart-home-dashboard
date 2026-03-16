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
  history: HistoryPoint[];
  toggleDevice: (id: string) => void;
  getTotalConsumption: () => number;
  addHistoryPoint: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  devices: [
    { id: '1', name: 'Газовый котел Bosch Gaz 3000 W', isOn: true, powerDrawW: 120, isCritical: true, iconName: 'Flame' },
    { id: '2', name: 'Циркуляционные насосы', isOn: true, powerDrawW: 90, isCritical: true, iconName: 'Activity' },
    { id: '3', name: 'Холодильники', isOn: false, powerDrawW: 300, isCritical: false, iconName: 'Refrigerator' },
    { id: '4', name: 'Резервный инвертор', isOn: true, powerDrawW: 25, isCritical: true, iconName: 'Zap' },
    { id: '5', name: 'Гостиная', isOn: true, powerDrawW: 60, isCritical: false, iconName: 'Lamp' },
    { id: '6', name: 'Спальня', isOn: false, powerDrawW: 40, isCritical: false, iconName: 'Bed' },
  ],
  history: [],

  toggleDevice: (id) =>
    set((state) => ({
      devices: state.devices.map((device) =>
        device.id === id ? { ...device, isOn: !device.isOn } : device
      ),
    })),

  getTotalConsumption: () => {
    return get().devices
      .filter(device => device.isOn)
      .reduce((total, device) => total + device.powerDrawW, 0);
  },

  addHistoryPoint: () => {
    const totalLoad = get().getTotalConsumption();
    const time = new Date().toLocaleTimeString('ru-RU');

    set(state => ({
      // Изменяем количество хранимых точек на 60
      history: [...state.history, { time, load: totalLoad }].slice(-60)
    }));
  },
}));
