import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Dynamic host matching or custom production socket URL
    const customSocketUrl = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '').trim();
    const host = window.location.hostname || 'localhost';
    const socketUrl = customSocketUrl
      ? customSocketUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '')
      : (window.location.port === '5000' 
          ? window.location.origin 
          : `${window.location.protocol}//${host}:5000`);

    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {});

    socketInstance.on('disconnect', () => {});

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error:', err.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
