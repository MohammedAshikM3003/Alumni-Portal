import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/authContext/authContext';
import LandingPage from './frontend/Landing_Page/Landing';
import LoginGateway from './frontend/Auth/LoginGateway';
import ForgotPassword from './frontend/Auth/ForgotPassword';
import SendOtp from './frontend/Auth/SendOtp';
import UpdatePassword from './frontend/Auth/UpdatePassword';

// Alumini Imports
import Alumini_Dashboard from './frontend/Alumini/Al_Dashboard';
import Alumini_Mail from './frontend/Alumini/Al_Mail';
import Alumini_ViewMail from './frontend/Alumini/Al_ViewMail';
import Alumini_MailForm from './frontend/Alumini/Al_Accept_Invitation';
import Alumini_EventsReunion from './frontend/Alumini/Al_Event_Reunion';
import Alumini_View_Invitation from './frontend/Alumini/Al_View_Invitaion';
import Alumini_Donation_History from './frontend/Alumini/Al_Donation_History';
import Alumini_DonationFormPage from './frontend/Alumini/Al_Donation_Form';
import Alumini_JobReference_History from './frontend/Alumini/Al_JobReference_History';
import Alumini_Feedback from './frontend/Alumini/Al_Feedback';
import Alumini_JobReference_Form from './frontend/Alumini/Al_JobReference_Form';
import Alumini_Profile from './frontend/Alumini/Al_Profile';

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
import Admin_Department from './frontend/Admin/AD_Department';
import Admin_View_Department from './frontend/Admin/AD_View_Department';
import Admin_View_Faculty from './frontend/Admin/AD_View_Faculty';
import Admin_Add_Faculty from './frontend/Admin/AD_Add_Faculty';
import Admin_Edit_Faculty from './frontend/Admin/AD_Edit_Faculty';

