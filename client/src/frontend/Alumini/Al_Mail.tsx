import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Al_Mail.module.css';
import './scrollbar.js';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface AluminiMailProps {
  onLogout?: () => void;
}

interface MailItem {
  _id: string;
  senderName: string;
  senderLabel?: string;
  title?: string;
  isBroadcast?: boolean;
  content: string;
  createdAt: string;
  responseStatus?: string;
}

interface TransformedMail {
  id: string;
  sender: string;
  title: string;
  badge: string;
  text: string;
  date: Date | string;
  responseStatus?: string;
  mailData: MailItem;
}

import { getPageCache, setPageCache } from '../../utils/pageCache';

export default function Alumini_Mail({ onLogout }: AluminiMailProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const cachedMails = getPageCache<TransformedMail[]>('alumni_mails');
  const [mailHistory, setMailHistory] = useState<TransformedMail[]>(cachedMails || []);
  const [loading, setLoading] = useState(!cachedMails);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    fetchAlumniMails(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchAlumniMails = async (signal?: AbortSignal) => {
    try {
      if (!cachedMails) setLoading(true);

      let apiUrl;
      if (user?.email) {
        apiUrl = `${API_BASE_URL}/api/mail/alumni/${encodeURIComponent(user.email)}`;
      } else {
        setMailHistory([]);
        setLoading(false);
        return;
      }

      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json'
        },
        signal,
      });

      const data = await response.json();

      if (data.success) {
        const deriveSenderLabel = (name: string | undefined) => {
          if (!name) return '';
          const n = name.toLowerCase();
          if (n.includes('career')) return 'Career Cell';
          if (n.includes('admin')) return 'Admin';
          if (n.includes('office')) return 'Alumni Office';
          return '';
        };

        const transformedMails = data.mails.map((mail: MailItem): TransformedMail => ({
          id: mail._id,
          sender: mail.senderName,
          title: mail.title || 'No Subject',
          // show explicit senderLabel if present; otherwise derive from senderName
          badge: mail.isBroadcast ? (mail.senderLabel || deriveSenderLabel(mail.senderName) || '') : '',
          text: mail.content,
          date: new Date(mail.createdAt),
          responseStatus: mail.responseStatus,
          mailData: mail
        }));

        setMailHistory(transformedMails);
        setPageCache('alumni_mails', transformedMails);
      } else {
        if (!cachedMails) setMailHistory([]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Error fetching alumni mails:', err);
      if (!cachedMails) setMailHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateInput: any): string => {
    if (!dateInput) return '';
    try {
      const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
      if (!date || typeof date.getTime !== 'function' || isNaN(date.getTime())) {
        return '';
      }
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  const getStatusBadgeColor = (status: string | undefined) => {
    switch (status) {
      case 'accept':
        return '#22c55e';
      case 'reject':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    switch (status) {
      case 'accept':
        return 'Accepted';
      case 'reject':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setLoading(true);
    fetchAlumniMails();
  };

  const handleViewMail = (mail: TransformedMail) => {
    navigate('/alumini/mail/viewmail', {
      state: {
        mailId: mail.mailData._id,
        mailData: {
          ...mail.mailData,
          responseStatus: mail.responseStatus
        }
      }
    });
  };

  const filteredMails = mailHistory.filter((mail: TransformedMail) => {
    const query = searchQuery.toLowerCase();
    return (
      mail.sender.toLowerCase().includes(query) ||
      mail.text.toLowerCase().includes(query) ||
      mail.title.toLowerCase().includes(query) ||
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
              {user?.email && (
                <p className={styles.emailSubtext}>Email: {user.email}</p>
              )}
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
              <button
                className={styles.refreshButton}
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh mail history"
              >
                <span className={`material-symbols-outlined ${loading ? styles.refreshIconSpin : ''}`}>refresh</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.spinner}></div>
              <p>Loading your mails...</p>
            </div>
          ) : filteredMails.length === 0 ? (
            <div className={styles.emptyState}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }}>mail</span>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>No mails found</h3>
              <p style={{ color: '#94a3b8' }}>
                {searchQuery ? "Try adjusting your search query" : "No mails have been sent to your email address yet"}
              </p>
            </div>
          ) : (
            <>
              <div className={styles.tableWrapper}>
                <table className={styles.mailTable}>
                  <thead>
                    <tr>
                      <th className={styles.thSender}>From</th>
                      <th className={styles.thSubject}>Subject</th>
                      <th className={styles.thDate}>Date</th>
                      <th className={styles.thStatus}>Status</th>
                      <th className={styles.thAction}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMails.map((mail: TransformedMail) => (
                      <tr key={mail.id} className={styles.mailRow}>
                        <td className={styles.tdSender}>
                          <div className={styles.senderCell}>
                            <span className={styles.senderName}>{mail.sender}</span>
                            {mail.badge && <span className={styles.badge}>{mail.badge}</span>}
                          </div>
                        </td>
                        <td className={styles.tdSubject}>
                          <div className={styles.subjectCell}>
                            {mail.text.length > 80 ? mail.text.substring(0, 80) + '...' : mail.text}
                          </div>
                        </td>
                        <td className={styles.tdDate}>{formatDate(mail.date)}</td>
                        <td className={styles.tdStatus}>
                          <span
                            className={styles.statusBadge}
                          >
                            {getStatusLabel(mail.responseStatus)}
                          </span>
                        </td>
                        <td className={styles.tdAction}>
                          <button
                            className={styles.viewButton}
                            onClick={() => handleViewMail(mail)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (Matches Event & Reunion Card layout) */}
              <div className={styles.mobileCardsList}>
                {filteredMails.map((mail: TransformedMail, idx: number) => {
                  const avatarClasses = [styles.avatarBlue, styles.avatarOrange, styles.avatarPurple, styles.avatarGreen];
                  const initial = (mail.sender || 'AD').substring(0, 2).toUpperCase();

                  return (
                    <div key={mail.id} className={styles.mobileEmailCard} onClick={() => handleViewMail(mail)}>
                      <div className={styles.mobileEmailHeader}>
                        <div className={styles.mobileSenderRow}>
                          <div className={`${styles.mobileAvatarText} ${avatarClasses[idx % avatarClasses.length]}`}>
                            {initial}
                          </div>
                          <div className={styles.mobileSenderDetails}>
                            <div className={styles.mobileSenderTitleRow}>
                              <h4 className={styles.mobileSenderName}>{mail.sender}</h4>
                              {mail.badge && <span className={styles.badge}>{mail.badge}</span>}
                            </div>
                            <p className={styles.mobileMailDate}>{formatDate(mail.date)}</p>
                          </div>
                        </div>
                        <span className={styles.statusBadge}>{getStatusLabel(mail.responseStatus)}</span>
                      </div>

                      <div className={styles.mobileCardBody}>
                        <h5 className={styles.mobileMailSubject}>{mail.title}</h5>
                        <p className={styles.mobileMailText}>
                          {mail.text.length > 90 ? mail.text.substring(0, 90) + '...' : mail.text}
                        </p>
                      </div>

                      <div className={styles.mobileCardFooter}>
                        <button
                          className={styles.viewDetailsBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewMail(mail);
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
