import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Al_Mail.module.css';
import Sidebar from './Components/Sidebar/Sidebar';

export default function Alumini_Mail({ onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleRefresh = () => {
    setSearchQuery('');
  };

  const handleViewMail = () => {
    navigate('/alumini/mail/viewmail');
  };

  const mailData = [
    { id: 1, sender: 'Admin Office', badge: 'Update', text: 'System-wide update regarding the new alumni membership tiers and benefits for 2025.', time: '10:45 AM', btnStyle: 'btnViewGreyOutline', borderColor: '#d1d5db' },
    { id: 2, sender: 'Alumni Office', text: 'Invitation: Virtual Networking Session for Technology Professionals scheduled for next Friday. Register via the link.', time: '09:12 AM', btnStyle: 'btnViewGreenOutline', borderColor: '#22c55e' },
    { id: 3, sender: 'Admin Portal', text: 'Your profile verification has been completed successfully. Welcome to the official KSRCE network.', time: 'Oct 24', btnStyle: 'btnViewRedOutline', borderColor: '#ef4444' },
    { id: 4, sender: 'Placement Cell', text: 'New Internship guidelines for alumni-led startups are now available for download.', time: 'Oct 20', btnStyle: 'btnViewGreyOutline', borderColor: '#d1d5db' },
    { id: 5, sender: 'Career Cell', text: 'Exciting news! We have three new SDE-1 openings at top product firms specifically looking for our alumni.', time: 'Oct 18', btnStyle: 'btnViewGreenOutline', borderColor: '#22c55e' },
    { id: 6, sender: 'Events Team', text: 'Early bird registration for Grand Reunion 2024 is now open. Book your tickets before Nov 1st.', time: 'Oct 15', btnStyle: 'btnViewRedOutline', borderColor: '#ef4444' },
    { id: 7, sender: 'Scholarship Board', text: 'Applications for the Merit Scholarship 2025 are now being accepted. Refer potential candidates.', time: 'Oct 12', btnStyle: 'btnViewGreyOutline', borderColor: '#d1d5db' },
    { id: 8, sender: 'Library Admin', text: 'Alumni access to digital library archives has been extended for another year.', time: 'Oct 10', btnStyle: 'btnViewGreenOutline', borderColor: '#22c55e' },
    { id: 9, sender: 'Tech Support', text: 'Maintenance notice: The alumni portal will be undergoing scheduled updates this Sunday.', time: 'Oct 05', btnStyle: 'btnViewRedOutline', borderColor: '#ef4444' },
    { id: 10, sender: 'Alumni Survey', text: 'Help us improve! Please fill out the 5-minute career growth survey.', time: 'Sep 28', btnStyle: 'btnViewGreyOutline', borderColor: '#d1d5db' },
    { id: 11, sender: 'Sports Dept', text: 'Invitation: Annual Alumni vs Students Cricket Match this Sunday at the Main Ground.', time: 'Sep 25', btnStyle: 'btnViewGreenOutline', borderColor: '#22c55e' },
    { id: 12, sender: 'Chapter Meet', text: 'The Bangalore Chapter is hosting a dinner meet at Indiranagar this Friday. RSVP now.', time: 'Sep 20', btnStyle: 'btnViewRedOutline', borderColor: '#ef4444' },
    { id: 13, sender: 'Health & Wellness', text: 'Join the Alumni Yoga Retreat this weekend. Limited spots available.', time: 'Sep 15', btnStyle: 'btnViewGreyOutline', borderColor: '#d1d5db' },
    { id: 14, sender: 'Career Mentorship', text: 'Final call for mentor applications for the 2024-25 academic year mentoring program.', time: 'Sep 10', btnStyle: 'btnViewGreenOutline', borderColor: '#22c55e' },
    { id: 15, sender: 'Notice Board', text: 'Archive updates: Old graduation photos are being digitized for the portal gallery.', time: 'Sep 05', btnStyle: 'btnViewRedOutline', borderColor: '#ef4444' },
  ];

  const filteredMails = mailData.filter((mail) => {
    const query = searchQuery.toLowerCase();
    return (
      mail.sender.toLowerCase().includes(query) ||
      mail.text.toLowerCase().includes(query) ||
      (mail.badge && mail.badge.toLowerCase().includes(query))
    );
  });

  return (
    <div className={styles.pageWrapper}>
      <Sidebar onLogout={onLogout} currentView={'mail'} />

      <main className={styles.mainContent}>
        <div className={styles.contentContainer}>
          <div className={styles.headerBar}>
            <div>
              <h2 className={styles.pageTitle}>Mail History</h2>
            </div>
            <div className={styles.headerActions}>
              <div className={styles.searchWrapper}>
                <input
                  className={styles.searchInput}
                  placeholder="Search mail..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
              </div>
              <button className={styles.refreshButton} onClick={handleRefresh}>
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </div>
          </div>

          <div className={styles.mailGrid}>
            {filteredMails.map((mail) => (
              <div key={mail.id} className={styles.mailCard} style={{ borderColor: mail.borderColor }}>
                <div className={styles.mailCardContent}>
                  <div className={styles.mailCardHeader}>
                    <span className={styles.mailCardSender}>{mail.sender}</span>
                    {mail.badge && <span className={styles.mailCardBadge}>{mail.badge}</span>}
                  </div>
                  <p className={styles.mailCardText}>{mail.text}</p>
                </div>
                <div className={styles.mailCardFooter}>
                  <span className={styles.mailCardTime}>{mail.time}</span>
                  <button className={`${styles.btnView} ${styles[mail.btnStyle]}`} onClick={handleViewMail}>View</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
