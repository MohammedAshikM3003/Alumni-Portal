import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Components/Sidebar/Sidebar';
import styles from './AD_Draft_History.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Admin_Draft_History = ({ onLogout }) => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/drafts/all`, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        setDrafts(data.drafts);
      }
    } catch (err) {
      console.error('Error fetching drafts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const getIconStyle = (index) => {
    return index % 2 === 0 ? 'slate' : 'primary';
  };

  return (
    <div className={styles.pageLayout}>
      <Sidebar onLogout={onLogout} currentView={'mail'} />

      <main className={styles.mainContent}>
        <div className={styles.backButton} onClick={() => navigate('/admin/mail')}>
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back</span>
        </div>
        <div className={styles.contentWrapper}>
          <div className={styles.listHeader}>
            <div className={styles.colRecipient}>Recipient</div>
            <div className={styles.colSubject}>Subject Line</div>
            <div className={styles.colDate}>Last Saved</div>
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading drafts...</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className={styles.emptyState}>
              <span className="material-symbols-outlined">drafts</span>
              <p>No drafts yet</p>
              <small>Saved drafts will appear here</small>
            </div>
          ) : (
            <div className={styles.draftsList}>
              {drafts.map((draft, index) => (
                <div
                  key={draft._id}
                  className={styles.draftCard}
                >
                  <div className={styles.colRecipient}>
                    <div className={`${styles.avatar} ${getIconStyle(index) === 'primary' ? styles.avatarPrimary : styles.avatarSlate}`}>
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <span className={styles.recipientName}>{draft.recipientName || 'No recipient'}</span>
                  </div>

                  <div className={styles.colSubject}>
                    <p className={styles.subjectTitle}>{draft.title || 'No subject'}</p>
                    <p className={styles.snippetText}>
                      {draft.content
                        ? draft.content.length > 80
                          ? draft.content.substring(0, 80) + '...'
                          : draft.content
                        : 'No content'}
                    </p>
                  </div>

                  <div className={styles.colDate}>
                    <div className={styles.actionGroup}>
                      <span className={styles.dateText}>{formatDate(draft.updatedAt)}</span>
                      <button
                        className={styles.viewBtn}
                        title="View"
                        onClick={() => navigate('/admin/mail/broadcast_message', { state: { draftId: draft._id, editDraft: true } })}
                      >
                        <span>View</span>
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
};

export default Admin_Draft_History;
