
import { useNavigate } from "react-router-dom";
import Sidebar from "./Components/Sidebar/Sidebar";
import styles from "./AD_Mail.module.css";
import { useState } from "react";

const MailData = [
  {
    id: 1,
    type: "new",
    sender: "New mail",
    subject: "New Mail Card",
    message: "Click to compose a new message to alumni members",
    time: "",
    buttonClass: "new",
  },
  {
    id: 2,
    sender: "Alumni Office",
    subject: "Invitation",
    message: "Invitation: Virtual Networking Session for Technology Professionals scheduled for next Friday. Register via the link.",
    time: "09:12 AM",
    buttonClass: "green-solid",
  },
  {
    id: 3,
    sender: "Admin Portal",
    subject: "Verification",
    message: "Your profile verification has been completed successfully. Welcome to the official KSRCE network.",
    time: "Oct 24",
    buttonClass: "red-solid",
  },
  {
    id: 4,
    sender: "Placement Cell",
    subject: "Guidelines",
    message: "New Internship guidelines for alumni-led startups are now available for download.",
    time: "Oct 20",
    buttonClass: "grey-outline",
  },
  {
    id: 5,
    sender: "Career Cell",
    subject: "Job Openings",
    message: "Exciting news! We have three new SDE-1 openings at top product firms specifically looking for our alumni.",
    time: "Oct 18",
    buttonClass: "green-outline",
  },
  {
    id: 6,
    sender: "Events Team",
    subject: "Reunion",
    message: "Early bird registration for Grand Reunion 2024 is now open. Book your tickets before Nov 1st.",
    time: "Oct 15",
    buttonClass: "red-outline",
  },
  {
    id: 7,
    sender: "Scholarship Board",
    subject: "Scholarship",
    message: "Applications for the Merit Scholarship 2025 are now being accepted. Refer potential candidates.",
    time: "Oct 12",
    buttonClass: "grey-outline",
  },
  {
    id: 8,
    sender: "Library Admin",
    subject: "Library Access",
    message: "Alumni access to digital library archives has been extended for another year.",
    time: "Oct 10",
    buttonClass: "green-solid",
  },
  {
    id: 9,
    sender: "Tech Support",
    subject: "Maintenance",
    message: "Maintenance notice: The alumni portal will be undergoing scheduled updates this Sunday.",
    time: "Oct 05",
    buttonClass: "red-solid",
  },
  {
    id: 10,
    sender: "Alumni Survey",
    subject: "Survey",
    message: "Help us improve! Please fill out the 5-minute career growth survey.",
    time: "Sep 28",
    buttonClass: "grey-outline",
  },
  {
    id: 11,
    sender: "Sports Dept",
    subject: "Cricket Match",
    message: "Invitation: Annual Alumni vs Students Cricket Match this Sunday at the Main Ground.",
    time: "Sep 25",
    buttonClass: "green-outline",
  },
  {
    id: 12,
    sender: "Chapter Meet",
    subject: "Dinner Meet",
    message: "The Bangalore Chapter is hosting a dinner meet at Indiranagar this Friday. RSVP now.",
    time: "Sep 20",
    buttonClass: "red-outline",
  },
  {
    id: 13,
    sender: "Health & Wellness",
    subject: "Yoga Retreat",
    message: "Join the Alumni Yoga Retreat this weekend. Limited spots available.",
    time: "Sep 15",
    buttonClass: "grey-outline",
  },
  {
    id: 14,
    sender: "Career Mentorship",
    subject: "Mentorship",
    message: "Final call for mentor applications for the 2024-25 academic year mentoring program.",
    time: "Sep 10",
    buttonClass: "green-solid",
  },
  {
    id: 15,
    sender: "Notice Board",
    subject: "Archive",
    message: "Archive updates: Old graduation photos are being digitized for the portal gallery.",
    time: "Sep 05",
    buttonClass: "red-solid",
  },
];

export default function Admin_Mail({ onLogout }) {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleRefresh = () => {
    setSearchQuery("");
  };

  const getButtonClass = (buttonClass) => {
    const classMap = {
      "grey-solid": styles.btnViewGreySolid,
      "grey-outline": styles.btnViewGreyOutline,
      "green-solid": styles.btnViewGreenSolid,
      "green-outline": styles.btnViewGreenOutline,
      "red-solid": styles.btnViewRedSolid,
      "red-outline": styles.btnViewRedOutline,
    };
    return classMap[buttonClass] || "";
  };

  const getCardBorderClass = (index) => {
    const remainder = (index + 1) % 3;
    if (remainder === 1) return styles.borderGrey;
    if (remainder === 2) return styles.borderGreen;
    return styles.borderRed;
  };

  return (
    <div className={styles.bodyContainer}>
        {/* Sidebar Component */}
        <Sidebar onLogout={onLogout} currentView={'mail'} />
      
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.headerSection}>
            <div>
              <h2 className={styles.pageTitle}>Mail History</h2>
            </div>
            <div className={styles.headerActions}>
              {/* Mail Actions */}
              <div className={styles.actionHeader} onClick={() => { navigate('/admin/mail/draft_history') }} >
                <button className={styles.draftsBtn}>
                  <span className="material-symbols-outlined">drafts</span>
                  <span>Drafts</span>
                  <span className={styles.badge}>12</span>
                </button>
              </div>
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
              <button className={styles.refreshBtn} onClick={handleRefresh}>
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </div>
          </div>

          <div className={styles.mailGrid}>
            {MailData.map((mail, index) => (
              mail.type === "new" ? (
                <div key={mail.id} className={`${styles.mailCard} ${styles.mailCardNew} ${styles.newmailborder}`} onClick={() => navigate('/admin/mail/create_mail') }>
                  <div className={styles.newMailContainer}>
                    <span className={`material-symbols-outlined ${styles.newMailIcon}`}>add</span>
                    <span className={styles.newMailText1}>{mail.sender}</span>
                    <p className={styles.mailMessage}>{mail.message}</p>
                  </div>
                </div>
              ) : (
                <div key={mail.id} className={`${styles.mailCard} ${getCardBorderClass(index)}`}>
                  <div className={styles.mailCardContent}>
                    <div className={styles.mailCardBody}>
                      <div className={styles.mailCardTop}>
                        <span className={styles.mailSender}>{mail.sender}</span>
                      </div>
                      <p className={styles.mailMessage}>{mail.message}</p>
                    </div>
                    <div className={styles.mailCardFooter}>
                      <span className={styles.mailTime}>{mail.time}</span>
                      <button className={`${styles.btnView} ${getButtonClass(mail.buttonClass)}`} onClick={() => { navigate('/admin/mail/view_mail') }} >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
