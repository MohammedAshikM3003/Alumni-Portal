import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AD_Dashboard.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { Users, UserCheck, Calendar, Send, RefreshCw, Trophy, ExternalLink, Mail, Briefcase, Coins, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

interface DashboardStats {
  totalAlumni: number;
  activeCoordinators: number;
  upcomingEvents: number;
  totalBroadcasts: number;
  [key: string]: number;
}

interface DashboardCards {
  mail?: {
    newCount: number;
    recentMails: any[];
  };
  jobs?: {
    activeCount: number;
    recentJobs: any[];
  };
  donation?: {
    amount: number;
    purpose: string;
    paidAt: string;
  };
  event?: {
    name: string;
    venue: string;
    day: string;
    time: string;
    daysUntil: number;
    hoursUntil: number;
  };
}

interface AchievementNewsItem {
  date: string;
  title: string;
  description: string;
}

const achievementsAndNewsData: AchievementNewsItem[] = [
  {
    date: 'OCT 24, 2023',
    title: 'Startup center secures ₹5Cr Funding',
    description: 'Major grant to boost innovation hub, benefiting 50+ student startups across departments.',
  },
  {
    date: 'OCT 22, 2023',
    title: 'Dr. Arul wins "Researcher"',
    description: 'Honored for breakthrough contributions in Renewable Energy Systems and sustainable...',
  },
  {
    date: 'OCT 20, 2023',
    title: 'Industry Partnership',
    description: 'MoU signed for internship programs and specialized training modules for final year...',
  },
  {
    date: 'OCT 18, 2023',
    title: 'Alumni Sports Meet',
    description: 'Join the annual football and cricket tournament at the campus grounds. Register now.',
  }
];

const Admin_Dashboard = ({ onLogout }: { onLogout?: () => void }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Analytics KPI state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [cards, setCards] = useState<DashboardCards | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch dashboard statistics from the API
   */
  const fetchStats = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        signal,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch statistics');
      }

      setStats(data.stats);
      setCards(data.cards);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('[Admin_Dashboard] Analytics fetch error:', err);
      setError(err.message || 'An error occurred while fetching analytics data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format time ago for display
   */
  const formatTimeAgo = (date: string | Date | null | undefined) => {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `Received ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `Received ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Received just now';
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchStats(controller.signal);
    return () => controller.abort();
  }, []);

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
          <div className={styles.headerRight}>
            <div className={styles.adminBadge}>
              <span className={styles.adminPulse}></span>
              <span className={styles.adminName}>Admin: {user?.name || 'Administrator'}</span>
            </div>
          </div>
        </header>

        <div className={styles.dashboardContent}>
          <div className={styles.dashboardGrid}>
            {/* Card 1: Mail */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeader1}>
                  <Mail size={18} style={{ color: '#0284c7', flexShrink: 0 }} />
                  <h2 className={styles.cardTitle}>Mail</h2>
                </div>
                <span className={styles.cardBadge}>{cards?.mail?.newCount || 0} New</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.mailList}>
                  {(cards?.mail?.recentMails && cards.mail.recentMails.length > 0) ? (
                    cards.mail.recentMails.slice(0, 2).map((mail: any, idx: number) => (
                      <div key={idx} className={styles.mailItem}>
                        <div className={styles.mailItemDot}></div>
                        <div className={styles.mailItemContent}>
                          <span className={styles.mailItemSender}>{mail.senderName || 'Alumni System'}</span>
                          <p className={styles.mailItemText}>{mail.preview || mail.title}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noDataText}>No recent messages</div>
                  )}
                </div>
              </div>
              <button className={styles.cardAction} onClick={() => { navigate('/admin/mail') }} >
                Go to Inbox <ArrowRight size={14} style={{ marginLeft: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
              </button>
            </div>

            {/* Card 2: Career Hub */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeader1}>
                  <Briefcase size={18} style={{ color: '#7c3aed', flexShrink: 0 }} />
                  <h2 className={styles.cardTitle}>Career Hub</h2>
                </div>
                <span className={styles.cardStatus}>{cards?.jobs?.activeCount || 0} Active</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.jobList}>
                  {(cards?.jobs?.recentJobs && cards.jobs.recentJobs.length > 0) ? (
                    cards.jobs.recentJobs.slice(0, 2).map((job: any, idx: number) => (
                      <div key={idx} className={styles.jobItem}>
                        <div className={styles.jobItemIcon}><Briefcase size={16} /></div>
                        <div className={styles.jobItemContent}>
                          <span className={styles.jobRoleText}>{job.role}</span>
                          <span className={styles.jobCompanyText}>{job.company}</span>
                          <span className={styles.jobReferredText}>Referral by {job.referredBy}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noDataText}>No active job referrals</div>
                  )}
                </div>
              </div>
              <button className={styles.cardActionOutline} onClick={() => { navigate('/admin/job_and_reference') }} >Explore All Jobs</button>
            </div>

            {/* Card 3: Donation History */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeader1}>
                  <Coins size={18} style={{ color: 'var(--primary-green)', flexShrink: 0 }} />
                  <h2 className={styles.cardTitle}>Donation History</h2>
                </div>
                <span className={styles.cardStatusGreen}>Scholarship Goal</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.donationCardBody}>
                  {cards?.donation ? (
                    <div className={styles.donationStatsWrapper}>
                      <span className={styles.donationAmountLabel}>Latest Donation</span>
                      <div className={styles.donationAmountValue}>₹{cards.donation.amount?.toLocaleString()}</div>
                      <div className={styles.donationDetailRow}>
                        <span className={styles.donationPurpose}>{cards.donation.purpose}</span>
                        <span className={styles.donationTimeText}>{formatTimeAgo(cards.donation.paidAt)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.noDonationsWrapper}>
                      <span className={styles.donationAmountLabel}>Latest Donation</span>
                      <div className={styles.donationAmountValue}>-</div>
                    </div>
                  )}
                </div>
              </div>
              <button className={styles.cardActionPrimary} onClick={() => { navigate('/admin/donation_history') }} >View History</button>
            </div>

            {/* Card 4: Events & Reunions */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeader1}>
                  <Calendar size={18} style={{ color: '#ea580c', flexShrink: 0 }} />
                  <h2 className={styles.cardTitle}>Events &amp; Reunions</h2>
                </div>
                <span className={styles.cardUpcoming}>Upcoming</span>
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
                  </>
                ) : (
                  <>
                    <h3 className={styles.reunionTitle}>No Upcoming Events</h3>
                    <p className={styles.reunionDesc}>Schedule an event to engage with alumni</p>
                  </>
                )}
              </div>
              {cards?.event ? (
                <button className={styles.reunionBtn} onClick={() => { navigate('/admin/event_and_reunion_history') }} >View Events</button>
              ) : (
                <button className={styles.reunionBtn} onClick={() => { navigate('/admin/event_and_reunion') }} >Create Event</button>
              )}
            </div>

            {/* Card 5: Achievements & News */}
            <div className={styles.cardAchievements}>
              <div className={styles.achievementsHeader}>
                <div className={styles.achievementsHeaderLeft}>
                  <Trophy size={20} className={styles.trophyIcon} style={{ color: 'var(--primary-green)', flexShrink: 0 }} />
                  <h2 className={styles.achievementsTitle}>Achievements &amp; News</h2>
                </div>
                <a href="#" className={styles.achievementsViewAll} onClick={(e) => e.preventDefault()}>
                  View All <ExternalLink size={14} className={styles.externalLinkIcon} />
                </a>
              </div>
              <div className={styles.achievementsGrid}>
                {achievementsAndNewsData.map((item, index) => (
                  <div key={index} className={styles.achievementItem}>
                    <span className={styles.achievementDate}>{item.date}</span>
                    <h3 className={styles.achievementTitle}>{item.title}</h3>
                    <p className={styles.achievementDesc}>{item.description}</p>
                    <a href="#" className={styles.achievementReadMore} onClick={(e) => e.preventDefault()}>
                      READ MORE <span className={styles.arrowIcon}>&gt;</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin_Dashboard;
