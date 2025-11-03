import { getIo } from '../utils/socket.js';

export const handleAdminSockets = (socket) => {
  console.log(`Admin user connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Admin user disconnected: ${socket.id}`);
  });
};
