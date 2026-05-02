import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import KanbanBoard from './pages/KanbanBoard.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/proposals-manager">
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/todos" element={<KanbanBoard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)