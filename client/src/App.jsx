import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MenuManagement from './pages/MenuManagement'
import AuthPages from './pages/Auth';


function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<AuthPages />} />
          <Route path="/register" element={<AuthPages />} />
          <Route path="/menu" element={<MenuManagement />} />
        </Routes>
      </Router>

    </>
  )
}

export default App
