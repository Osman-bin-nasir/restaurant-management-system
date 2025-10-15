import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MenuManagement from './pages/Admin/MenuManagement'
import AuthPages from './pages/Auth';


function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/menu" element={<MenuManagement />} />
        </Routes>
      </Router>

        </>
    )
}

export default App
