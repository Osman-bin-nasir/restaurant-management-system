import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext'; // Import useAuth
import { SOCKET_URL } from '../config/api.js';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth(); // Get user from AuthContext

  useEffect(() => {
    if (user) { // Only connect if user is authenticated
      const newSocket = io(SOCKET_URL, {
        withCredentials: true,
        query: { userId: user.id }, // Pass userId in query
      });
      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [user]); // Re-connect if user changes

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
