import styles from "./Sidebar.module.css";
import collegeLogo from '../../../../assets/KSR_College_Logo.svg'
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ onLogout, currentView }) {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    if (onLogout) {
      onLogout();
    }
  };


  const handleNavClick = (e, view) => {
    e.preventDefault();
    navigate(`/admin/${view}`);
  };

  return (
    <aside id="sidebar" className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <img 
          src={collegeLogo} 
          alt="KSRCE Logo" 
          className={styles.sidebarLogo}
        />
        <span className={styles.sidebarTitle}>
          Alumni Portal
        </span>
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
        <a className={`${styles.navLink} ${currentView === 'job_and_reference' ? styles.navLinkActive : ''}`}

        onClick={(e) => handleNavClick(e, 'job_and_reference')}>
          <span className="material-symbols-outlined">work</span>
          <span className={styles.navLinkText}>
            Job &amp; Reference
          </span>
        </a>
        <a className={`${styles.navLink} ${currentView === 'donation_history' ? styles.navLinkActive : ''}`} 
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
        <a className={`${styles.navLink} ${currentView === 'profile' ? styles.navLinkActive : ''}`} 
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
  );
}