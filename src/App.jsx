import { useState } from 'react'
import './App.css'
import LoginGateway from './frontend/Alumini/Auth/LoginGateway.jsx'
import Dashboard from './frontend/Alumini/DashBoard/Dashboard.jsx'
import Mail from './frontend/Alumini/DashBoard/Mail.jsx'
import ViewMail from './frontend/Alumini/DashBoard/ViewMail.jsx'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <Routes>
        <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" /> : <LoginGateway onLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={isLoggedIn ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/mail"
          element={isLoggedIn ? <Mail onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/mail/view"
          element={isLoggedIn ? <ViewMail onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  )
}

export default App