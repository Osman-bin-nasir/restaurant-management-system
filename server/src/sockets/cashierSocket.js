import { getIo } from '../utils/socket.js';

export const handleCashierSockets = (socket) => {
  console.log(`Cashier user connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Cashier user disconnected: ${socket.id}`);
  });
};
