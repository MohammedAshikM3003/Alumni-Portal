import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AD_Dashboard.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { Users, UserCheck, Calendar, Send, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;


const Admin_Dashboard = ( { onLogout } ) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Analytics KPI state
  const [stats, setStats] = useState(null);
  const [cards, setCards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch dashboard statistics from the API
   */
  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch statistics');
      }

      setStats(data.stats);
      setCards(data.cards);
    } catch (err) {
      console.error('[Admin_Dashboard] Analytics fetch error:', err);
      setError(err.message || 'An error occurred while fetching analytics data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format time ago for display
   */
  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `Received ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `Received ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Received just now';
  };

  useEffect(() => {
    fetchStats();
  }, []);

  /**
   * KPI card configuration
   */
  const kpiConfig = [
    {
      key: 'totalAlumni',
      label: 'Total Alumni',
      icon: Users,
      color: 'green',
    },
    {
      key: 'activeCoordinators',
      label: 'Active Coordinators',
      icon: UserCheck,
      color: 'blue',
    },
    {
      key: 'upcomingEvents',
      label: 'Upcoming Events',
      icon: Calendar,
      color: 'orange',
    },
    {
      key: 'totalBroadcasts',
      label: 'Broadcasts Sent',
      icon: Send,
      color: 'purple',
    },
  ];


  /**
   * Render error state with retry button
   */
  const renderError = () => (
    <div className={styles.errorContainer}>
      <p className={styles.errorMessage}>{error}</p>
      <button className={styles.retryButton} onClick={fetchStats}>
        <RefreshCw size={16} />
        Retry
      </button>
    </div>
  );

  /**
   * Render KPI cards
   */
  const renderKpiCards = () => (
    <div className={styles.kpiGrid}>
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon;
        const value = stats?.[kpi.key] ?? 0;
        const colorClass = styles[`kpiCard${kpi.color.charAt(0).toUpperCase() + kpi.color.slice(1)}`];

        return (
          <div key={kpi.key} className={`${styles.kpiCard} ${colorClass}`}>
            <div className={styles.kpiIconWrapper}>
              <Icon size={24} className={styles.kpiIcon} />
            </div>
            <span className={styles.kpiLabel}>{kpi.label}</span>
            <span className={styles.kpiValue}>{value.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );



  return (
    <div className={styles.dashboardWrapper}>
      <Sidebar onLogout={onLogout} currentView={'dashboard'} />

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.collegeName}>
              K.S.R College of Engineering
            </h1>
          </div>
        </header>
        <div className={styles.dashboardContent}>
          {/* Cards Row 1 */}
          <div className={styles.cardsRow}>
            <div className={`${styles.card} ${styles.overlapColumn}`}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Mail</h2>
                <span className={styles.cardBadge}>{cards?.mail?.newCount || 0} New</span>
              </div>
              <div className={styles.cardBody}>
                {cards?.mail?.recentMails?.length > 0 ? (
                  cards.mail.recentMails.map((mail, idx) => (
                    <div key={idx} className={styles.mailPreview}>{mail.preview || mail.title}</div>
                  ))
                ) : (
                  <div className={styles.mailPreview}>No recent messages</div>
                )}
              </div>
              <button className={styles.cardAction} onClick={() => { navigate('/admin/mail') }} >Go to Inbox →</button>
            </div>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>💼</div>
                <h2 className={styles.cardTitle}>Career Hub</h2>
                <span className={styles.cardStatus}>{cards?.jobs?.activeCount || 0} Active</span>
              </div>
              <div className={styles.cardBody}>
                {cards?.jobs?.recentJobs?.length > 0 ? (
                  cards.jobs.recentJobs.map((job, idx) => (
                    <div key={idx} className={styles.jobPreview}>
                      <b>{job.role}, {job.company}</b> <span>Referral by {job.referredBy}</span>
                    </div>
                  ))
                ) : (
                  <div className={styles.jobPreview}>No active job referrals</div>
                )}
              </div>
              <button className={styles.cardActionOutline} onClick={() => { navigate('/admin/job_and_reference') }} >Explore All Jobs</button>
            </div>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>💸</div>
                <span className={styles.cardStatusGreen}>Scholarship Goal</span>
              </div>
              <div className={styles.cardBody}>
                {cards?.donation ? (
                  <>
                    <div className={styles.donationTitle}>Latest Donation</div>
                    <div className={styles.donationAmount}>₹{cards.donation.amount?.toLocaleString()}</div>
                    <div className={styles.donationDept}>{cards.donation.purpose}</div>
                    <div className={styles.donationTime}>{formatTimeAgo(cards.donation.paidAt)}</div>
                  </>
                ) : (
                  <>
                    <div className={styles.donationTitle}>No Recent Donations</div>
                    <div className={styles.donationAmount}>-</div>
                  </>
                )}
              </div>
              <button className={styles.cardActionPrimary} onClick={() => { navigate('/admin/donation_history') }} >View History</button>
            </div>
          </div>
          {/* Cards Row 2 */}
          <div className={styles.cardsRow}>
            <div className={`${styles.card} ${styles.overlapColumn}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardUpcoming}>Upcoming</span>
                <span className={styles.cardIcon}>📅</span>
              </div>
              <div className={styles.cardBody}>
                {cards?.event ? (
                  <>
                    <h3 className={styles.reunionTitle}>{cards.event.name}</h3>
                    <p className={styles.reunionDesc}>
                      {cards.event.venue} | {cards.event.day}, {cards.event.time}
                    </p>
                    <div className={styles.reunionCountdown}>
                      <div><b>{cards.event.daysUntil}</b> Days</div>
                      <div><b>{String(cards.event.hoursUntil).padStart(2, '0')}</b> Hrs</div>
                    </div>
                    <button className={styles.reunionBtn} onClick={() => { navigate('/admin/event_and_reunion_history') }} >View Events</button>
                  </>
                ) : (
                  <>
                    <h3 className={styles.reunionTitle}>No Upcoming Events</h3>
                    <p className={styles.reunionDesc}>Schedule an event to engage with alumni</p>
                    <button className={styles.reunionBtn} onClick={() => { navigate('/admin/event_and_reunion') }} >Create Event</button>
                  </>
                )}
              </div>
            </div>
            <div className={styles.cardAchievements}>
              <div className={styles.achievementsHeader}>
                <div className={styles.cardIcon}>📊</div>
                <h2 className={styles.achievementsTitle}>Analytics Overview</h2>
                {!loading && !error && (
                  <button
                    className={styles.refreshButton}
                    onClick={fetchStats}
                    title="Refresh analytics data"
                  >
                    <RefreshCw size={16} />
                  </button>
                )}
              </div>
              {error && !loading && renderError()}
              {!loading && !error && stats && renderKpiCards()}
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default Admin_Dashboard;
