import { Server } from 'socket.io';
import http from 'http';
import { handleKitchenSockets } from '../sockets/kitchenSocket.js';
import { handleAdminSockets } from '../sockets/adminSocket.js';
import { handleWaiterSockets } from '../sockets/waiterSocket.js';
import { handleCashierSockets } from '../sockets/cashierSocket.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    handleKitchenSockets(socket);
    handleAdminSockets(socket);
    handleWaiterSockets(socket);
    handleCashierSockets(socket);

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
