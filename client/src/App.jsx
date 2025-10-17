import React from 'react';
import AppRouter from './router/AppRouter';
import { AuthProvider } from './contexts/AuthContext.jsx';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
