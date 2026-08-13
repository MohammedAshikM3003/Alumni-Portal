import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Components/Sidebar/Sidebar';
import styles from './AD_Draft_History.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface Draft {
  _id: string;
  recipientName?: string;
  title?: string;
  content?: string;
  updatedAt: string;
}

const Admin_Draft_History = ({ onLogout }: { onLogout?: () => void }) => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchDrafts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/drafts/all`, {
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });

        const data = await response.json();
        if (data.success) {
          setDrafts(data.drafts);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching drafts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
    return () => controller.abort();
  }, []);

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
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

  const getIconStyle = (index: number) => {
    return index % 2 === 0 ? 'slate' : 'primary';
  };

  const handleOpenDraft = (draftId: string) => {
    navigate('/admin/mail/broadcast_message', { state: { draftId, editDraft: true } });
  };

  return (
    <div className={styles.pageLayout}>
      <Sidebar onLogout={onLogout} currentView={'mail'} />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* Back Button */}
          <div className={styles.backButtonRow}>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => navigate('/admin/mail')}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Back to Mail</span>
            </button>
          </div>

          {/* Page Header */}
          <div className={styles.headerSection}>
            <div className={styles.headerTitleGroup}>
              <div className={styles.titleWithBadge}>
                <h1 className={styles.pageTitle}>Drafts</h1>
                {!loading && (
                  <span className={styles.countBadge}>{drafts.length}</span>
                )}
              </div>
              <p className={styles.pageSubtitle}>Saved draft messages ready to edit and broadcast</p>
            </div>
          </div>

          {/* Desktop/Tablet List Headers */}
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
                  onClick={() => handleOpenDraft(draft._id)}
                >
                  {/* Mobile-only Card Header */}
                  <div className={styles.cardHeaderMobile}>
                    <div className={styles.recipientGroup}>
                      <div className={`${styles.avatar} ${getIconStyle(index) === 'primary' ? styles.avatarPrimary : styles.avatarSlate}`}>
                        <span className="material-symbols-outlined">person</span>
                      </div>
                      <div className={styles.recipientInfo}>
                        <span className={styles.recipientName}>{draft.recipientName || 'No recipient'}</span>
                      </div>
                    </div>
                    <span className={styles.dateTextMobile}>{formatDate(draft.updatedAt)}</span>
                  </div>

                  {/* Desktop-only Recipient Column */}
                  <div className={styles.colRecipientDesktop}>
                    <div className={`${styles.avatar} ${getIconStyle(index) === 'primary' ? styles.avatarPrimary : styles.avatarSlate}`}>
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <span className={styles.recipientName}>{draft.recipientName || 'No recipient'}</span>
                  </div>

                  {/* Subject and Preview snippet */}
                  <div className={styles.colSubject}>
                    <p className={styles.subjectTitle}>{draft.title || 'No subject'}</p>
                    <p className={styles.snippetText}>
                      {draft.content
                        ? draft.content.length > 90
                          ? draft.content.substring(0, 90) + '...'
                          : draft.content
                        : 'No content'}
                    </p>
                  </div>

                  {/* Desktop-only Date & Action Column */}
                  <div className={styles.colDateDesktop}>
                    <div className={styles.actionGroup}>
                      <span className={styles.dateText}>{formatDate(draft.updatedAt)}</span>
                      <button
                        type="button"
                        className={styles.viewBtn}
                        title="Edit Draft"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDraft(draft._id);
                        }}
                      >
                        <span>Edit</span>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                      </button>
                    </div>
                  </div>

                  {/* Mobile-only Card Footer */}
                  <div className={styles.cardFooterMobile}>
                    <button
                      type="button"
                      className={styles.viewBtnMobile}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDraft(draft._id);
                      }}
                    >
                      <span>Edit Draft</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>edit</span>
                    </button>
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
