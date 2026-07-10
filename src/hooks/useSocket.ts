import { useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io(process.env.backapi + "/api"); 

export const useSocket = (onNewOrder: (data: any) => void) => {
  useEffect(() => {
    socket.on('newOrder', (notification) => {
      onNewOrder(notification);
    });

    return () => {
      socket.off('newOrder');
    };
  }, [onNewOrder]);
};