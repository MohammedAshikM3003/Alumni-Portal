import styles from './AD_Draft.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { Send } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Admin_Draft = ({ onLogout, adminName, adminEmail }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const draftId = location.state?.draftId;

  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    if (draftId) {
      fetchDraft();
    } else {
      setLoading(false);
    }
  }, [draftId]);

  const fetchDraft = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/drafts/${draftId}`, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        setDraft(data.draft);
      }
    } catch (err) {
      console.error('Error fetching draft:', err);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: '' });
    }, 5000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSendNow = async () => {
    if (!draft?.recipientEmail) {
      showAlert('No recipient email specified', 'error');
      return;
    }

    setSending(true);

    try {
      const emailPayload = {
        senderId: user?.userId,
        senderName: adminName || user?.name || 'Admin',
        senderEmail: adminEmail || user?.email,
        adminName: (adminName || user?.name || 'Admin').trim(),
        collegeName: 'K.S.R. College of Engineering',
        email: draft.recipientEmail,
        title: draft.title,
        message: draft.content,
        isBroadcast: false
      };

      const response = await fetch(`${API_BASE_URL}/api/mail/send-mail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Delete draft after sending
        await fetch(`${API_BASE_URL}/api/drafts/${draftId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        showAlert('Mail sent successfully!', 'success');
        setTimeout(() => {
          navigate('/admin/mail');
        }, 1500);
      } else {
        showAlert(data.message || 'Failed to send mail', 'error');
      }
    } catch (error) {
      console.error('Error sending mail:', error);
      showAlert('Network error. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this draft?')) return;

    setDeleting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/drafts/${draftId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        navigate('/admin/mail/draft_history');
      } else {
        showAlert(data.message || 'Failed to delete draft', 'error');
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      showAlert('Network error. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'mail'} />
        <main className={styles.mainContent}>
          <div className={styles.backButtonWrapper}>
            <div className={styles.backButton} onClick={() => window.history.back()}>
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Back</span>
            </div>
          </div>
          <div className={styles.loadingState}>
            <p>Loading draft...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'mail'} />
        <main className={styles.mainContent}>
          <div className={styles.backButtonWrapper}>
            <div className={styles.backButton} onClick={() => navigate('/admin/mail/draft_history')}>
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Back</span>
            </div>
          </div>
          <div className={styles.emptyState}>
            <p>Draft not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Sidebar onLogout={onLogout} currentView={'mail'} />

      <main className={styles.mainContent} data-purpose="main-content-area">
        <div className={styles.backButtonWrapper}>
          <div className={styles.backButton} onClick={() => window.history.back()}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </div>
          <div className={styles.actionButtons}>
            <button
              className={styles.editBtn}
              onClick={() => navigate('/admin/mail/broadcast_message', {
                state: {
                  editDraft: true,
                  draftId: draft._id,
                  alumniName: draft.recipientName,
                  alumniEmail: draft.recipientEmail,
                  department: draft.department,
                  batch: draft.batch,
                  title: draft.title,
                  message: draft.content,
                  eventName: draft.eventName,
                  eventDate: draft.eventDate,
                  eventLocation: draft.eventLocation
                }
              })}
            >
              Edit
            </button>
            <button
              className={styles.deleteBtn}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {alert.show && (
          <div className={`${styles.alert} ${styles[alert.type]}`}>
            <span className="material-symbols-outlined">
              {alert.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{alert.message}</span>
          </div>
        )}

        <article className={styles.draftDetailCard} data-purpose="draft-detail-card">
          <header className={styles.cardHeader}>
            <div className={styles.metaRow}>
              <div className={styles.metaGroup}>
                <span className={styles.metaLabel}>Recipient:</span>
                <div className={styles.recipientBadge}>
                  <div className={styles.recipientAvatar}>
                    <svg className={styles.avatarIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <span className={styles.recipientName}>{draft.recipientName || 'No recipient'}</span>
                </div>
              </div>

              <div className={styles.metaGroup}>
                <span className={styles.metaLabel}>Last Saved:</span>
                <span className={styles.metaValue}>{formatDate(draft.updatedAt)}</span>
              </div>
            </div>

            <div className={styles.subjectRow}>
              <span className={styles.metaLabel}>Subject:</span>
              <h2 className={styles.subjectTitle}>{draft.title || 'No subject'}</h2>
            </div>
          </header>

          <section className={styles.cardBody} data-purpose="email-body-text">
            {draft.content ? (
              <p style={{ whiteSpace: 'pre-wrap' }}>{draft.content}</p>
            ) : (
              <p className={styles.noContent}>No message content</p>
            )}

            {draft.senderName && (
              <p className={styles.signatureBlock}>
                Regards,<br />
                <span className={styles.signatureName}>{draft.senderName}</span>
              </p>
            )}
          </section>

          <footer className={styles.cardFooter}>
            <button
              className={styles.sendBtn}
              data-purpose="send-draft-action"
              onClick={handleSendNow}
              disabled={sending || !draft.recipientEmail}
            >
              <Send className={styles.sendIcon} />
              {sending ? 'Sending...' : 'Send Now'}
            </button>
          </footer>
        </article>
      </main>
    </div>
  );
};

export default Admin_Draft;
