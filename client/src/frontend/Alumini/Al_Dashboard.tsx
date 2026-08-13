import styles from "./Al_Dashboard.module.css";
import './scrollbar.js';
import Sidebar from "./Components/Sidebar/Sidebar";
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/authContext/authContext';
import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';


interface DashboardProps {
  onLogout?: () => void;
}

export default function Alumini_Dashboard({ onLogout }: DashboardProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const cachedName = typeof window !== 'undefined' ? localStorage.getItem('cached_alumni_name') : null;
    const cachedBatch = typeof window !== 'undefined' ? localStorage.getItem('cached_alumni_batch') : null;
    const cachedPhoto = typeof window !== 'undefined' ? localStorage.getItem('cached_alumni_photo') : null;

    const [alumniName, setAlumniName] = useState<string | null>(cachedName || user?.name || null);
    const [batchLabel, setBatchLabel] = useState<string | null>(cachedBatch || null);
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(cachedPhoto);
    const [recentMails, setRecentMails] = useState<any[]>([]);
    const [mailCount, setMailCount] = useState<number>(0);
    const [recentJobs, setRecentJobs] = useState<any[]>([]);
    const [jobCount, setJobCount] = useState<number>(0);
    const [recentDonations, setRecentDonations] = useState<any[]>([]);

    const deriveSenderLabel = (name: string | undefined) => {
      if (!name) return 'Admin';
      const n = name.toLowerCase();
      if (n.includes('career')) return 'Career Cell';
      if (n.includes('admin')) return 'Admin';
      if (n.includes('office')) return 'Alumni Office';
      return name;
    };

    const timeAgo = (dateStr: string) => {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHrs / 24);
      
      if (diffMins < 60) return `${diffMins || 1} mins ago`;
      if (diffHrs < 24) return `${diffHrs} hours ago`;
      if (diffDays === 1) return `Yesterday`;
      return `${diffDays} days ago`;
    };

    const handleViewMail = (mail: any) => {
      navigate('/alumini/mail/viewmail', {
        state: {
          mailId: mail._id,
          mailData: {
            ...mail,
            responseStatus: mail.responseStatus
          }
        }
      });
    };

    const getImageUrl = (value: string | null | undefined) => {
      if (!value) return null;
      if (/^[a-f\d]{24}$/i.test(value)) {
        return `${API_BASE}/api/images/${value}`;
      }
      if (value.startsWith('/api')) {
        return `${API_BASE}${value}`;
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
            const nameVal = data.alumni.name || user?.name || null;
            setAlumniName(nameVal);
            if (nameVal) localStorage.setItem('cached_alumni_name', nameVal);

            // Prefer yearTo as graduation year
            const yearTo = data.alumni.yearTo;
            if (yearTo) {
              const batchStr = `Batch of ${yearTo}`;
              setBatchLabel(batchStr);
              localStorage.setItem('cached_alumni_batch', batchStr);
            }

            // Profile photo (GridFS id or base64)
            const photoVal = data.alumni.profilePhoto || data.alumni.profilePhotoId || null;
            const url = getImageUrl(photoVal);
            if (url) {
              setProfilePhotoUrl(url);
              localStorage.setItem('cached_alumni_photo', url);
            }
          }
        } catch (e) {
          // ignore network errors here - keep user.name as fallback
        }
      };

      fetchAlumni();
      return () => controller.abort();
    }, [user?.token]);

    useEffect(() => {
      const fetchMails = async () => {
        if (!user?.email) return;
        try {
          const res = await fetch(`${API_BASE}/api/mail/alumni/${encodeURIComponent(user.email)}`);
          const data = await res.json();
          if (res.ok && data.success && data.mails) {
            setRecentMails(data.mails.slice(0, 2));
            setMailCount(data.mails.length);
          }
        } catch (e) {
          console.error("Error fetching mails:", e);
        }
      };
      fetchMails();
    }, [user?.email]);

    useEffect(() => {
      const fetchJobs = async () => {
        if (!user?.token) return;
        try {
          const res = await fetch(`${API_BASE}/api/jobs/my`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          const data = await res.json();
          if (res.ok && data.success && data.jobReferences) {
            setRecentJobs(data.jobReferences.slice(0, 2));
            setJobCount(data.jobReferences.length);
          }
        } catch (e) {
          console.error("Error fetching jobs:", e);
        }
      };
      fetchJobs();
    }, [user?.token]);

    useEffect(() => {
      const fetchDonations = async () => {
        if (!user?.token) return;
        try {
          const res = await fetch(`${API_BASE}/api/payments/my`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          const data = await res.json();
          if (res.ok && data.success && data.payments) {
            setRecentDonations(data.payments.slice(0, 2));
          }
        } catch (e) {
          console.error("Error fetching donations:", e);
        }
      };
      fetchDonations();
    }, [user?.token]);
  
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
              <div 
                className={styles.userInfo}
                onClick={() => navigate('/alumini/profile')}
                title="Go to Profile"
              >
                  <div className={`${styles.userDetails} ${styles.hideOnLarge}`}>
                    <p className={styles.userName}>{alumniName || 'Alumni'}</p>
                    <p className={styles.userClass}>{batchLabel || 'Batch information'}</p>
                  </div>
                <div className={styles.userAvatar}>
                  <img
                    alt="User profile"
                    className={styles.imageFullCover}
                    src={profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(alumniName || 'Profile')}&background=random`}
                    onError={() => setProfilePhotoUrl(null)}
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
                  {mailCount > 0 && <span className={`${styles.badge} ${styles.badgeNew}`}>{mailCount} New</span>}
                </div>
                <h3 className={styles.cardTitle}>Latest Messages</h3>
                <div className={styles.cardContent}>
                  {recentMails.length > 0 ? (
                    recentMails.map((mail, idx) => {
                      const label = mail.isBroadcast ? (mail.senderLabel || deriveSenderLabel(mail.senderName)) : mail.senderName;
                      const labelClass = label.toLowerCase().includes('career') ? styles.messageLabelCareer : styles.messageLabelAdmin;
                      
                      return (
                        <div key={idx} className={styles.messageItem} onClick={() => handleViewMail(mail)}>
                          <p className={`${styles.messageLabel} ${labelClass}`}>{label}</p>
                          <p className={styles.messageText}>{mail.title || mail.content || 'No Subject'}</p>
                          <p className={styles.messageTime}>{timeAgo(mail.createdAt)}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className={styles.messageItem}>
                      <p className={styles.messageText}>No recent messages</p>
                    </div>
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
                  <span className={styles.badgeInfo}>{jobCount} active postings</span>
                </div>
                <h3 className={styles.cardTitle}>Career Hub</h3>
                <div className={styles.cardContent}>
                  {recentJobs.length > 0 ? (
                    recentJobs.map((job, idx) => (
                      <div 
                        key={idx}
                        className={styles.careerItem} 
                        onClick={() => navigate(`/alumini/JobReference_History/view/${job._id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div>
                          <p className={styles.careerTitle}>{job.role}</p>
                          <p className={styles.careerSubtitle}>{job.companyName}</p>
                        </div>
                        <span className={`material-symbols-outlined ${styles.iconPrimaryXl}`}>arrow_forward</span>
                      </div>
                    ))
                  ) : (
                    <div className={styles.careerItem}>
                      <p className={styles.careerTitle}>No active postings</p>
                    </div>
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
                    {recentDonations.length > 0 ? (
                      recentDonations.map((donation, idx) => {
                        const d = new Date(donation.createdAt);
                        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const amountStr = `₹${donation.amount.toLocaleString('en-IN')}`;
                        return (
                          <Link 
                            key={idx} 
                            className={styles.contributionItem}
                            to={`/alumini/donation_history/view/${donation._id}`}
                            style={{ textDecoration: 'none' }}
                          >
                            <span className={styles.contributionDate}>{dateStr}</span>
                            <span className={styles.contributionAmount}>{amountStr}</span>
                          </Link>
                        );
                      })
                    ) : (
                      <div className={styles.contributionItem}>
                        <span className={styles.contributionDate}>No recent contributions</span>
                      </div>
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
                <h3 className={styles.cardTitleSmall}>Grand Reunion 2024</h3>
                <p className={styles.eventDescription}>Join us for an evening of nostalgia and networking as we celebrate 40 years of excellence.</p>
                <div className={styles.eventLocation}>
                  <span className={`material-symbols-outlined ${styles.eventLocationIcon}`}>location_on</span>
                  <span className={styles.eventLocationText}>Main Campus Auditorium</span>
                </div>
                <div className={styles.eventCountdown}>
                  <div className={styles.countdownBox}>
                    <p className={styles.countdownNumber}>14</p>
                    <p className={styles.countdownLabel}>Days</p>
                  </div>
                  <div className={styles.countdownBox}>
                    <p className={styles.countdownNumber}>08</p>
                    <p className={styles.countdownLabel}>Hrs</p>
                  </div>
                </div>
                <button className={`${styles.buttonBase} ${styles.buttonDark}`} onClick={() => navigate('/alumini/event_reunion')} >RSVP Today</button>
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
                  <div className={styles.newsCard}>
                    <p className={styles.newsDate}>Oct 24, 2023</p>
                    <h4 className={styles.newsTitle}>Startup center secures ₹5Cr Funding</h4>
                    <p className={styles.newsDescription}>Major grant to boost innovation hub, benefiting 50+ student startups.</p>
                    <a className={styles.newsLink} href="#">
                      Read More <span className={`material-symbols-outlined ${styles.newsLinkIcon}`}>arrow_forward_ios</span>
                    </a>
                  </div>
                  <div className={styles.newsCard}>
                    <p className={styles.newsDate}>Oct 22, 2023</p>
                    <h4 className={styles.newsTitle}>Dr. Arul wins "Outstanding Researcher"</h4>
                    <p className={styles.newsDescription}>Honored for breakthrough contributions in Renewable Energy Systems.</p>
                    <a className={styles.newsLink} href="#">
                      Read More <span className={`material-symbols-outlined ${styles.newsLinkIcon}`}>arrow_forward_ios</span>
                    </a>
                  </div>
                  <div className={styles.newsCard}>
                    <p className={styles.newsDate}>Oct 20, 2023</p>
                    <h4 className={styles.newsTitle}>New Industry Partnership with Tech Corp</h4>
                    <p className={styles.newsDescription}>MoU signed for internship programs and specialized training modules.</p>
                    <a className={styles.newsLink} href="#">
                      Read More <span className={`material-symbols-outlined ${styles.newsLinkIcon}`}>arrow_forward_ios</span>
                    </a>
                  </div>
                  <div className={styles.newsCard}>
                    <p className={styles.newsDate}>Oct 18, 2023</p>
                    <h4 className={styles.newsTitle}>Alumni Sports Meet Registration Open</h4>
                    <p className={styles.newsDescription}>Join the annual football and cricket tournament at the campus grounds.</p>
                    <a className={styles.newsLink} href="#">
                      Read More <span className={`material-symbols-outlined ${styles.newsLinkIcon}`}>arrow_forward_ios</span>
                    </a>
                  </div>
                </div>
              </div>

            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
