import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Components/Sidebar/Sidebar";
import styles from "./AD_Mail.module.css";
import { useAuth } from "../../context/authContext/authContext";

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface ResponseStats {
  total: number;
  accepted: number;
  rejected: number;
  pending: number;
}

interface MailItem {
  _id: string;
  senderId?: string;
  senderName: string;
  senderLabel?: string;
  senderEmail?: string;
  title?: string;
  content: string;
  recipientCount?: number;
  recipientEmails?: string[];
  isBroadcast?: boolean;
  isEventInvitation?: boolean;
  dominantStatus?: string;
  responseStats?: ResponseStats;
  status?: string;
  createdAt: string;
}

export default function Admin_Mail({ onLogout }: { onLogout?: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mailData, setMailData] = useState<MailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftCount, setDraftCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accept" | "reject">("all");
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchSentMessages = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/mail/all`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        signal,
      });

      const data = await response.json();
      if (data.success) {
        setMailData(data.mails || []);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDraftCount = async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/drafts/count`, {
        headers: { 'Content-Type': 'application/json' },
        signal,
      });

      const data = await response.json();
      if (data.success) {
        setDraftCount(data.count || 0);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Error fetching draft count:', err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchSentMessages(controller.signal);
    fetchDraftCount(controller.signal);
    return () => controller.abort();
  }, [user?.token]);

  const handleRefresh = () => {
    setSearchQuery("");
    fetchSentMessages();
    fetchDraftCount();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getSenderBadge = (mail: MailItem) => {
    if (mail.senderLabel && mail.senderLabel.trim()) {
      return mail.senderLabel;
    }
    if (mail.isBroadcast) {
      return 'Admin';
    }
    return 'Admin';
  };

  const handleRowClick = (mail: MailItem) => {
    navigate('/admin/mail/view_mail', {
      state: {
        mailId: mail._id,
        mailData: mail
      }
    });
  };

  // Filter messages by status tab
  const getFilteredMailsByStatus = (mails: MailItem[]) => {
    if (statusFilter === 'all') return mails;
    return mails.filter((mail) => {
      const stats = mail.responseStats;
      if (statusFilter === 'pending') {
        return (stats && stats.pending > 0) || mail.status === 'pending' || mail.dominantStatus === 'pending';
      }
      if (statusFilter === 'accept') {
        return (stats && stats.accepted > 0) || mail.status === 'accept' || mail.status === 'accepted' || mail.dominantStatus === 'accept' || mail.dominantStatus === 'accepted';
      }
      if (statusFilter === 'reject') {
        return (stats && stats.rejected > 0) || mail.status === 'reject' || mail.status === 'rejected' || mail.dominantStatus === 'reject' || mail.dominantStatus === 'rejected';
      }
      return true;
    });
  };

  // Filter messages by search input
  const filteredMails = getFilteredMailsByStatus(mailData).filter((mail) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = (mail.title || '').toLowerCase().includes(query);
    const contentMatch = (mail.content || '').toLowerCase().includes(query);
    const senderMatch = (mail.senderName || '').toLowerCase().includes(query);
    const labelMatch = (mail.senderLabel || '').toLowerCase().includes(query);
    return titleMatch || contentMatch || senderMatch || labelMatch;
  });

  const sortedMails = [...filteredMails].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Counts for pills
  const allCount = mailData.length;
  const pendingCount = mailData.filter(m => (m.responseStats && m.responseStats.pending > 0) || m.status === 'pending' || m.dominantStatus === 'pending').length;
  const acceptedCount = mailData.filter(m => (m.responseStats && m.responseStats.accepted > 0) || m.status === 'accept' || m.status === 'accepted' || m.dominantStatus === 'accept' || m.dominantStatus === 'accepted').length;
  const rejectedCount = mailData.filter(m => (m.responseStats && m.responseStats.rejected > 0) || m.status === 'reject' || m.status === 'rejected' || m.dominantStatus === 'reject' || m.dominantStatus === 'rejected').length;

  return (
    <div className={styles.bodyContainer}>
      <Sidebar onLogout={onLogout} currentView={'mail'} />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* Header Title Section */}
          <div className={styles.headerSection}>
            <div>
              <h2 className={styles.pageTitle}>Mail History</h2>
              <p className={styles.pageSubtitle}>View, track, and manage all sent mail broadcasts and invitation threads</p>
            </div>
          </div>

          {/* Controls / Filter Bar */}
          <div className={styles.toolbarSection}>
            <div className={styles.toolbarLeft}>
              <div className={styles.actionButtonsRow}>
                <button
                  className={styles.composeBtn}
                  onClick={() => navigate('/admin/mail/broadcast_message')}
                >
                  <span className={`material-symbols-outlined ${styles.composeIcon}`}>add</span>
                  <span>Compose Mail</span>
                </button>

                <button
                  className={styles.draftsBtn}
                  onClick={() => navigate('/admin/mail/draft_history')}
                >
                  <span className="material-symbols-outlined">drafts</span>
                  <span>Drafts</span>
                  <span className={styles.draftBadge}>{draftCount}</span>
                </button>
              </div>

              <div className={styles.filterContainer}>
                <button
                  className={`${styles.filterBtn} ${statusFilter === 'all' ? styles.activeAll : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  <span>All</span>
                  <span className={styles.filterCount}>{allCount}</span>
                </button>
                <button
                  className={`${styles.filterBtn} ${statusFilter === 'pending' ? styles.activePending : ''}`}
                  onClick={() => setStatusFilter('pending')}
                >
                  <span>Pending</span>
                  <span className={styles.filterCount}>{pendingCount}</span>
                </button>
                <button
                  className={`${styles.filterBtn} ${statusFilter === 'accept' ? styles.activeAccepted : ''}`}
                  onClick={() => setStatusFilter('accept')}
                >
                  <span>Accepted</span>
                  <span className={styles.filterCount}>{acceptedCount}</span>
                </button>
                <button
                  className={`${styles.filterBtn} ${statusFilter === 'reject' ? styles.activeRejected : ''}`}
                  onClick={() => setStatusFilter('reject')}
                >
                  <span>Rejected</span>
                  <span className={styles.filterCount}>{rejectedCount}</span>
                </button>
              </div>
            </div>

            <div className={styles.toolbarRight}>
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
                className={styles.refreshBtn}
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh mail list"
              >
                <span className={`material-symbols-outlined ${loading ? styles.refreshIconSpin : ''}`}>refresh</span>
              </button>
            </div>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading messages...</p>
            </div>
          ) : sortedMails.length === 0 ? (
            <div className={styles.emptyState}>
              <span className="material-symbols-outlined">mail</span>
              <h3>No messages found</h3>
              <p>{searchQuery ? "Try adjusting your search query or filters" : "You haven't sent any emails yet"}</p>
            </div>
          ) : (
            <>
              {/* Desktop & Tablet Table View */}
              <div className={styles.tableWrapper}>
                <table className={styles.mailTable}>
                  <thead>
                    <tr>
                      <th className={styles.thSender}>FROM / TO</th>
                      <th className={styles.thSubject}>SUBJECT &amp; PREVIEW</th>
                      <th className={styles.thDate}>DATE</th>
                      <th className={styles.thStats}>RESPONSE STATS</th>
                      <th className={styles.thAction}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMails.map((mail) => {
                      const subject = mail.title?.trim() || 'No Subject';
                      const cleanContent = mail.content?.replace(/\r?\n|\r/g, ' ').trim() || '';
                      const stats = mail.responseStats;
                      const badgeText = getSenderBadge(mail);

                      return (
                        <tr
                          key={mail._id}
                          className={styles.mailRow}
                          onClick={() => handleRowClick(mail)}
                        >
                          <td className={styles.tdSender}>
                            <div className={styles.senderCell}>
                              <span className={styles.senderName}>{mail.senderName || 'Admin'}</span>
                              <span className={styles.senderBadge}>({badgeText})</span>
                            </div>
                          </td>
                          <td className={styles.tdSubject}>
                            <div className={styles.subjectCell}>
                              <span className={styles.subjectTitle}>{subject}</span>
                              <span className={styles.subjectSeparator}> — </span>
                              <span className={styles.contentPreview}>{cleanContent}</span>
                            </div>
                          </td>
                          <td className={styles.tdDate}>
                            <span className={styles.dateText}>{formatDate(mail.createdAt)}</span>
                          </td>
                          <td className={styles.tdStats}>
                            <div className={styles.statsContainer}>
                              {stats && stats.accepted > 0 ? (
                                <span className={styles.statAccepted}>
                                  ✓ Accepted ({stats.accepted})
                                </span>
                              ) : null}
                              {stats && stats.rejected > 0 ? (
                                <span className={styles.statRejected}>
                                  ✗ Rejected ({stats.rejected})
                                </span>
                              ) : null}
                              {stats && stats.pending > 0 ? (
                                <span className={styles.statPending}>
                                  ⏳ Pending ({stats.pending})
                                </span>
                              ) : null}
                              {(!stats || (!stats.accepted && !stats.rejected && !stats.pending)) && (
                                <span className={styles.statNone}>—</span>
                              )}
                            </div>
                          </td>
                          <td className={styles.tdAction}>
                            <button
                              type="button"
                              className={styles.viewButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(mail);
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className={styles.mobileMailList}>
                {sortedMails.map((mail) => {
                  const subject = mail.title?.trim() || 'No Subject';
                  const cleanContent = mail.content?.replace(/\r?\n|\r/g, ' ').trim() || '';
                  const stats = mail.responseStats;
                  const badgeText = getSenderBadge(mail);

                  return (
                    <div
                      key={`mob-${mail._id}`}
                      className={styles.mobileMailCard}
                      onClick={() => handleRowClick(mail)}
                    >
                      <div className={styles.mobileCardHeader}>
                        <div className={styles.mobileSenderGroup}>
                          <span className={styles.mobileSenderName}>{mail.senderName || 'Admin'}</span>
                          <span className={styles.mobileSenderBadge}>({badgeText})</span>
                        </div>
                        <span className={styles.mobileDate}>{formatDate(mail.createdAt)}</span>
                      </div>

                      <div className={styles.mobileCardBody}>
                        <h4 className={styles.mobileSubject}>{subject}</h4>
                        {cleanContent && (
                          <p className={styles.mobileSnippet}>{cleanContent}</p>
                        )}
                      </div>

                      <div className={styles.mobileCardFooter}>
                        <div className={styles.mobileStatsGroup}>
                          {stats && stats.accepted > 0 ? (
                            <span className={styles.statAccepted}>
                              ✓ Accepted ({stats.accepted})
                            </span>
                          ) : null}
                          {stats && stats.rejected > 0 ? (
                            <span className={styles.statRejected}>
                              ✗ Rejected ({stats.rejected})
                            </span>
                          ) : null}
                          {stats && stats.pending > 0 ? (
                            <span className={styles.statPending}>
                              ⏳ Pending ({stats.pending})
                            </span>
                          ) : null}
                        </div>
                        <span className={styles.mobileViewLink}>
                          View <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                        </span>
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
