import { getIo } from '../utils/socket.js';

export const handleWaiterSockets = (socket) => {
  console.log(`Waiter user connected: ${socket.id}`);

  // Join a room for the specific waiter
  if (socket.handshake.query.userId) {
    socket.join(socket.handshake.query.userId);
    console.log(`Waiter ${socket.id} joined room ${socket.handshake.query.userId}`);
  }

  socket.on('disconnect', () => {
    console.log(`Waiter user disconnected: ${socket.id}`);
  });
};
