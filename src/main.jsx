import React from 'react'
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import KanbanBoard from './pages/KanbanBoard.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/todos" element={<KanbanBoard />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
)