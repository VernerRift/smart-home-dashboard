import { create } from 'zustand';

// --- Переменные для управления соединением, вынесены за пределы стора ---
let socket: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8000/ws';

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
  
  // Методы
  connect: () => void; // <-- Метод для инициализации соединения
  toggleDevice: (id: string) => void; // <-- Метод для UI, теперь с отправкой команды
  setDevicesState: (backendDevices: Partial<Device>[]) => void;
  addHistoryPoint: () => void;
  getTotalConsumption: () => number;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  devices: [
    { id: 'boiler', name: 'Газовый котел Bosch Gaz 3000 W', isOn: true, powerDrawW: 120, isCritical: true, iconName: 'Flame' },
    { id: 'pumps', name: 'Циркуляционные насосы', isOn: true, powerDrawW: 90, isCritical: true, iconName: 'Activity' },
    { id: 'fridge', name: 'Холодильники', isOn: false, powerDrawW: 300, isCritical: false, iconName: 'Refrigerator' },
    { id: 'inverter', name: 'Резервный инвертор', isOn: true, powerDrawW: 25, isCritical: true, iconName: 'Zap' },
    { id: 'living_room', name: 'Гостиная', isOn: true, powerDrawW: 60, isCritical: false, iconName: 'Lamp' },
    { id: 'bedroom', name: 'Спальня', isOn: false, powerDrawW: 40, isCritical: false, iconName: 'Bed' },
  ],
  pendingDevices: [],
  history: [],
  isConnected: false,

  // --- Шаг 1.1: Метод для подключения с логикой реконнекта ---
  connect: () => {
    if (socket) return; // Если сокет уже есть, ничего не делаем

    console.log("Попытка подключения к WebSocket...");
    socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => {
      console.log("WebSocket подключен.");
      set({ isConnected: true });
      // Если было запланировано переподключение, отменяем его
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        get().setDevicesState(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log("Соединение потеряно. Переподключение через 3 секунды...");
      set({ isConnected: false });
      socket = null; // Важно обнулить сокет
      
      // Очищаем старый таймер (на всякий случай) и ставим новый
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => get().connect(), 3000);
    };

    socket.onerror = (error) => {
      console.error("WebSocket ошибка:", error);
      socket?.close(); // Это вызовет onclose и запустит логику переподключения
    };
  },

  // --- Шаг 1.2: Метод toggleDevice теперь снова отвечает за отправку ---
  toggleDevice: (id: string) => {
    // Оптимистичное обновление
    set(state => ({
      pendingDevices: [...state.pendingDevices, id],
      devices: state.devices.map(device =>
        device.id === id ? { ...device, isOn: !device.isOn } : device
      ),
    }));
    
    // Отправка команды через сокет
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: 'toggle', device_id: id }));
    } else {
      console.error("WebSocket не подключен для отправки команды.");
    }
  },

  setDevicesState: (backendDevices) => set(state => {
    let updatedPending = [...state.pendingDevices];
    const updatedDevices = state.devices.map(frontendDevice => {
      const backendDevice = backendDevices.find(bd => bd.id === frontendDevice.id);
      if (!backendDevice) return frontendDevice;
      const isPending = state.pendingDevices.includes(frontendDevice.id);
      if (isPending) {
        if (backendDevice.isOn === frontendDevice.isOn) {
          updatedPending = updatedPending.filter(pendingId => pendingId !== frontendDevice.id);
          return { ...frontendDevice, ...backendDevice };
        } else {
          return { ...frontendDevice, powerDrawW: backendDevice.powerDrawW };
        }
      } else {
        return { ...frontendDevice, ...backendDevice };
      }
    });
    return { devices: updatedDevices, pendingDevices: updatedPending };
  }),
  
  // ... остальные методы без изменений ...
  getTotalConsumption: () => get().devices.filter(d => d.isOn).reduce((sum, d) => sum + d.powerDrawW, 0),
  addHistoryPoint: () => {
    const totalLoad = get().getTotalConsumption();
    const time = new Date().toLocaleTimeString('ru-RU');
    set(state => ({ history: [...state.history, { time, load: totalLoad }].slice(-60) }));
  },
}));
