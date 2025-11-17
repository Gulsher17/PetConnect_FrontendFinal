// src/hooks/useSocket.ts
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { SocketEvents, WelcomeData } from '../types/socket.types';
import { useAuth } from '../features/auth/useAuth';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket<SocketEvents, SocketEvents> | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket<SocketEvents, SocketEvents> | null>(null);

  // Get token from your auth context
  const { token } = useAuth();
  useEffect(() => {
    if (!token) {
      console.log(' Waiting for authentication token...');
      if (socketRef.current) {
        socketRef.current.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    console.log(' Using token from auth context for WebSocket connection');
    
    const socketInstance: Socket<SocketEvents, SocketEvents> = io('http://localhost:5001', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socketInstance;

    // Type-safe event listeners
    socketInstance.on('connect', () => {
      console.log(' Connected to WebSocket server');
      setConnected(true);
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', () => {
      console.log(' Disconnected from WebSocket server');
      setConnected(false);
    });

    socketInstance.on('connect_error', (error: Error) => {
      console.error('Connection error:', error.message);
    });

    socketInstance.on('welcome', (data: WelcomeData) => {
      console.log(' Welcome message:', data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return { socket, connected };
};