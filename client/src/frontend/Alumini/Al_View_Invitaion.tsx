import { useState, useEffect } from 'react';
import styles from './Al_View_Invitation.module.css';
import './scrollbar.js';
import Sidebar from './Components/Sidebar/Sidebar';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface AluminiViewInvitationProps {
  onLogout?: () => void;
}

const Alumini_View_Invitation = ({ onLogout }: AluminiViewInvitationProps) => {
  const location = useLocation();
  const { invitation } = (location.state as { invitation?: any }) || {};
  const { user } = useAuth();

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

  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [photoGroups, setPhotoGroups] = useState<any[]>([]);

  useEffect(() => {
    if (!invitation || !user?.token) return;

    const fetchMatchingEvent = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/events`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const match = data.data.find(
            (e: any) => e.eventName?.toLowerCase() === invitation.subject?.toLowerCase()
          );
          if (match) {
            setEvent(match);
            
            // Group photos if present
            if (match.photos && match.photos.length > 0) {
              const groups = [];
              const imagesPerRow = 3;
              for (let i = 0; i < match.photos.length; i += imagesPerRow) {
                const rowImages = match.photos.slice(i, i + imagesPerRow);
                if (rowImages.length === 3) {
                  groups.push({ type: 'trio', images: rowImages });
                } else if (rowImages.length === 2) {
                  groups.push({ type: 'pair', images: rowImages });
                } else {
                  groups.push({ type: 'single', images: rowImages });
                }
              }
              setPhotoGroups(groups);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch event photos:', err);
      }
    };

    fetchMatchingEvent();
  }, [invitation, user]);


  useEffect(() => {
    if (!invitation) return;

    const calculateTimeLeft = () => {
      const eventDate = new Date(invitation.eventDate);
      const timeStr = invitation.eventTime || '00:00';
      const parts = timeStr.split(':');
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1] || '0', 10);
      
      if (!isNaN(hours)) {
        eventDate.setHours(hours, minutes, 0, 0);
      }

      const difference = eventDate.getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [invitation]);



  const getGoogleCalendarUrl = () => {
    if (!invitation) return '#';
    try {
      const timeStr = invitation.eventTime || '00:00';
      const parts = timeStr.split(':');
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1] || '0', 10);
      
      const start = new Date(invitation.eventDate);
      if (!isNaN(hours)) {
        start.setHours(hours, minutes);
      }
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 Hours default

      const formatDateStr = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
      const title = encodeURIComponent(invitation.subject);
      const details = encodeURIComponent(invitation.description || '');
      const location = encodeURIComponent(invitation.venue);
      const dates = `${formatDateStr(start)}/${formatDateStr(end)}`;
      
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
    } catch {
      return '#';
    }
  };

  if (!invitation) {
    return (
      <div className={styles.pageContainer}>
        {/* Sidebar Navigation */}
        <Sidebar onLogout={onLogout} currentView="event_reunion" />

        {/* Main Content Area */}
        <main className={styles.mainContent}>
          {/* Navigation Back */}
          <div className={styles.backButton} onClick={() => window.history.back()}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </div>
          <div className={styles.emptyState} style={{ marginTop: '2rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#9CA3AF', marginBottom: '16px', display: 'block' }}>
              error
            </span>
            <p>No invitation details available.</p>
          </div>
        </main>
      </div>
    );
  }

  const isUpcoming = new Date(invitation.eventDate).getTime() >= new Date().setHours(0,0,0,0);
  const badgeText = isUpcoming ? 'UPCOMING EVENT' : 'PAST EVENT';

  return (
    <div className={styles.pageContainer}>
      {/* Sidebar Navigation */}
      <Sidebar onLogout={onLogout} currentView="event_reunion" />

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Navigation Back */}
        <div className={styles.backButton} onClick={() => window.history.back()}>
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back</span>
        </div>

        {/* Event Details Wrapper */}
        <div className={styles.eventContainer}>
          
          {/* Left Panel: Event Poster */}
          <div className={styles.eventPoster}>
            {invitation.flyer ? (
              <img
                src={`${API_BASE}/api/images/${invitation.flyer}`}
                alt="Event Flyer"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
              />
            ) : (
              <>
                {/* Decorative background shapes */}
                <div className={styles.circleTop}></div>
                <div className={styles.circleBottom}></div>
                
                <div className={styles.posterContent}>
                  <div className={styles.iconContainer}>
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </div>
                  <h2 className={styles.posterTitle} style={{ fontSize: '1.25rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {invitation.subject.toUpperCase()}
                  </h2>
                  <hr className={styles.divider} />
                  <p className={styles.posterDate}>{formatTime(invitation.eventDate)}</p>
                  <p className={styles.posterLocation}>{invitation.venue}</p>
                </div>
                
                <div className={styles.posterFooter} style={{ fontSize: '0.8rem', padding: '0 1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {invitation.sender}
                </div>
              </>
            )}
          </div>

          {/* Right Panel: Event Information */}
          <div className={styles.eventInfo}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <span className={styles.badge} style={{ backgroundColor: isUpcoming ? '#ede9fe' : '#F1F5F9', color: isUpcoming ? '#6d28d9' : '#475569', marginBottom: 0 }}>
                {badgeText}
              </span>
              {isUpcoming && (
                <a href={getGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer" className={styles.calendarBtn} style={{ marginTop: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_add_on</span>
                  <span>Add to Calendar</span>
                </a>
              )}
            </div>
            
            <h1 className={styles.eventTitle} style={{ marginBottom: '24px' }}>{invitation.subject}</h1>

            {/* Countdown Box */}
            {isUpcoming && timeLeft && (
              <div className={styles.countdownContainer}>
                <div className={styles.countdownBlock}>
                  <span className={styles.countdownNumber}>{timeLeft.days}</span>
                  <span className={styles.countdownLabel}>Days</span>
                </div>
                <div className={styles.countdownBlock}>
                  <span className={styles.countdownNumber}>{timeLeft.hours}</span>
                  <span className={styles.countdownLabel}>Hours</span>
                </div>
                <div className={styles.countdownBlock}>
                  <span className={styles.countdownNumber}>{timeLeft.minutes}</span>
                  <span className={styles.countdownLabel}>Mins</span>
                </div>
                <div className={styles.countdownBlock}>
                  <span className={styles.countdownNumber}>{timeLeft.seconds}</span>
                  <span className={styles.countdownLabel}>Secs</span>
                </div>
              </div>
            )}
            
            <div className={styles.infoStrip} style={{ marginBottom: '32px' }}>
              <div className={styles.infoBlock}>
                <div className={styles.infoIcon}>
                  <span className="material-symbols-outlined">calendar_today</span>
                </div>
                <div>
                  <p className={styles.infoLabel}>DATE</p>
                  <p className={styles.infoValue}>{formatTime(invitation.eventDate)}</p>
                </div>
              </div>
              
              <div className={styles.infoBlock}>
                <div className={styles.infoIcon}>
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <div>
                  <p className={styles.infoLabel}>TIME</p>
                  <p className={styles.infoValue}>{invitation.eventTime}</p>
                </div>
              </div>
              
              <div className={styles.infoBlock}>
                <div className={styles.infoIcon}>
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div>
                  <p className={styles.infoLabel}>LOCATION</p>
                  <p className={styles.infoValue}>{invitation.venue}</p>
                </div>
              </div>
            </div>

            <div className={styles.aboutSection}>
              <h3>About the Event</h3>
              <p className={styles.senderName} style={{ fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>
                Hosted by: {invitation.sender}
              </p>
              <p style={{ whiteSpace: 'pre-line' }}>{invitation.description}</p>
            </div>



            {/* Guidelines / Venue Details Grid */}
            <div className={styles.guidelinesGrid}>
              <div className={styles.guidelineCard}>
                <div className={styles.guidelineIcon}>
                  <span className="material-symbols-outlined">dry_cleaning</span>
                </div>
                <div className={styles.guidelineContent}>
                  <h5 className={styles.guidelineTitle}>Dress Code</h5>
                  <p className={styles.guidelineDesc}>Smart Casual / Business Formal</p>
                </div>
              </div>
              <div className={styles.guidelineCard}>
                <div className={styles.guidelineIcon}>
                  <span className="material-symbols-outlined">qr_code</span>
                </div>
                <div className={styles.guidelineContent}>
                  <h5 className={styles.guidelineTitle}>Check-in</h5>
                  <p className={styles.guidelineDesc}>Show digital invitation at gate</p>
                </div>
              </div>
              <div className={styles.guidelineCard}>
                <div className={styles.guidelineIcon}>
                  <span className="material-symbols-outlined">directions_car</span>
                </div>
                <div className={styles.guidelineContent}>
                  <h5 className={styles.guidelineTitle}>Parking</h5>
                  <p className={styles.guidelineDesc}>Free guest parking at Main Campus</p>
                </div>
              </div>
              <div className={styles.guidelineCard}>
                <div className={styles.guidelineIcon}>
                  <span className="material-symbols-outlined">contact_support</span>
                </div>
                <div className={styles.guidelineContent}>
                  <h5 className={styles.guidelineTitle}>Queries</h5>
                  <p className={styles.guidelineDesc}>Contact: alumni@ksrce.ac.in</p>
                </div>
              </div>
            </div>

            {/* Event Photos Section */}
            {event && event.status === 'completed' && (
              <div className={styles.photosSection} style={{ marginTop: '32px' }}>
                <div className={styles.photosSectionHeader} style={{ marginBottom: '16px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>
                    <span className="material-symbols-outlined">photo_library</span>
                    Event Photos & Memories
                  </h4>
                </div>

                {event.photos && event.photos.length > 0 ? (
                  <div className={styles.photosContainer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                     {photoGroups.map((group, groupIndex) => (
                       <div key={groupIndex} className={`${styles.photoGroup} ${styles[group.type]}`} style={{ display: 'grid', gridTemplateColumns: group.type === 'trio' ? '1fr 1fr 1fr' : group.type === 'pair' ? '1fr 1fr' : '1fr', gap: '16px' }}>
                         {group.images.map((photoId: string) => (
                           <div key={photoId} className={styles.photoItem} style={{ overflow: 'hidden', borderRadius: '12px', aspectRatio: '16/10', border: '1px solid #E5E7EB' }}>
                             <img
                               src={`${API_BASE}/api/images/${photoId}`}
                               alt="Event photo"
                               className={styles.photoImage}
                               style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                             />
                           </div>
                         ))}
                       </div>
                     ))}
                  </div>
                ) : (
                  <div className={styles.noPhotos} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '2px dashed #E2E8F0', color: '#6B7280' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '36px', marginBottom: '8px' }}>photo_camera</span>
                    <p style={{ margin: 0, fontSize: '14px' }}>No photos uploaded yet for this event.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default Alumini_View_Invitation;