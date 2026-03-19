import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './AD_Event_and_Reunion_Invitation.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
};

const Admin_Event_and_Reunion_Invitation = ({ onLogout }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!user?.token) {
        setError('Please login to view event details');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/invitations/${id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch event details');
        }

        const data = await response.json();

        if (data.success && data.invitation) {
          setInvitation(data.invitation);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvitation();
    }
  }, [id, user]);

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'event_and_reunion_history'} />
        <main className={styles.mainContent}>
          <div className={styles.loadingState}>Loading event details...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'event_and_reunion_history'} />
        <main className={styles.mainContent}>
          <div className={styles.errorState}>{error}</div>
        </main>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'event_and_reunion_history'} />
        <main className={styles.mainContent}>
          <div className={styles.errorState}>Event not found</div>
        </main>
      </div>
    );
  }

  const quickInfo = [
    { icon: 'calendar_month', title: 'Date & Time', value: `${formatDate(invitation.eventDate)} • ${formatTime(invitation.eventTime)}` },
    { icon: 'location_on', title: 'Location', value: invitation.venue },
    { icon: 'person', title: 'Organized By', value: invitation.sender },
  ];

  const flyerUrl = invitation.flyer ? `${API_BASE}/api/invitations/image/${invitation.flyer}` : null;

  return (
    <div className={styles.pageContainer}>

      {/* Side Navigation */}
      <Sidebar onLogout={onLogout} currentView={'event_and_reunion_history'} />

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Back Button */}
        <div className={styles.backButton} onClick={() => navigate('/admin/event_and_reunion_history')} >
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back</span>
        </div>

        <div className={styles.contentWrapper} >
          {/* 1. Top Section: Header */}
          <header className={styles.headerSection}>
            <div className={styles.headerContent}>
              <span className={styles.upcomingBadge}>Event Invitation</span>
              <h1 className={styles.mainTitle}>{invitation.subject}</h1>

              <div className={styles.speakerProfile}>
                <div className={styles.speakerAvatarIcon}>
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <h3 className={styles.speakerName}>{invitation.sender}</h3>
                  <p className={styles.speakerRole}>Event Organizer</p>
                </div>
              </div>
            </div>
          </header>

          {/* Quick Info Grid */}
          <section className={styles.quickInfoGrid}>
            {quickInfo.map((info, index) => (
              <div key={index} className={styles.infoCard}>
                <span className={`material-symbols-outlined ${styles.infoIcon}`}>
                  {info.icon}
                </span>
                <div>
                  <p className={styles.infoLabel}>{info.title}</p>
                  <p className={styles.infoValue}>{info.value}</p>
                </div>
              </div>
            ))}
          </section>

          {/* 2. Center Section: Event Description */}
          <section className={styles.descriptionSection}>
            <div className={styles.descriptionCard}>
              <h2 className={styles.sectionTitle}>
                <span className="material-symbols-outlined">description</span>
                Event Description
              </h2>
              <div className={styles.proseText}>
                <p>{invitation.description}</p>
              </div>
            </div>
          </section>

          {/* 3. Flyer Section */}
          {flyerUrl && (
            <section className={styles.flyerSection}>
              <div className={styles.flyerCard}>
                <h2 className={styles.sectionTitle}>
                  <span className="material-symbols-outlined">image</span>
                  Event Flyer
                </h2>
                <div className={styles.flyerImageWrapper}>
                  <img
                    src={flyerUrl}
                    alt="Event Flyer"
                    className={styles.flyerImage}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              </div>
            </section>
          )}
        </div>

      </main>

      {/* Feedback Floating Button */}
      <div className={styles.floatingAction} onClick={() => { navigate('/admin/feedback') }} >
        <button className={styles.feedbackBtn}>
          <span className="material-symbols-outlined">rate_review</span>
          <span>Feedback</span>
        </button>
      </div>

    </div>
  );
};

export default Admin_Event_and_Reunion_Invitation;
