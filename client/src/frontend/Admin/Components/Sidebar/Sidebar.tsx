import { useState, useEffect } from "react";
import styles from "./Sidebar.module.css";
import { useNavigate } from 'react-router-dom';
import { useAdminContext } from '../../../../context/adminContext/adminContext';
import { useAuth } from '../../../../context/authContext/authContext';

interface SidebarProps {
  onLogout?: () => void;
  currentView: string;
}

export default function Sidebar({ onLogout, currentView }: SidebarProps) {
  const navigate = useNavigate();
  const { adminBranding, fetchAdminBranding } = useAdminContext();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchAdminBranding(user?.token);
  }, [user?.token]);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  const handleNavClick = (e: React.MouseEvent, view: string) => {
    e.preventDefault();
    setIsOpen(false);
    navigate(`/admin/${view}`);
  };

  return (
    <>
      {/* Floating Hamburger Toggle Button on Mobile (only shown when closed) */}
      {!isOpen && (
        <button 
          className={styles.mobileToggleBtn} 
          onClick={() => setIsOpen(true)}
          aria-label="Open Navigation Drawer"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      )}

      {/* Backdrop overlay to close sidebar on mobile */}
      {isOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setIsOpen(false)} />
      )}

      <aside id="sidebar" className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarBrand}>
            <img
              src={adminBranding?.logo || undefined}
              alt="KSRCE Logo"
              className={styles.sidebarLogo}
            />
            <span className={styles.sidebarTitle}>
              Alumni Portal
            </span>
          </div>

          {/* Close button inside drawer for mobile */}
          <button
            type="button"
            className={styles.mobileCloseBtn}
            onClick={() => setIsOpen(false)}
            aria-label="Close Navigation Drawer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          <a
            className={`${styles.navLink} ${currentView === 'dashboard' ? styles.navLinkActive : ''} ${styles.dashboardLink}`}
            href="#"
            onClick={(e) => handleNavClick(e, 'dashboard')}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className={styles.navLinkText}>
              Dashboard
            </span>
          </a>
          <a
            className={`${styles.navLink} ${currentView === 'mail' ? styles.navLinkActive : ''}`}
            onClick={(e) => handleNavClick(e, 'mail')}
          >
            <span className="material-symbols-outlined">mail</span>
            <span className={styles.navLinkText}>
              Mail
            </span>
          </a>
          <a 
            className={`${styles.navLink} ${currentView === 'alumini' ? styles.navLinkActive : ''}`}
            onClick={(e) => handleNavClick(e, 'alumini')}
          >
            <span className="material-symbols-outlined">groups</span>
            <span className={styles.navLinkText}>
              Alumni
            </span>
          </a>
          <a
            className={`${styles.navLink} ${currentView === 'department' ? styles.navLinkActive : ''}`}
            onClick={(e) => handleNavClick(e, 'department')}>
            <span className="material-symbols-outlined">apartment</span>
            <span className={styles.navLinkText}>
              Department
            </span>
          </a>
          <a 
            className={`${styles.navLink} ${currentView === 'job_and_reference' ? styles.navLinkActive : ''}`}
            onClick={(e) => handleNavClick(e, 'job_and_reference')}>
            <span className="material-symbols-outlined">work</span>
            <span className={styles.navLinkText}>
              Job &amp; Reference
            </span>
          </a>
          <a 
            className={`${styles.navLink} ${currentView === 'donation_history' ? styles.navLinkActive : ''}`} 
            onClick={(e) => handleNavClick(e, 'donation_history')}>
            <span className="material-symbols-outlined">volunteer_activism</span>
            <span className={styles.navLinkText}>
              Donation
            </span>
          </a>
          <a
            className={`${styles.navLink} ${currentView === 'event_and_reunion_history' ? styles.navLinkActive : ''}`}
            href="#"
            onClick={(e) => handleNavClick(e, 'event_and_reunion_history')}>
            <span className="material-symbols-outlined">event</span>
            <span className={styles.navLinkText}>
              Events &amp; Reunion
            </span>
          </a>
          <a 
            className={`${styles.navLink} ${currentView === 'feedback' ? styles.navLinkActive : ''}`} 
            onClick={(e) => handleNavClick(e, 'feedback')}>
            <span className="material-symbols-outlined">feedback</span>
            <span className={styles.navLinkText}>
              Feedback
            </span>
          </a>
        </nav>

        <div className={styles.sidebarFooter}>
          <a 
            className={`${styles.navLink} ${currentView === 'profile' ? styles.navLinkActive : ''}`} 
            onClick={(e) => handleNavClick(e, 'profile')}>
            <span className="material-symbols-outlined">account_circle</span>
            <span className={styles.navLinkText}>
              Profile
            </span>
          </a>
          <a 
            className={`${styles.navLink} ${styles.logoutLink}`} 
            href="#" 
            onClick={handleLogout}
            style={{ marginTop: '0.5rem' }}
          >
            <span className="material-symbols-outlined">logout</span>
            <span className={styles.navLinkText}>
              Logout
            </span>
          </a>
        </div>
      </aside>
    </>
  );
}