function App() {
  const { user, isLoggedIn, logout, loading } = useAuth();

  if (loading) return null;

  const role = user?.role;

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'coordinator') return '/coordinator/dashboard';
    return '/alumini/dashboard';
  };

  const guard = (allowedRole, component) => {
    if (!isLoggedIn) return <Navigate to="/login" />;
    if (role !== allowedRole) return <Navigate to={getDashboardPath()} replace />;
    return component;
  };

  return (
    <Router>
      <PageTitleManager />
      <Routes>
{/* Landing Page Routes */}
        <Route 
          path="/" 
          element={<LandingPage />} />
        <Route 
          path="/landing" 
          element={<LandingPage />} />

{/* Login GateWay Routes */}
        <Route 
          path="/login" 
          element={isLoggedIn ? <Navigate to={getDashboardPath()} replace /> : <LoginGateway />} />
        <Route 
          path="/forgot-password" 
          element={isLoggedIn ? <Navigate to={getDashboardPath()} replace /> : <ForgotPassword />} />
        <Route 
          path="/send-otp" 
          element={isLoggedIn ? <Navigate to={getDashboardPath()} replace /> : <SendOtp />} />
        <Route 
          path="/update-password" 
          element={isLoggedIn ? <Navigate to={getDashboardPath()} replace /> : <UpdatePassword />} />


{/* Alumini Routes */}
{/* Alumini DashBoard Routes */}
        <Route
          path="/alumini/dashboard"
          element={guard('alumni', <Alumini_Dashboard onLogout={logout} />)}
        />

{/* Alumini Mail */}
        <Route
          path="/alumini/mail"
          element={guard('alumni', <Alumini_Mail onLogout={logout} />)}
        />
        <Route
          path="/alumini/mail/viewmail"
          element={guard('alumni', <Alumini_ViewMail onLogout={logout} />)}
        />
        <Route
          path="/alumini/mail/viewmail/acceptmail"
          element={guard('alumni', <Alumini_MailForm onLogout={logout} />)}
        />

{/* Alumini Events and Reunion */}
        <Route
          path="/alumini/event_reunion"
          element={guard('alumni', <Alumini_EventsReunion onLogout={logout} />)}
        />
        <Route
          path="/alumini/event_reunion/view_invitation"
          element={guard('alumni', <Alumini_View_Invitation onLogout={logout} />)}
        />

{/* Alumini Donation History and Form */}
        <Route
          path="/alumini/donation_history"
          element={guard('alumni', <Alumini_Donation_History onLogout={logout} />)}
        />
        <Route
          path="/alumini/donation_history/donation_form"
          element={guard('alumni', <Alumini_DonationFormPage onLogout={logout} />)}
        />

{/* Alumini Job Reference History and Form */}
        <Route
          path="/alumini/JobReference_History"
          element={guard('alumni', <Alumini_JobReference_History onLogout={logout} />)}
        />
        <Route
          path="/alumini/JobReference_History/JobReference_Form"
          element={guard('alumni', <Alumini_JobReference_Form onLogout={logout} />)}
        />

{/* Alumini Feedback */}
        <Route
          path="/alumini/feedback"
          element={guard('alumni', <Alumini_Feedback onLogout={logout} />)}
        />

{/* Alumini Profile */}
        <Route
          path="/alumini/profile"
          element={guard('alumni', <Alumini_Profile onLogout={logout} />)}
        />


{/* Admin Routes */}
{/* Admin Dashboard Route */}
        <Route
          path="/admin/dashboard"
          element={guard('admin', <Admin_Dashboard onLogout={logout} />)}
        />

{/* Admin Mail Routes */}
        <Route
          path="/admin/mail"
          element={guard('admin', <Admin_Mail onLogout={logout} />)}
        />
        <Route
          path="/admin/mail/create_mail"
          element={guard('admin', <Admin_CreateMail onLogout={logout} />)}
        />
        <Route
          path="/admin/mail/view_mail"
          element={guard('admin', <Admin_ViewMail onLogout={logout} />)}
        />
        <Route
          path="/admin/mail/draft_history"
          element={guard('admin', <Admin_Draft_History onLogout={logout} />)}
        />
        <Route
          path="/admin/mail/draft"
          element={guard('admin', <Admin_Draft onLogout={logout} />)}
        />

{/* Admin Alumini Routes */}
        <Route
          path="/admin/alumini"
          element={guard('admin', <Admin_Alumini onLogout={logout} />)}
        />
        <Route
          path="/admin/alumini_form"
          element={guard('admin', <Admin_Alumini_Form onLogout={logout} />)}
        />

{/* Admin Department Route */}
        <Route
          path="/admin/department"
          element={guard('admin', <Admin_Department onLogout={logout} />)}
        />
        <Route
          path="/admin/department/view_department"
          element={guard('admin', <Admin_View_Department onLogout={logout} />)}
        />
        <Route
          path="/admin/department/add_faculty"
          element={guard('admin', <Admin_Add_Faculty onLogout={logout} />)}
        />
        <Route
          path="/admin/department/view_faculty"
          element={guard('admin', <Admin_View_Faculty onLogout={logout} />)}
        />
        <Route
          path="/admin/department/edit_faculty"
          element={guard('admin', <Admin_Edit_Faculty onLogout={logout} />)}
        />



{/* Admin Job and Reference Routes */}
        <Route
          path="/admin/job_and_reference"
          element={guard('admin', <Admin_Job_and_Reference onLogout={logout} />)}
          />
        <Route
          path="/admin/view_job_and_reference"
          element={guard('admin', <Admin_View_Job_and_Reference onLogout={logout} />)}
          />


{/* Admin Donation Routes */}
        <Route
          path="/admin/donation_history"
          element={guard('admin', <Admin_Donation_History onLogout={logout} />)}
          />
        <Route
          path="/admin/view_donation"
          element={guard('admin', <Admin_View_Donation onLogout={logout} />)}
          />

{/* Admin Event and Reunion Routes */}
        <Route
          path="/admin/event_and_reunion_history"
          element={guard('admin', <Admin_Event_and_Reunion_History onLogout={logout} />)}
          />
        <Route
          path="/admin/event_and_reunion_invitation"
          element={guard('admin', <Admin_Event_and_Reunion_Invitation onLogout={logout} />)}
          />
        <Route
          path="/admin/event_and_reunion_form1"
          element={guard('admin', <Admin_Event_and_Reunion_Form1 onLogout={logout} />)}
          />
        <Route
          path="/admin/event_and_reunion_form2"
          element={guard('admin', <Admin_Event_and_Reunion_Form2 onLogout={logout} />)}
          />

{/* Admin Feedback Routes */}
        <Route
          path="/admin/feedback"
          element={guard('admin', <Admin_Feedback onLogout={logout} />)}
        />
        <Route
          path="/admin/feedback_form"
          element={guard('admin', <Admin_Feedback_Form onLogout={logout} />)}
        />

{/* Admin Profile Route */}
        <Route
          path="/admin/profile"
          element={guard('admin', <Admin_Profile onLogout={logout} />)}
        />


{/* Co-Oridinator Routes */}
{/* Co-Oridinator Dashboard Route */}
        <Route
          path="/coordinator/dashboard"
          element={guard('coordinator', <Coordinator_Dashboard onLogout={logout} />)}
        />

{/* Co-Oridinator Mail Routes */}
        <Route
          path="/coordinator/mail"
          element={guard('coordinator', <Coordinator_Mail onLogout={logout} />)}
        />
        <Route
          path="/coordinator/info-form"
          element={guard('coordinator', <CoordinatorInformationForm onLogout={logout} />)}
        />

{/* Co-Oridinator Job And Reference Routes */}
        <Route
          path="/coordinator/job_and_reference"
          element={guard('coordinator', <CoordinatorJobHistory onLogout={logout} />)}
        />
        <Route
          path="/coordinator/View_job_and_reference"
          element={guard('coordinator', <CoordinatorViewJobForm onLogout={logout} />)}
        />

{/* Co-Oridinator Donation Routes */}
        <Route
          path="/coordinator/donation_history"
          element={guard('coordinator', <CoordinatorDonationHistory onLogout={logout} />)}
        />
        <Route
          path="/coordinator/View_donation"
          element={guard('coordinator', <CoordinatorViewDonation onLogout={logout} />)}
        />

{/* Co-Oridinator Invitations Routes */}
        <Route
          path="/coordinator/invitations"
          element={guard('coordinator', <CoordinatorInvitations onLogout={logout} />)}
        />
        <Route
          path="/coordinator/view_invitations"
          element={guard('coordinator', <CoordinatorViewInvitation onLogout={logout} />)}
        />

{/* Co-Oridinator Feedback Routes */}
        <Route
          path="/coordinator/feedback_history"
          element={guard('coordinator', <CoordinatorFeedbackHistory onLogout={logout} />)}
        />
        <Route
          path="/coordinator/view_feedback"
          element={guard('coordinator', <CoordinatorFeedbackForm onLogout={logout} />)}
        />

{/* Co-Oridinator Profile Route */}
        <Route
          path="/coordinator/profile"
          element={guard('coordinator', <CoordinatorProfile onLogout={logout} />)}
        />


{/* Common Route */}
        <Route path='*' element={isLoggedIn ? <Navigate to={getDashboardPath()} replace /> : <Navigate to="/login" replace />} />



      </Routes>
    </Router>
  )
}

export default App
