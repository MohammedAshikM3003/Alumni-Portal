import { useNavigate } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';
import styles from './AD_Draft_History.module.css';

const Admin_Draft_History = ( {onLogout} ) => {

  const navigate = useNavigate();

  // Drafts list data
  const drafts = [
    {
      id: 1,
      recipient: 'Dr. Arul Kumar',
      icon: 'person',
      iconStyle: 'slate',
      subject: 'Guest Lecture Invitation - Dept of IT',
      snippet: 'Dear Dr. Arul, We would like to formally invite you to share your expertise...',
      date: '2 hours ago',
      faded: false,
    },
    {
      id: 2,
      recipient: 'Batch of 2015',
      icon: 'groups',
      iconStyle: 'primary',
      subject: 'Annual Meetup Coordination',
      snippet: "Hi everyone, looking forward to our 10-year reunion next year. Let's start...",
      date: 'Yesterday',
      faded: false,
    },
    {
      id: 3,
      recipient: 'Placement Cell',
      icon: 'domain',
      iconStyle: 'slate',
      subject: 'Internship Opportunities for Juniors',
      snippet: 'I am writing to share a few internship openings at my current firm that would...',
      date: 'Oct 24, 2023',
      faded: false,
    },
    {
      id: 4,
      recipient: 'Prof. Sundaram',
      icon: 'person',
      iconStyle: 'slate',
      subject: 'Project Review Documents',
      snippet: 'Sending over the final documentation for the research project we discussed...',
      date: 'Oct 20, 2023',
      faded: true,
    },
    {
      id: 5,
      recipient: 'Dr. Arul Kumar',
      icon: 'person',
      iconStyle: 'slate',
      subject: 'Guest Lecture Invitation - Dept of IT',
      snippet: 'Dear Dr. Arul, We would like to formally invite you to share your expertise...',
      date: '2 hours ago',
      faded: false,
    },
    {
      id: 6,
      recipient: 'Batch of 2015',
      icon: 'groups',
      iconStyle: 'primary',
      subject: 'Annual Meetup Coordination',
      snippet: "Hi everyone, looking forward to our 10-year reunion next year. Let's start...",
      date: 'Yesterday',
      faded: false,
    },
    {
      id: 7,
      recipient: 'Placement Cell',
      icon: 'domain',
      iconStyle: 'slate',
      subject: 'Internship Opportunities for Juniors',
      snippet: 'I am writing to share a few internship openings at my current firm that would...',
      date: 'Oct 24, 2023',
      faded: false,
    },
    {
      id: 8,
      recipient: 'Prof. Sundaram',
      icon: 'person',
      iconStyle: 'slate',
      subject: 'Project Review Documents',
      snippet: 'Sending over the final documentation for the research project we discussed...',
      date: 'Oct 20, 2023',
      faded: true,
    },
  ];

  return (
    <div className={styles.pageLayout}>
      {/* Sidebar */}
      <Sidebar onLogout={onLogout} currentView={'mail'} />


      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Back Button */}
          <div className={styles.backButton} onClick={() => navigate('/admin/mail')} >
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </div>
        <div className={styles.contentWrapper}>
        

          {/* Drafts List Header */}
          <div className={styles.listHeader}>
            <div className={styles.colRecipient}>Recipient</div>
            <div className={styles.colSubject}>Subject Line</div>
            <div className={styles.colDate}>Last Saved</div>
          </div>

          {/* Drafts List */}
          <div className={styles.draftsList}>
            {drafts.map((draft) => (
              <div 
                key={draft.id} 
                className={`${styles.draftCard} ${draft.faded ? styles.fadedCard : ''}`}
              >
                <div className={styles.colRecipient}>
                  <div className={`${styles.avatar} ${draft.iconStyle === 'primary' ? styles.avatarPrimary : styles.avatarSlate}`}>
                    <span className="material-symbols-outlined">{draft.icon}</span>
                  </div>
                  <span className={styles.recipientName}>{draft.recipient}</span>
                </div>
                
                <div className={styles.colSubject}>
                  <p className={styles.subjectTitle}>{draft.subject}</p>
                  <p className={styles.snippetText}>{draft.snippet}</p>
                </div>
                
                <div className={styles.colDate}>
                  <div className={styles.actionGroup}>
                    <button className={styles.viewBtn} title="View" onClick={() => { navigate('/admin/mail/draft') }} >
                      <span>View</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Admin_Draft_History;