import { useNavigate } from 'react-router-dom';
import styles from './Event_Reunion.module.css';
import Sidebar from './Components/Sidebar/Sidebar';

const Alumini_EventsReunion = ({ onLogout }) => {

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
    {
      id: 4,
      sender: 'Office of Alumni Relations',
      avatarType: 'text',
      avatarText: 'OR',
      avatarClass: styles.avatarBlue,
      subject: 'Invitation: Annual Networking Gala 2024 - Join us for a night of memor...',
      time: '2 hours ago',
    },
    {
      id: 5,
      sender: "Sarah Jenkins (Class of '15)",
      avatarType: 'image',
      avatarSrc: 'https://i.pravatar.cc/150?img=47',
      subject: 'Career Mentorship Inquiry - I saw your profile and was wondering if y...',
      time: 'Yesterday, 4:12 PM',
    },
    {
      id: 6,
      sender: 'Career Services Center',
      avatarType: 'text',
      avatarText: 'CS',
      avatarClass: styles.avatarOrange,
      subject: 'New Job Referrals based on your profile - We found 3 new matches to...',
      time: 'Nov 14, 2023',
    },
    {
      id: 7,
      sender: 'Office of Alumni Relations',
      avatarType: 'text',
      avatarText: 'OR',
      avatarClass: styles.avatarBlue,
      subject: 'Invitation: Annual Networking Gala 2024 - Join us for a night of memor...',
      time: '2 hours ago',
    },
    {
      id: 8,
      sender: "Sarah Jenkins (Class of '15)",
      avatarType: 'image',
      avatarSrc: 'https://i.pravatar.cc/150?img=47',
      subject: 'Career Mentorship Inquiry - I saw your profile and was wondering if y...',
      time: 'Yesterday, 4:12 PM',
    },
    {
      id: 9,
      sender: 'Career Services Center',
      avatarType: 'text',
      avatarText: 'CS',
      avatarClass: styles.avatarOrange,
      subject: 'New Job Referrals based on your profile - We found 3 new matches to...',
      time: 'Nov 14, 2023',
    },
  ];

  const navigate = useNavigate();
  return (
    <div className={styles.pageContainer}>

      {/* Sidebar Navigation */}
      <Sidebar onLogout={onLogout} currentView="event_reunion" />
      

      {/* Main Content Area */}
      <main className={styles.mainContent}>
      {/* Top Header */}
        <header className={styles.header}>
            <div className={styles.headerTitles}>
              <h2 className={styles.welcomeTitle}>Welcome back, Alumni!</h2>
              <p className={styles.welcomeSubtitle}>
                Check out what's happening in your alma mater today.
              </p>
            </div>
          
          <div className={styles.headerRight}>
            <button className={styles.iconBtn}>
              <span className="material-symbols-outlined">notifications_none</span>
              <span className={styles.notificationDot}></span>
            </button>
            {/* Peach colored profile button as seen in the header close-up */}
            <button className={styles.profileBtn}>
              <span className="material-symbols-outlined">person</span>
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
                
                <button className={styles.viewDetailsBtn} onClick={() => navigate('/alumini/event_reunion/view_invitation')} >View Details</button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Alumini_EventsReunion;