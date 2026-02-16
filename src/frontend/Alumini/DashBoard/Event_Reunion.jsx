import { useState } from 'react';
import styles from './Event_Reunion.module.css';

const EventsReunion = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const emails = [
    {
      id: 1,
      sender: 'Office of Alumni Relations',
      avatarType: 'text',
      avatarText: 'OR',
      avatarClass: styles.avatarBlue,
      subject: 'Invitation: Annual Networking Gala 2024 - Join us for a night of memor...',
      time: '2 hours ago',
    },
    {
      id: 2,
      sender: "Sarah Jenkins (Class of '15)",
      avatarType: 'image',
      avatarSrc: 'https://i.pravatar.cc/150?img=47',
      subject: 'Career Mentorship Inquiry - I saw your profile and was wondering if y...',
      time: 'Yesterday, 4:12 PM',
    },
    {
      id: 3,
      sender: 'Career Services Center',
      avatarType: 'text',
      avatarText: 'CS',
      avatarClass: styles.avatarOrange,
      subject: 'New Job Referrals based on your profile - We found 3 new matches to...',
      time: 'Nov 14, 2023',
    },
  ];

  return (
    <div className={styles.pageContainer}>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className={styles.overlay} onClick={toggleMenu}></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          {/* Desktop Logo */}
          <div className={styles.desktopLogo}>
            <div className={styles.logoIcon}>
              <span className="material-symbols-outlined">school</span>
            </div>
            <div className={styles.logoText}>
              <h1>Alumni Portal</h1>
              <p>University Network</p>
            </div>
          </div>
          {/* Collapsed Sidebar Logo (visible <= 1024px) */}
          <div className={styles.mobileLogo}>
             <div className={styles.sealIcon}>
                <span className="material-symbols-outlined">workspace_premium</span>
             </div>
          </div>
        </div>

        <nav className={styles.navMenu}>
          <a href="#" className={styles.navItem}>
            <span className="material-symbols-outlined">grid_view</span>
            <span className={styles.navText}>Dashboard</span>
          </a>
          <a href="#" className={styles.navItem}>
            <span className="material-symbols-outlined">mail</span>
            <span className={styles.navText}>Mail</span>
          </a>
          <a href="#" className={styles.navItem}>
            <span className="material-symbols-outlined">work</span>
            <span className={styles.navText}>Job & Reference</span>
          </a>
          <a href="#" className={styles.navItem}>
            <span className="material-symbols-outlined">volunteer_activism</span>
            <span className={styles.navText}>Donation</span>
          </a>
          {/* Active Navigation Item: Events & Reunion */}
          <a href="#" className={`${styles.navItem} ${styles.activeNavItem}`}>
            <span className="material-symbols-outlined">event_available</span>
            <span className={styles.navText}>Events & Reunion</span>
          </a>
          <a href="#" className={styles.navItem}>
            <span className="material-symbols-outlined">rate_review</span>
            <span className={styles.navText}>Feedback</span>
          </a>
          <a href="#" className={`${styles.navItem} ${styles.desktopOnlyNav}`}>
            <span className="material-symbols-outlined">person_outline</span>
            <span className={styles.navText}>Profile</span>
          </a>
        </nav>

        <div className={styles.sidebarFooter}>
          <a href="#" className={`${styles.navItem} ${styles.mobileOnlyNav}`}>
            <span className="material-symbols-outlined">person_outline</span>
          </a>
          <a href="#" className={styles.logoutBtn}>
            <span className="material-symbols-outlined">logout</span>
            <span className={styles.navText}>Logout</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Top Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.hamburgerBtn} onClick={toggleMenu}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className={styles.headerTitles}>
              <h2 className={styles.welcomeTitle}>Welcome back, Alumni!</h2>
              <p className={styles.welcomeSubtitle}>
                Check out what's happening in your alma mater today.
              </p>
            </div>
          </div>
          
          <div className={styles.headerRight}>
            <button className={styles.iconBtn}>
              <span className="material-symbols-outlined">notifications_none</span>
              <span className={styles.notificationDot}></span>
            </button>
            <button className={styles.profileBtn}>
              <span className="material-symbols-outlined">person_outline</span>
            </button>
          </div>
        </header>

        {/* Content Section */}
        <section className={styles.emailSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <span className={`material-symbols-outlined ${styles.titleIcon}`}>
                mark_email_unread
              </span>
              <h3>Received Emails</h3>
            </div>
            <a href="#" className={styles.viewAllLink}>
              View All
            </a>
          </div>

          <div className={styles.emailList}>
            {emails.map((email) => (
              <div key={email.id} className={styles.emailCard}>
                <div className={styles.emailInfo}>
                  {/* Render Avatar Image or Text Initials */}
                  {email.avatarType === 'image' ? (
                    <img
                      src={email.avatarSrc}
                      alt={email.sender}
                      className={styles.avatarImage}
                    />
                  ) : (
                    <div className={`${styles.avatarText} ${email.avatarClass}`}>
                      {email.avatarText}
                    </div>
                  )}
                  
                  {/* Email Text Content */}
                  <div className={styles.emailDetails}>
                    <h4 className={styles.senderName}>{email.sender}</h4>
                    <p className={styles.subjectLine}>
                      {email.subject} <span className={styles.timeDot}>•</span> {email.time}
                    </p>
                  </div>
                </div>
                
                <button className={styles.viewDetailsBtn}>View Details</button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default EventsReunion;