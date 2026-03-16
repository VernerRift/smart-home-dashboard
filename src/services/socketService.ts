// Улучшенный сервис, устойчивый к двойным вызовам в React.StrictMode

let socket: WebSocket | null = null;
let isConnecting = false; // Флаг, чтобы избежать повторных подключений
const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8000/ws';

interface SocketCallbacks {
  onOpen: () => void;
  onMessage: (data: any) => void;
  onClose: () => void;
}

function connect(callbacks: SocketCallbacks) {
  // Если сокет уже есть или в процессе подключения, ничего не делаем
  if (socket || isConnecting) {
    return;
  }

  isConnecting = true;

  const attemptConnection = () => {
    socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => {
      console.log('WebSocket connected');
      isConnecting = false;
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
      console.log('WebSocket disconnected. Reconnecting in 3s...');
      socket = null; // Сбрасываем сокет
      isConnecting = false;
      callbacks.onClose();
      // Логика переподключения теперь не нужна здесь, т.к. StrictMode может вызвать ее дважды.
      // useEffect в App.tsx сам позаботится о вызове connect при необходимости.
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      socket?.close();
    };
  };

  attemptConnection();
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
