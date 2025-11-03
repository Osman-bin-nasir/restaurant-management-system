import { getIo } from '../utils/socket.js';

export const handleWaiterSockets = (socket) => {
  console.log(`Waiter user connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Waiter user disconnected: ${socket.id}`);
  });
};
