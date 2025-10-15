import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import MenuManagement from './pages/Admin/MenuManagement'
import Login from './pages/Shared/Login';
import Sidebar from './components/Sidebar';
import AppLayout from './layouts/AppLayout';


function App() {
  return (
    <>
      <Router>
        <Routes>
            <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/menu" element={<MenuManagement />} />
          </Route>
        </Routes>
      </Router>

    </>
  )
}

export default App
