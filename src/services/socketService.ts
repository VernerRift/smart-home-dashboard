// Финальная, самовосстанавливающаяся версия сервиса
let socket: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8000/ws';

interface SocketCallbacks {
  onOpen: () => void;
  onMessage: (data: any) => void;
  onClose: () => void;
}

function connect(callbacks: SocketCallbacks) {
  // Предотвращаем создание дублирующих соединений
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    return;
  }

  console.log('Attempting to connect to WebSocket...');
  socket = new WebSocket(WEBSOCKET_URL);

  socket.onopen = () => {
    console.log('WebSocket connected');
    // Успешно подключились, отменяем таймер переподключения, если он был
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
    
    // Если уже есть запланированная попытка, не создаем новую
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        connect(callbacks); // Пытаемся подключиться снова
      }, 3000);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    // onerror всегда вызывает onclose, поэтому логика реконнекта сработает автоматически
    socket?.close();
  };
}

function sendToggleCommand(deviceId: string) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const command = {
      action: 'toggle',
      device_id: deviceId,
    };
    socket.send(JSON.stringify(command));
  } else {
    console.error('WebSocket is not connected or ready.');
  }
}

export const socketService = {
  connect,
  sendToggleCommand,
};
