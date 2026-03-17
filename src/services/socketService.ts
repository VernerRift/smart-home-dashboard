// Финальная, самовосстанавливающаяся версия сервиса
let socket: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WEBSOCKET_URL = `${protocol}//${window.location.host}/ws`;

interface SocketCallbacks {
  onOpen: () => void;
  onMessage: (data: any) => void;
  onClose: () => void;
}

function connect(callbacks: SocketCallbacks) {
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    return;
  }

  console.log(`Attempting to connect to WebSocket at ${WEBSOCKET_URL}...`);
  socket = new WebSocket(WEBSOCKET_URL);

  socket.onopen = () => {
    console.log('WebSocket connected');
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    callbacks.onOpen();
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      callbacks.onMessage(data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  socket.onclose = () => {
    console.log('WebSocket disconnected. Attempting to reconnect in 3 seconds...');
    callbacks.onClose();
    
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        connect(callbacks);
      }, 3000);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    socket?.close();
  };
}

export const socketService = {
  connect,
  sendToggleCommand: (deviceId: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: 'toggle', device_id: deviceId }));
    }
  },
  sendAddDeviceCommand: () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: 'add_device' }));
    }
  },
  sendUpdateDeviceCommand: (deviceId: string, updates: object) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: 'update_device', device_id: deviceId, updates }));
    }
  },
  sendRemoveDeviceCommand: (deviceId: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: 'remove_device', device_id: deviceId }));
    }
  },
  sendReorderCommand: (deviceIds: string[]) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: 'reorder_devices', device_ids: deviceIds }));
    }
  },
};
