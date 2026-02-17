import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AluminiDashboard from './frontend/Alumini/Dashboard';
import Mail from './frontend/Alumini/Mail';
import ViewMail from './frontend/Alumini/ViewMail';
import MailForm from './frontend/Alumini/Mail_Form';
import EventsReunion from './frontend/Alumini/Event_Reunion';
import View_Invitation from './frontend/Alumini/View_Invitaion';
import Donation_History from './frontend/Alumini/Donation_History';
import DonationFormPage from './frontend/Alumini/Donation_Form';
import JobReference_History from './frontend/Alumini/JobReference_History';
import JobReference_Form from './frontend/Alumini/JobReference_Form';
import Profile from './frontend/Alumini/Profile';
import LoginGateway from './frontend/Auth/LoginGateway';
import ForgotPassword from './frontend/Auth/ForgotPassword';
import SendOtp from './frontend/Auth/SendOtp';
import UpdatePassword from './frontend/Auth/UpdatePassword';


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
  };

  return (
    <Router>
      <Routes>
{/* Login GateWay Routes */}
        <Route 
          path="/login" 
          element={isLoggedIn ? <Navigate to="/alumini/dashboard" /> : <LoginGateway onLogin={handleLogin} />} />
        <Route 
          path="/forgot-password" 
          element={isLoggedIn ? <Navigate to="/alumini/dashboard" /> : <ForgotPassword onLogin={handleLogin} />} />
        <Route 
          path="/send-otp" 
          element={isLoggedIn ? <Navigate to="/alumini/dashboard" /> : <SendOtp onLogin={handleLogin} />} />
        <Route 
          path="/update-password" 
          element={isLoggedIn ? <Navigate to="/alumini/dashboard" /> : <UpdatePassword onLogin={handleLogin} />} />
{/* Alumini DashBoard Routes */}
        <Route
          path="/alumini/dashboard"
          element={isLoggedIn ? <AluminiDashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
{/* Alumini Mail */}
        <Route
          path="/alumini/mail"
          element={isLoggedIn ? <Mail onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/alumini/mail/viewmail"
          element={isLoggedIn ? <ViewMail onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/alumini/mail/viewmail/acceptmail"
          element={isLoggedIn ? <MailForm onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
{/* Alumini Events and Reunion */}
        <Route
          path="/alumini/event_reunion"
          element={isLoggedIn ? <EventsReunion onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/alumini/event_reunion/view_invitation"
          element={isLoggedIn ? <View_Invitation onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
{/* Alumini Donation History and Form */}
        <Route
          path="/alumini/donation_history"
          element={isLoggedIn ? <Donation_History onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/alumini/donation_history/donation_form"
          element={isLoggedIn ? <DonationFormPage onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
{/* Alumini Job Reference History and Form */}
        <Route
          path="/alumini/JobReference_History"
          element={isLoggedIn ? <JobReference_History onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/alumini/JobReference_History/JobReference_Form"
          element={isLoggedIn ? <JobReference_Form onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
{/* Alumini Profile */}
        <Route
          path="/alumini/profile"
          element={isLoggedIn ? <Profile onLogout={handleLogout} /> : <Navigate to="/login" />}
        />




{/* Master Route for Unknown EndPoint */}
        <Route path="*" element={<Navigate to={isLoggedIn ? "/alumini/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  )
}

export default App