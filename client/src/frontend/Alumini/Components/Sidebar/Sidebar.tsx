import { useState, useEffect } from "react";
import styles from "./Sidebar.module.css";
import { useNavigate } from 'react-router-dom';
import { useAdminContext } from '../../../../context/adminContext/adminContext';
import { useAuth } from '../../../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface SidebarProps {
  onLogout?: () => void;
  currentView?: string;
}

export default function Sidebar({ onLogout, currentView }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { adminBranding, fetchAdminBranding } = useAdminContext();
  const { user } = useAuth();
  const cachedPhoto = typeof window !== 'undefined' ? localStorage.getItem('cached_alumni_photo') : null;
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(cachedPhoto);

  const isDashboard = currentView ? (currentView.toLowerCase().includes('dash') || currentView === 'dashboard') : true;

  useEffect(() => {
    fetchAdminBranding(user?.token);
  }, [user?.token]);

  useEffect(() => {
    if (!isDashboard || !user?.token) return;
    const controller = new AbortController();
    const fetchPhoto = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/alumni/me`, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        if (res.ok && data.success && data.alumni) {
          const photoVal = data.alumni.profilePhoto || data.alumni.profilePhotoId || null;
          if (photoVal) {
            let finalUrl = photoVal;
            if (/^[a-f\d]{24}$/i.test(photoVal)) {
              finalUrl = `${API_BASE}/api/images/${photoVal}`;
            }
            setProfilePhotoUrl(finalUrl);
            localStorage.setItem('cached_alumni_photo', finalUrl);
          }
        }
      } catch (e) {
        // ignore fetch error
      }
    };
    fetchPhoto();
    return () => controller.abort();
  }, [user?.token, isDashboard]);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setIsOpen(false);
    navigate(path);
  };

  const getPageTitle = (view?: string) => {
    if (!view) return 'Dashboard';
    const v = view.toLowerCase();
    if (v.includes('dash')) return 'Dashboard';
    if (v.includes('mail') || v.includes('draft') || v.includes('broadcast')) return 'Mail';
    if (v.includes('job') || v.includes('reference')) return 'Job & Reference';
    if (v.includes('donat')) return 'Donation';
    if (v.includes('event') || v.includes('reunion') || v.includes('invitation')) return 'Events & Reunion';
    if (v.includes('feed')) return 'Feedback';
    if (v.includes('prof')) return 'Profile';
    if (v.includes('alum')) return 'Alumni';
    if (v.includes('dept') || v.includes('depart') || v.includes('facul')) return 'Department';
    return view.charAt(0).toUpperCase() + view.slice(1);
  };

  return (
    <>
      {/* Mobile Navbar Header */}
      <div className={styles.mobileHamburgerBtn}>
        <button 
          className={styles.mobileHeaderLeft}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className={`material-symbols-outlined ${styles.hamburgerIcon}`}>
            {isOpen ? 'close' : 'menu'}
          </span>
          <span className={styles.mobilePageTitle}>
            {getPageTitle(currentView)}
          </span>
        </button>

        {isDashboard && (
          <button 
            className={styles.mobileProfileBtn}
            onClick={(e) => {
              e.stopPropagation();
              navigate('/alumini/profile');
            }}
            aria-label="Go to Profile"
          >
            {profilePhotoUrl ? (
              <img 
                src={profilePhotoUrl} 
                alt="Profile" 
                className={styles.mobileProfileImg}
                onError={() => setProfilePhotoUrl(null)}
              />
            ) : (
              <span className={`material-symbols-outlined ${styles.profileIcon}`}>
                account_circle
              </span>
            )}
          </button>
        )}
      </div>

      {/* Backdrop Overlay for mobile drawer */}
      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)} />
      )}

      <aside id="sidebar" className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <img
            src={adminBranding.logo || undefined}
            alt="KSRCE Logo"
            className={styles.sidebarLogo}
          />
          <span className={styles.sidebarTitle}>
            <span className={styles.fullTitle}>Alumni Portal</span>
            <span className={styles.mobileTitle}>KSRCE</span>
          </span>
          <button 
            className={styles.mobileCloseBtn}
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          <a 
            className={`${styles.navLink} ${currentView === 'dashboard' ? styles.navLinkActive : ''} ${styles.dashboardLink}`} 
            href="#"
            onClick={(e) => handleNavClick(e, '/alumini/dashboard')}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className={styles.navLinkText}>Dashboard</span>
          </a>
          <a 
            className={`${styles.navLink} ${currentView === 'mail' ? styles.navLinkActive : ''}`}
            href="#"
            onClick={(e) => handleNavClick(e, '/alumini/mail')}
          >
            <span className="material-symbols-outlined">mail</span>
            <span className={styles.navLinkText}>Mail</span>
          </a>
          <a 
            className={`${styles.navLink} ${currentView === 'job_reference_history' ? styles.navLinkActive : ''}`}
            href="#"
            onClick={(e) => handleNavClick(e, '/alumini/JobReference_History')}
          >
            <span className="material-symbols-outlined">work</span>
            <span className={styles.navLinkText}>Job &amp; Reference</span>
          </a>
          <a 
            className={`${styles.navLink} ${currentView === 'donation_history' ? styles.navLinkActive : ''}`} 
            href="#"
            onClick={(e) => handleNavClick(e, '/alumini/donation_history')}
          >
            <span className="material-symbols-outlined">volunteer_activism</span>
            <span className={styles.navLinkText}>Donation</span>
          </a>
          <a 
            className={`${styles.navLink} ${currentView === 'event_reunion' ? styles.navLinkActive : ''}`} 
            href="#"
            onClick={(e) => handleNavClick(e, '/alumini/event_reunion')}
          >
            <span className="material-symbols-outlined">event</span>
            <span className={styles.navLinkText}>Events &amp; Reunion</span>
          </a>
          <a 
            className={`${styles.navLink} ${currentView === 'feedback' ? styles.navLinkActive : ''}`} 
            href="#"
            onClick={(e) => handleNavClick(e, '/alumini/feedback')}
          >
            <span className="material-symbols-outlined">feedback</span>
            <span className={styles.navLinkText}>Feedback</span>
          </a>
        </nav>

        <div className={styles.sidebarFooter}>
          <a 
            className={`${styles.navLink} ${currentView === 'profile' ? styles.navLinkActive : ''}`} 
            href="#"
            onClick={(e) => handleNavClick(e, '/alumini/profile')}
          >
            <span className="material-symbols-outlined">account_circle</span>
            <span className={styles.navLinkText}>Profile</span>
          </a>
          <a 
            className={`${styles.navLink} ${styles.logoutLink}`} 
            href="#" 
            onClick={handleLogout}
            style={{ marginTop: '0.5rem' }}
          >
            <span className="material-symbols-outlined">logout</span>
            <span className={styles.navLinkText}>Logout</span>
          </a>
        </div>
      </aside>
    </>
  );
}