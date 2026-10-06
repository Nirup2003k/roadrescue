import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  const token = localStorage.getItem('rr_token');
  if (!token) return null;

  if (!socket || !socket.connected) {
    // Note: URL can be empty or relative if using Vite proxy or explicitly http://localhost:5000
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    socket = io(socketUrl, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
