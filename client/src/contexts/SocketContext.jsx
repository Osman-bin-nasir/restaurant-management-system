import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext'; // Import useAuth
import { SOCKET_URL } from '../config/api.js';

const SocketContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth(); // Get user from AuthContext

  useEffect(() => {
    let disposed = false;
    let activeSocket = null;

    if (user) { // Only connect if user is authenticated
      import('socket.io-client').then(({ default: io }) => {
        if (disposed) return;
        activeSocket = io(SOCKET_URL, {
          withCredentials: true,
          query: { userId: user.id },
        });
        setSocket(activeSocket);
      });
    }

    return () => {
      disposed = true;
      activeSocket?.close();
      setSocket(null);
    };
  }, [user]); // Re-connect if user changes

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
