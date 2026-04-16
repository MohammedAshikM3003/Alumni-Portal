import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './NavBar.module.css';

const API_BASE = import.meta.env.VITE_API_URL;

export default function NavBar( { isLanding } ) {
  const navigate = useNavigate();
  const location = useLocation();
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

  const handlenavlinks = (sectionId) => {
    // If we're already on the landing page, scroll to the section
    if (location.pathname === '/landing') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Navigate to landing page and then scroll
      navigate('/landing');
      // Use setTimeout to ensure the page has loaded before scrolling
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }


  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <img src={logoUrl} className={styles.logo} />
          <span className={styles.brandName}>
            KSRCE <span className={styles.brandHighlight}>ALUMNI</span>
          </span>
        </div>

        {/* Navigation Links */}
        <div className={styles.navLinks}>
          <a className={styles.navLink} onClick={() => { handlenavlinks('home') }} >HOME</a>
          <a className={styles.navLink} onClick={() => { handlenavlinks('network') }} >NETWORK</a>
          <a className={styles.navLink} onClick={() => { handlenavlinks('events') }} >EVENTS</a>
          <a className={styles.navLink} onClick={() => { handlenavlinks('stories') }} >SUCCESS</a>
          { isLanding && <button className={styles.navButton} onClick={() => { navigate('/login') }} >JOIN US</button> }          
        </div>
      </div>
    </nav>
  );
}
            