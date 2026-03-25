import { useNavigate } from "react-router-dom";
import Sidebar from "./Components/Sidebar/Sidebar";
import styles from "./AD_Mail.module.css";
import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Admin_Mail({ onLogout }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mailData, setMailData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draftCount, setDraftCount] = useState(0);
  const navigate = useNavigate();

  // Fetch sent messages and draft count from backend
  useEffect(() => {
    fetchSentMessages();
    fetchDraftCount();
  }, []);

  const fetchSentMessages = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/mail/all`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setMailData(data.mails);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDraftCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/drafts/count`, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        setDraftCount(data.count);
      }
    } catch (err) {
      console.error('Error fetching draft count:', err);
    }
  };

  const handleRefresh = () => {
    setSearchQuery("");
    fetchSentMessages();
    fetchDraftCount();
  };

  // Format date to display like original mock data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getButtonClassByStatus = (dominantStatus) => {
    switch (dominantStatus) {
      case 'accept':
        return styles.btnViewGreenOutline;
      case 'reject':
        return styles.btnViewRedOutline;
      case 'pending':
      default:
        return styles.btnViewGreyOutline;
    }
  };

  const getCardBorderByStatus = (dominantStatus) => {
    switch (dominantStatus) {
      case 'accept':
        return styles.borderGreen;
      case 'reject':
        return styles.borderRed;
      case 'pending':
      default:
        return styles.borderGrey;
    }
  };

  // Filter messages based on search query
  const filteredMails = mailData.filter(mail =>
    mail.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mail.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mail.senderName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  <span className={styles.badge}>{draftCount}</span>
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
              <button className={styles.refreshBtn} onClick={handleRefresh} disabled={loading}>
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading messages...</p>
            </div>
          ) : (
            <div className={styles.mailGrid}>
              {/* New Mail Card - Always first */}
              <div className={`${styles.mailCard} ${styles.mailCardNew} `} onClick={() => navigate('/admin/mail/broadcast_message') }>
                <div className={styles.newMailContainer}>
                  <span className={`material-symbols-outlined ${styles.newMailIcon}`}>add</span>
                  <span className={styles.newMailText1}>New mail</span>
                  <p className={styles.mailMessage}>Click to compose a new message to alumni members</p>
                </div>
              </div>

              {/* Display sent messages from DB */}
              {filteredMails.map((mail, index) => (
                <div key={mail._id} className={`${styles.mailCard} ${getCardBorderByStatus(mail.dominantStatus)}`}>
                  <div className={styles.mailCardContent}>
                    <div className={styles.mailCardBody}>
                      <div className={styles.mailCardTop}>
                        <span className={styles.mailSender}>{mail.senderName}</span>
                        {/* Response stats badge */}
                        {mail.responseStats && (
                          <div className={styles.statsContainer}>
                            <span className={styles.statsBadge}>
                              {mail.responseStats.accepted}A / {mail.responseStats.rejected}R / {mail.responseStats.pending}P
                            </span>
                          </div>
                        )}
                      </div>
                      <p className={styles.mailMessage}>
                        {mail.content.length > 120
                          ? mail.content.substring(0, 120) + '...'
                          : mail.content}
                      </p>
                    </div>
                    <div className={styles.mailCardFooter}>
                      <span className={styles.mailTime}>{formatDate(mail.createdAt)}</span>
                      <button
                        className={`${styles.btnView} ${getButtonClassByStatus(mail.dominantStatus)}`}
                        onClick={() => navigate('/admin/mail/view_mail', {
                          state: {
                            mailId: mail._id,
                            mailData: mail
                          }
                        })}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
