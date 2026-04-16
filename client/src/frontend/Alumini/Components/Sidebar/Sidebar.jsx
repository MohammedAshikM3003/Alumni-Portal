import { useState, useEffect } from "react";
import styles from "./Sidebar.module.css";
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL;

export default function Sidebar({ onLogout, currentView }) {
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/branding`);
        const data = await res.json();
        if (data.success && data.data?.logo) {
          setLogoUrl(`${API_BASE}${data.data.logo}`);
        }
      } catch (err) {
        console.error('Failed to fetch branding:', err);
      }
    };
    fetchBranding();
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    if (onLogout) {
      onLogout();
    }
  };


  const handleNavClick = (e, view) => {
    e.preventDefault();
    navigate(`/alumini/${view}`);
  };

  return (
    <aside id="sidebar" className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <img
          src={logoUrl}
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
        <a className={`${styles.navLink} ${currentView === 'job_reference_history' ? styles.navLinkActive : ''}`}

        onClick={() => {navigate('/alumini/JobReference_History')}}>
          <span className="material-symbols-outlined">work</span>
          <span className={styles.navLinkText}>
            Job &amp; Reference
          </span>
        </a>
        <a className={`${styles.navLink} ${currentView === 'donation_history' ? styles.navLinkActive : ''}`} 
        onClick={() => {navigate('/alumini/donation_history')}}>
          <span className="material-symbols-outlined">volunteer_activism</span>
          <span className={styles.navLinkText}>
            Donation
          </span>
        </a>
        <a 
        className={`${styles.navLink} ${currentView === 'event_reunion' ? styles.navLinkActive : ''}`} 
        href="#"
        onClick={(e) => handleNavClick(e, 'event_reunion')}>
          <span className="material-symbols-outlined">event</span>
          <span className={styles.navLinkText}>
            Events &amp; Reunion
          </span>
        </a>
        <a 
        className={`${styles.navLink} ${currentView === 'feedback' ? styles.navLinkActive : ''}`} 
        onClick={() => {navigate('/alumini/feedback')}}>
          <span className="material-symbols-outlined">feedback</span>
          <span className={styles.navLinkText}>
            Feedback
          </span>
        </a>
      </nav>

      <div className={styles.sidebarFooter}>
        <a className={`${styles.navLink} ${currentView === 'profile' ? styles.navLinkActive : ''}`} 
            onClick={() => {navigate('/alumini/profile')}}>
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