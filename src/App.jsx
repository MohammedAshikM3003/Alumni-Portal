import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './frontend/Landing_Page/Landing';
import LoginGateway from './frontend/Auth/LoginGateway';
import ForgotPassword from './frontend/Auth/ForgotPassword';
import SendOtp from './frontend/Auth/SendOtp';
import UpdatePassword from './frontend/Auth/UpdatePassword';

// Alumini Imports
import Alumini_Dashboard from './frontend/Alumini/Dashboard';
import Alumini_Mail from './frontend/Alumini/Mail';
import Alumini_ViewMail from './frontend/Alumini/ViewMail';
import Alumini_MailForm from './frontend/Alumini/Accept_Invitation';
import Alumini_EventsReunion from './frontend/Alumini/Event_Reunion';
import Alumini_View_Invitation from './frontend/Alumini/View_Invitaion';
import Alumini_Donation_History from './frontend/Alumini/Donation_History';
import Alumini_DonationFormPage from './frontend/Alumini/Donation_Form';
import Alumini_JobReference_History from './frontend/Alumini/JobReference_History';
import Alumini_Feedback from './frontend/Alumini/Feedback';
import Alumini_JobReference_Form from './frontend/Alumini/JobReference_Form';
import Alumini_Profile from './frontend/Alumini/Profile';

// Admin Imports
import Admin_Mail from './frontend/Admin/AD_Mail';
import Admin_CreateMail from './frontend/Admin/AD_CreateMail';
import Admin_Draft_History from './frontend/Admin/AD_Draft_History';
import Admin_Draft from './frontend/Admin/AD_Draft';
import Admin_Job_and_Reference from './frontend/Admin/AD_Job_and_Reference';
import Admin_View_Job_and_Reference from './frontend/Admin/AD_View_Job_and_Reference';
import Admin_Donation_History from './frontend/Admin/AD_Donation_History';
import Admin_View_Donation from './frontend/Admin/AD_View_Donation';
import Admin_Event_and_Reunion_History from './frontend/Admin/AD_Event_and_Reunion_History';
import Admin_Event_and_Reunion_Invitation from './frontend/Admin/AD_Event_and_Reunion_Invitation';
import Admin_Event_and_Reunion_Form1 from './frontend/Admin/AD_Event_and_Reunion_Form1';
import Admin_Event_and_Reunion_Form2 from './frontend/Admin/AD_Event_and_Reunion_Form2';
import Admin_Feedback from './frontend/Admin/AD_Feedback';
import Admin_Feedback_Form from './frontend/Admin/AD_Feedback_Form';
import Admin_Alumini from './frontend/Admin/AD_Alumini';
import Admin_Alumini_Form from './frontend/Admin/AD_Alumini_Form';
import Admin_Dashboard from './frontend/Admin/AD_Dashboard';
import Admin_ViewMail from './frontend/Admin/AD_ViewMail';
import Admin_Profile from './frontend/Admin/AD_Profile';

// Co-Oridinator Imports
import Coordinator_Dashboard from './frontend/Coordinator/Co_Dashboard';
import Coordinator_Mail from './frontend/Coordinator/Co_Mail';
import CoordinatorInformationForm from './frontend/Coordinator/Co_InformationForm';
import CoordinatorJobHistory from './frontend/Coordinator/Co_JobHistory';
import CoordinatorViewJobForm from './frontend/Coordinator/Co_View_JobForm';
import CoordinatorDonationHistory from './frontend/Coordinator/Co_Donation_History';
import CoordinatorViewDonation from './frontend/Coordinator/Co_View_Donation';
import CoordinatorInvitations from './frontend/Coordinator/Co_Invitations';
import CoordinatorViewInvitation from './frontend/Coordinator/Co_View_Invitation';
import CoordinatorFeedbackHistory from './frontend/Coordinator/Co_Feedback'
import CoordinatorFeedbackForm from './frontend/Coordinator/Co_Feedback_Form'
import CoordinatorProfile from './frontend/Coordinator/Co_Profile'
import PageTitleManager from './components/PageTitleManager';

