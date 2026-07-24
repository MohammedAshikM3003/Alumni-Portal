import { useNavigate } from 'react-router-dom';
import styles from './Al_Event_Reunion.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface InvitationRecord {
  _id: string;
  sender: string;
  subject: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  description: string;
  flyer?: string;
  createdAt: string;
}

interface AluminiEventsReunionProps {
  onLogout?: () => void;
}

const Alumini_EventsReunion = ({ onLogout }: AluminiEventsReunionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchInvitations = async () => {
      if (!user?.token) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/invitations/all`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.invitations)) {
          setInvitations(data.invitations);
        } else {
          setError(data.message || 'Failed to fetch invitations');
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to fetch invitations');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
    return () => controller.abort();
  }, [user?.token]);

  const avatarClasses = [
    styles.avatarBlue,
    styles.avatarOrange,
    styles.avatarGreen,
    styles.avatarPurple
  ];

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Sidebar Navigation */}
      <Sidebar onLogout={onLogout} currentView="event_reunion" />

      {/* Main Content Area */}
      <main className={styles.mainContent}>
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
            {loading ? (
              <div className={styles.loadingState}>
                <span>Loading received emails...</span>
              </div>
            ) : error ? (
              <div className={styles.errorState}>
                <span>Failed to load invitations: {error}</span>
              </div>
            ) : invitations.length === 0 ? (
              <div className={styles.emptyState}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#9CA3AF', marginBottom: '16px', display: 'block' }}>
                  mark_email_read
                </span>
                <p>No invitation emails received yet.</p>
              </div>
            ) : (
              invitations.map((inv, idx) => (
                <div key={inv._id} className={styles.emailCard}>
                  <div className={styles.emailInfo}>
                    <div className={`${styles.avatarText} ${avatarClasses[idx % avatarClasses.length]}`}>
                      {(inv.sender || 'OR').substring(0, 2).toUpperCase()}
                    </div>
                    
                    {/* Email Text Content */}
                    <div className={styles.emailDetails}>
                      <h4 className={styles.senderName}>{inv.sender}</h4>
                      <p className={styles.subjectLine}>
                        {inv.subject} <span className={styles.timeDot}>•</span> {formatTime(inv.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    className={styles.viewDetailsBtn} 
                    onClick={() => navigate('/alumini/event_reunion/view_invitation', { state: { invitation: inv } })}
                  >
                    View Details
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Alumini_EventsReunion;