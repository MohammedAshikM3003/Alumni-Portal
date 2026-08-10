import styles from "./Al_Dashboard.module.css";
import Sidebar from "./Components/Sidebar/Sidebar";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext/authContext';
import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';


interface DashboardProps {
  onLogout?: () => void;
}

export default function Alumini_Dashboard({ onLogout }: DashboardProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [alumniName, setAlumniName] = useState<string | null>(user?.name || null);
    const [batchLabel, setBatchLabel] = useState<string | null>(null);
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
    
    // Data states
    const [messages, setMessages] = useState<any[]>([]);
    const [jobReferences, setJobReferences] = useState<any[]>([]);
    const [donations, setDonations] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isGridFSId = (value: string | null | undefined): value is string => {
      return !!(value && typeof value === 'string' && /^[a-f\d]{24}$/i.test(value));
    };

    const getImageUrl = (value: string | null | undefined) => {
      if (!value) return null;
      if (isGridFSId(value)) {
        return `${API_BASE}/api/images/${value}`;
      }
      return value; // legacy base64 or data URL
    };

    useEffect(() => {
      const controller = new AbortController();
      const fetchAlumni = async () => {
        if (!user?.token) return;
        try {
          const res = await fetch(`${API_BASE}/api/alumni/me`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          });
          const data = await res.json();
          if (res.ok && data.success && data.alumni) {
            setAlumniName(data.alumni.name || user?.name || null);
            // Prefer yearTo as graduation year
            const yearTo = data.alumni.yearTo;
            if (yearTo) setBatchLabel(`Batch of ${yearTo}`);
            // Profile photo (GridFS id or base64)
            const photoVal = data.alumni.profilePhoto || data.alumni.profilePhotoId || null;
            const url = getImageUrl(photoVal);
            if (url) setProfilePhotoUrl(url);
          }
        } catch (e) {
          // ignore network errors here - keep user.name as fallback
        }
      };

      const fetchDashboardData = async () => {
        if (!user?.token) return;
        try {
          // Fetch messages
          let messagesUrl;
          if (user?.email) {
            messagesUrl = `${API_BASE}/api/mail/alumni/${encodeURIComponent(user.email)}`;
          } else {
            messagesUrl = `${API_BASE}/api/mail`;
          }
          const messagesRes = await fetch(messagesUrl, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          });
          const messagesData = await messagesRes.json();
          if (messagesData.success && messagesData.mails) {
            setMessages(messagesData.mails.slice(0, 2));
          }

          // Fetch job references
          const jobsRes = await fetch(`${API_BASE}/api/jobs/all`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          });
          const jobsData = await jobsRes.json();
          if (jobsData.success && jobsData.jobReferences) {
            setJobReferences(jobsData.jobReferences.slice(0, 2));
          }

          // Fetch donations
          const donationsRes = await fetch(`${API_BASE}/api/donations`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          });
          const donationsData = await donationsRes.json();
          if (donationsData.success && donationsData.donations) {
            setDonations(donationsData.donations.slice(0, 2));
          }

          // Fetch events
          const eventsRes = await fetch(`${API_BASE}/api/events`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          });
          const eventsData = await eventsRes.json();
          if (eventsData.success && eventsData.data) {
            const now = new Date();
            const upcomingEvents = eventsData.data
              .filter((event: any) => new Date(event.eventDate) >= now)
              .slice(0, 1);
            setEvents(upcomingEvents);
          }

          // Fetch news/achievements (if endpoint exists)
          try {
            const newsRes = await fetch(`${API_BASE}/api/news`, {
              signal: controller.signal,
              headers: { Authorization: `Bearer ${user.token}` },
            });
            const newsData = await newsRes.json();
            if (newsData.success && newsData.news) {
              setNews(newsData.news.slice(0, 4));
            }
          } catch (newsError) {
            // News endpoint might not exist, set empty array
            setNews([]);
          }
        } catch (e) {
          console.error('Error fetching dashboard data:', e);
        } finally {
          setLoading(false);
        }
      };

      fetchAlumni();
      fetchDashboardData();
      return () => controller.abort();
    }, [user?.token]);
  
  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <Sidebar onLogout={onLogout} currentView={'dashboard'} />
        <main className={styles.mainContent}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <p>Loading dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      
      {/* Sidebar */}
      <Sidebar onLogout={onLogout} currentView={'dashboard'} />

      {/* Main */}
      <main className={styles.mainContent}>
        
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={`${styles.collegeName} ${styles.hideOnMedium}`}>
              K.S.R College of Engineering
            </h1>
          </div>

          <div className={styles.headerRight}>

            <div className={styles.headerFlexContainer}>
              <div className={styles.userInfo}>
                  <div className={`${styles.userDetails} ${styles.hideOnLarge}`}>
                    <p className={styles.userName}>{alumniName || 'Alumni'}</p>
                    <p className={styles.userClass}>{batchLabel || 'Batch information'}</p>
                  </div>
                <div className={styles.userAvatar}>
                  <img
                    alt="User profile"
                    className={styles.imageFullCover}
                    src={profilePhotoUrl || 'https://via.placeholder.com/160?text=Profile'}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className={styles.contentArea}>
          <div className={styles.contentWrapper}>
            
            <section className={styles.cardsGrid}>

              {/* Latest Messages Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.iconBox} ${styles.iconBoxBlue}`}>
                    <span className={`material-symbols-outlined ${styles.iconBlue}`}>mail</span>
                  </div>
                  <span className={`${styles.badge} ${styles.badgeNew}`}>{messages.length} New</span>
                </div>
                <h3 className={styles.cardTitle}>Latest Messages</h3>
                <div className={styles.cardContent}>
                  {messages.length > 0 ? (
                    messages.map((msg) => (
                      <div key={msg._id} className={styles.messageItem}>
                        <p className={`${styles.messageLabel} ${styles.messageLabelAdmin}`}>{msg.sender?.name || 'Admin'}</p>
                        <p className={styles.messageText}>{msg.subject || 'No subject'}</p>
                        <p className={styles.messageTime}>{new Date(msg.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className={styles.messageText}>No new messages</p>
                  )}
                </div>
                <button 
                  className={`${styles.buttonBase} ${styles.buttonSecondary}`}
                  onClick={() => navigate('/alumini/mail') }
                >
                  Go to Inbox
                </button>
              </div>

              {/* Career Hub Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.iconBox} ${styles.iconBoxEmerald}`}>
                    <span className={`material-symbols-outlined ${styles.iconEmerald}`}>work_outline</span>
                  </div>
                  <span className={styles.badgeInfo}>{jobReferences.length} active postings</span>
                </div>
                <h3 className={styles.cardTitle}>Career Hub</h3>
                <div className={styles.cardContent}>
                  {jobReferences.length > 0 ? (
                    jobReferences.map((job) => (
                      <div key={job._id} className={styles.careerItem}>
                        <div>
                          <p className={styles.careerTitle}>{job.role} at {job.companyName}</p>
                          <p className={styles.careerSubtitle}>Referral by {job.submittedBy?.name || 'Alumni'}</p>
                        </div>
                        <span className={`material-symbols-outlined ${styles.iconPrimaryXl}`}>arrow_forward</span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.messageText}>No active job postings</p>
                  )}
                </div>
                <button 
                  className={`${styles.buttonBase} ${styles.buttonOutline}`}
                  onClick={() => navigate('/alumini/JobReference_History') }
                >
                  Explore All Jobs
                </button>
              </div>

              {/* Giving Back Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.iconBox} ${styles.iconBoxOrange}`}>
                    <span className={`material-symbols-outlined ${styles.iconOrange}`}>payments</span>
                  </div>
                  <span className={styles.badgeOrange}>Scholarship Goal</span>
                </div>
                <h3 className={styles.cardTitleSmall}>Giving Back</h3>
                <p className={styles.cardDescription}>Support the Class of 2024 merit scholarships.</p>
                <div className={styles.progressSection}>
                  <div className={styles.progressHeader}>
                    <span>Progress</span>
                    <span>75% Achieved</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '75%' }}></div>
                  </div>
                  <p className={styles.progressText}>₹7.5L raised of ₹10L target</p>
                </div>
                <div className={styles.contributionsSection}>
                  <p className={styles.contributionsTitle}>Recent Contributions</p>
                  <div className={styles.contributionsList}>
                    {donations.length > 0 ? (
                      donations.map((donation) => (
                        <div key={donation._id} className={styles.contributionItem}>
                          <span className={styles.contributionDate}>{new Date(donation.date).toLocaleDateString()}</span>
                          <span className={styles.contributionAmount}>₹{donation.amount?.toLocaleString() || 0}</span>
                        </div>
                      ))
                    ) : (
                      <p className={styles.messageText}>No recent contributions</p>
                    )}
                  </div>
                </div>
                <button className={`${styles.buttonBase} ${styles.buttonPrimary}`} onClick={() => navigate('/alumini/donation_History')}>Donate Now</button>
              </div>

              {/* Grand Reunion Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.iconBox} ${styles.iconBoxPurple}`}>
                    <span className={`material-symbols-outlined ${styles.iconPurple}`}>event_upcoming</span>
                  </div>
                  <span className={styles.badgePurple}>Upcoming</span>
                </div>
                {events.length > 0 ? (
                  <>
                    <h3 className={styles.cardTitleSmall}>{events[0].eventName}</h3>
                    <p className={styles.eventDescription}>Join us for an evening of nostalgia and networking.</p>
                    <div className={styles.eventLocation}>
                      <span className={`material-symbols-outlined ${styles.eventLocationIcon}`}>location_on</span>
                      <span className={styles.eventLocationText}>{events[0].venue || 'TBD'}</span>
                    </div>
                    <div className={styles.eventCountdown}>
                      <div className={styles.countdownBox}>
                        <p className={styles.countdownNumber}>{Math.ceil(((new Date(events[0].eventDate as string).getTime() - new Date().getTime()) as number) / (1000 * 60 * 60 * 24))}</p>
                        <p className={styles.countdownLabel}>Days</p>
                      </div>
                    </div>
                    <button className={`${styles.buttonBase} ${styles.buttonDark}`} onClick={() => navigate('/alumini/event_reunion')} >RSVP Today</button>
                  </>
                ) : (
                  <>
                    <h3 className={styles.cardTitleSmall}>No Upcoming Events</h3>
                    <p className={styles.eventDescription}>Check back later for upcoming reunions and events.</p>
                    <button className={`${styles.buttonBase} ${styles.buttonDark}`} onClick={() => navigate('/alumini/event_reunion')} >View All Events</button>
                  </>
                )}
              </div>

              {/* Achievements & News Card */}
              <div className={`${styles.card} ${styles.cardWide}`}>
                <div className={styles.achievementsHeader}>
                  <div className={styles.achievementsHeaderInner}>
                    <div className={styles.iconBoxSky}>
                      <span className={`material-symbols-outlined ${styles.iconPrimaryXl}`}>military_tech</span>
                    </div>
                    <h3 className={styles.cardTitle}>Achievements &amp; News</h3>
                  </div>
                </div>
                <div className={styles.newsGrid}>
                  {news.length > 0 ? (
                    news.map((item) => (
                      <div key={item._id} className={styles.newsCard}>
                        <p className={styles.newsDate}>{new Date(item.date).toLocaleDateString()}</p>
                        <h4 className={styles.newsTitle}>{item.title}</h4>
                        <p className={styles.newsDescription}>{item.description}</p>
                        <a className={styles.newsLink} href={item.link || '#'} target="_blank" rel="noopener noreferrer">
                          Read More <span className={`material-symbols-outlined ${styles.newsLinkIcon}`}>arrow_forward_ios</span>
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className={styles.newsCard} style={{ gridColumn: '1 / -1' }}>
                      <p className={styles.newsDescription}>No recent news or achievements to display.</p>
                    </div>
                  )}
                </div>
              </div>

            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
