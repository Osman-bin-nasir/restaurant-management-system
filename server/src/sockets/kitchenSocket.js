
import { getIo } from '../utils/socket.js';

export const handleKitchenSockets = (socket) => {
  console.log(`Kitchen user connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Kitchen user disconnected: ${socket.id}`);
  });
};
