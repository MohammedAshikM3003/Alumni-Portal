import { Link } from 'react-router-dom';
import styles from './NavBar.module.css';
import ksrLogo from '../../../../assets/KSR_College_Logo.svg';

export default function NavBar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <img src={ksrLogo} alt="KSRCE Logo" className={styles.logo} />
          <span className={styles.brandName}>
            KSRCE <span className={styles.brandHighlight}>ALUMNI</span>
          </span>
        </div>

        {/* Navigation Links */}
        <div className={styles.navLinks}>
          <Link to="/" className={styles.navLink}>HOME</Link>
          <Link to="/network" className={styles.navLink}>NETWORK</Link>
          <Link to="/events" className={styles.navLink}>EVENTS</Link>
          <Link to="/success" className={styles.navLink}>SUCCESS</Link>
        </div>
      </div>
    </nav>
  );
}