function App() {
  const getPostLoginPath = () => {
    return localStorage.getItem('postLoginPath') || '/alumini/dashboard';
  };

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  const handleLogin = (targetPath = '/alumini/dashboard') => {
    localStorage.setItem('postLoginPath', targetPath);
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('postLoginPath');
  };

  return (
    <Router>
      <PageTitleManager />
      <Routes>
{/* Landing Page Routes */}
        <Route 
          path="/landing" 
          element={<LandingPage />} />

{/* Login GateWay Routes */}
        <Route 
          path="/login" 
          element={isLoggedIn ? <Navigate to={getPostLoginPath()} replace /> : <LoginGateway onLogin={handleLogin} />} />
        <Route 
          path="/forgot-password" 
          element={isLoggedIn ? <Navigate to={getPostLoginPath()} replace /> : <ForgotPassword onLogin={handleLogin} />} />
        <Route 
          path="/send-otp" 
          element={isLoggedIn ? <Navigate to={getPostLoginPath()} replace /> : <SendOtp onLogin={handleLogin} />} />
        <Route 
          path="/update-password" 
          element={isLoggedIn ? <Navigate to={getPostLoginPath()} replace /> : <UpdatePassword onLogin={handleLogin} />} />


{/* Alumini Routes */}
{/* Alumini DashBoard Routes */}
        <Route
          path="/alumini/dashboard"
          element={isLoggedIn ? <Alumini_Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

{/* Alumini Mail */}
        <Route
          path="/alumini/mail"
          element={isLoggedIn ? <Alumini_Mail onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/alumini/mail/viewmail"
          element={isLoggedIn ? <Alumini_ViewMail onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/alumini/mail/viewmail/acceptmail"
          element={isLoggedIn ? <Alumini_MailForm onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

{/* Alumini Events and Reunion */}
        <Route
          path="/alumini/event_reunion"
          element={isLoggedIn ? <Alumini_EventsReunion onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/alumini/event_reunion/view_invitation"
          element={isLoggedIn ? <Alumini_View_Invitation onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

{/* Alumini Donation History and Form */}
        <Route
          path="/alumini/donation_history"
          element={isLoggedIn ? <Alumini_Donation_History onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/alumini/donation_history/donation_form"
          element={isLoggedIn ? <Alumini_DonationFormPage onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

{/* Alumini Job Reference History and Form */}
        <Route
          path="/alumini/JobReference_History"
          element={isLoggedIn ? <Alumini_JobReference_History onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/alumini/JobReference_History/JobReference_Form"
          element={isLoggedIn ? <Alumini_JobReference_Form onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

{/* Alumini Feedback */}
        <Route
          path="/alumini/feedback"
          element={isLoggedIn ? <Alumini_Feedback onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

{/* Alumini Profile */}
        <Route
          path="/alumini/profile"
          element={isLoggedIn ? <Alumini_Profile onLogout={handleLogout} /> : <Navigate to="/login" />}
        />


{/* Admin Routes */}
{/* Admin Dashboard Route */}
        <Route
          path="/admin/dashboard"
          element={isLoggedIn ? <Admin_Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

{/* Admin Mail Routes */}
        <Route
          path="/admin/mail"
          element={isLoggedIn ? <Admin_Mail onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin/mail/create_mail"
          element={isLoggedIn ? <Admin_CreateMail onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin/mail/view_mail"
          element={isLoggedIn ? <Admin_ViewMail onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin/mail/draft_history"
          element={isLoggedIn ? <Admin_Draft_History onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin/mail/draft"
          element={isLoggedIn ? <Admin_Draft onLogout={handleLogout} /> : <Navigate to="/login" />}
        />


{/* Admin Job and Reference Routes */}
        <Route
          path="/admin/job_and_reference"
          element={isLoggedIn ? <Admin_Job_and_Reference onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
        <Route
          path="/admin/view_job_and_reference"
          element={isLoggedIn ? <Admin_View_Job_and_Reference onLogout={handleLogout} /> : <Navigate to="/login" />}
          />


{/* Admin Donation Routes */}
        <Route
          path="/admin/donation_history"
          element={isLoggedIn ? <Admin_Donation_History onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
        <Route
          path="/admin/view_donation"
          element={isLoggedIn ? <Admin_View_Donation onLogout={handleLogout} /> : <Navigate to="/login" />}
          />

{/* Admin Event and Reunion Routes */}
        <Route
          path="/admin/event_and_reunion_history"
          element={isLoggedIn ? <Admin_Event_and_Reunion_History onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
        <Route
          path="/admin/event_and_reunion_invitation"
          element={isLoggedIn ? <Admin_Event_and_Reunion_Invitation onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
        <Route
          path="/admin/event_and_reunion_form1"
          element={isLoggedIn ? <Admin_Event_and_Reunion_Form1 onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
        <Route
          path="/admin/event_and_reunion_form2"
          element={isLoggedIn ? <Admin_Event_and_Reunion_Form2 onLogout={handleLogout} /> : <Navigate to="/login" />}
          />

{/* Admin Feedback Routes */}
        <Route
          path="/admin/feedback"
          element={isLoggedIn ? <Admin_Feedback onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin/feedback_form"
          element={isLoggedIn ? <Admin_Feedback_Form onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

{/* Admin Alumini Routes */}
        <Route
          path="/admin/alumini"
          element={isLoggedIn ? <Admin_Alumini onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin/alumini_form"
          element={isLoggedIn ? <Admin_Alumini_Form onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

{/* Admin Alumini Routes */}
        <Route
          path="/admin/profile"
          element={isLoggedIn ? <Admin_Profile onLogout={handleLogout} /> : <Navigate to="/login" />}
        />





{/* Co-Oridinator Routes */}
{/* Co-Oridinator Dashboard Route */}
        <Route
          path="/coordinator/dashboard"
          element={isLoggedIn ? <Coordinator_Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

{/* Co-Oridinator Mail Routes */}
        <Route
          path="/coordinator/mail"
          element={isLoggedIn ? <Coordinator_Mail onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/coordinator/info-form"
          element={isLoggedIn ? <CoordinatorInformationForm onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

{/* Co-Oridinator Job And Reference Routes */}
        <Route
          path="/coordinator/job_and_reference"
          element={isLoggedIn ? <CoordinatorJobHistory onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/coordinator/View_job_and_reference"
          element={isLoggedIn ? <CoordinatorViewJobForm onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

{/* Co-Oridinator Donation Routes */}
        <Route
          path="/coordinator/donation_history"
          element={isLoggedIn ? <CoordinatorDonationHistory onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/coordinator/View_donation"
          element={isLoggedIn ? <CoordinatorViewDonation onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

{/* Co-Oridinator Invitations Routes */}
        <Route
          path="/coordinator/invitations"
          element={isLoggedIn ? <CoordinatorInvitations onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/coordinator/view_invitations"
          element={isLoggedIn ? <CoordinatorViewInvitation onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

{/* Co-Oridinator Feedback Routes */}
        <Route
          path="/coordinator/feedback_history"
          element={isLoggedIn ? <CoordinatorFeedbackHistory onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/coordinator/view_feedback"
          element={isLoggedIn ? <CoordinatorFeedbackForm onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

{/* Co-Oridinator Feedback Routes */}
        <Route
          path="/coordinator/profile"
          element={isLoggedIn ? <CoordinatorProfile onLogout={handleLogout} /> : <Navigate to="/login" />}
        />


{/* Common Route */}
        <Route path='*' element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}

export default App