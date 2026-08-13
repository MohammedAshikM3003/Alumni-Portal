import { useState, useEffect, FC } from 'react';
import { useParams } from 'react-router-dom';
import styles from './Co_View_Invitation.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from './Components/BackButton/Back';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

interface Department {
  branch: string;
  deptCode: string;
}

interface Event {
  _id: string;
  eventName: string;
  eventDate: string;
  eventDay: string;
  eventTime: string;
  venue: string;
  status: 'pending' | 'completed' | 'cancelled';
  organizer: Department;
  coOrganizers: Department[];
  photos: string[];
}

interface PhotoGroup {
  type: 'trio' | 'pair' | 'single';
  images: string[];
}

interface CoordinatorViewInvitationProps {
  onLogout: () => void;
}

const CoordinatorViewInvitation: FC<CoordinatorViewInvitationProps> = ({ onLogout }) => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([]);
  const [invitation, setInvitation] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Fetch event details
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async (): Promise<void> => {
      if (!user?.token) {
        setError('Please login to view event details');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/events/${id}`, {
            signal: controller.signal,
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await response.json();

        if (data.success && data.event) {
          setEvent(data.event);
          
          // Fetch matching invitation
          try {
            const invRes = await fetch(`${API_BASE}/api/invitations/all`, {
              signal: controller.signal,
              headers: { Authorization: `Bearer ${user.token}` },
            });
            const invData = await invRes.json();
            if (invData.success && Array.isArray(invData.invitations)) {
              const matching = invData.invitations.find(
                (inv: any) => inv.subject?.toLowerCase() === data.event.eventName?.toLowerCase()
              );
              if (matching) {
                setInvitation(matching);
              }
            }
          } catch (invErr) {
            console.error('Failed to load matching invitation details:', invErr);
          }
        } else {
          setError('Event not found');
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();

    return () => controller.abort();
  }, [id, user]);

  // Group photos for display
  useEffect(() => {
    if (event?.photos?.length && event.photos.length > 0) {
      const photos = event.photos;
      const groups: PhotoGroup[] = [];
      const imagesPerRow = 3;

      for (let i = 0; i < photos.length; i += imagesPerRow) {
        const rowImages = photos.slice(i, i + imagesPerRow);
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
  }, [event]);

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'Events_and_Reunions'} />
        <main className={styles.mainContent}>
          <div className={styles.loadingState}>Loading event details...</div>
        </main>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'Events_and_Reunions'} />
        <main className={styles.mainContent}>
          <div className="sticky top-0 bg-[#F8FAFC] px-8 pt-6 pb-2 z-10 border-b border-slate-200">
            <Back to={'/coordinator/invitations'} />
          </div>
          <div className={styles.errorState}>{error || 'Event not found'}</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Sidebar onLogout={onLogout} currentView={'Events_and_Reunions'} />

      <main className={styles.mainContent}>
        {/* Back Button */}
        <div className="sticky top-0 bg-[#F8FAFC] px-8 pt-6 pb-2 z-10 border-b border-slate-200">
          <Back to={'/coordinator/invitations'} />
        </div>

        <div className={styles.contentWrapper}>
          {/* Header */}
          <header className={styles.headerSection}>
            <div className={styles.headerContent}>
              <span className={`${styles.statusBadge} ${styles[`status${event.status.charAt(0).toUpperCase() + event.status.slice(1)}`]}`}>
                {event.status}
              </span>
              <h1 className={styles.mainTitle}>{event.eventName}</h1>
            </div>
          </header>

          {/* Details Card */}
          <div className={styles.formCard}>
            <div className={styles.form}>
              {/* Event Name */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Event Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={event.eventName}
                  disabled
                />
              </div>

              {/* Date and Day */}
              <div className={styles.rowGroup}>
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Event Date</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={new Date(event.eventDate).toLocaleDateString()}
                    disabled
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Day</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={event.eventDay}
                    disabled
                  />
                </div>
              </div>

              {/* Time and Venue */}
              <div className={styles.rowGroup}>
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Event Time</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={event.eventTime}
                    disabled
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Venue</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={event.venue}
                    disabled
                  />
                </div>
              </div>

              {/* Organizer */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Organizer (Department)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={`${event.organizer?.branch} (${event.organizer?.deptCode})`}
                  disabled
                />
              </div>

              {/* Co-Organizers */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Co-Organizers</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={event.coOrganizers?.map(co => `${co.branch} (${co.deptCode})`).join(', ') || 'None'}
                  disabled
                />
              </div>

              {/* Status */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Status</label>
                <div className={styles.statusDisplay}>
                  <span className={`${styles.statusBadgeLarge} ${styles[`status${event.status.charAt(0).toUpperCase() + event.status.slice(1)}`]}`}>
                    {event.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Invitation Details Section */}
          {invitation && (
            <div className={styles.photosSection} style={{ marginTop: '2rem' }}>
              <div className={styles.photosSectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <span className="material-symbols-outlined">mail</span>
                  Sent Invitation Details
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <div>
                  {invitation.flyer ? (
                    <img
                      src={`${API_BASE}/api/invitations/image/${invitation.flyer}`}
                      alt="Sent Flyer"
                      style={{ width: '100%', borderRadius: '8px', objectFit: 'contain', border: '1px solid #E5E7EB' }}
                    />
                  ) : (
                    <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '2px dashed #E5E7EB', color: '#9CA3AF' }}>
                      No flyer image sent
                    </div>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Subject</p>
                  <p style={{ fontSize: '1.05rem', color: '#111827', marginBottom: '1.5rem', fontWeight: 500 }}>{invitation.subject}</p>
                  
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Description / Message</p>
                  <p style={{ fontSize: '0.95rem', color: '#4B5563', whiteSpace: 'pre-line', lineHeight: '1.5' }}>{invitation.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Event Photos Section */}
          {event.status === 'completed' && (
            <div className={styles.photosSection}>
              <div className={styles.photosSectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <span className="material-symbols-outlined">photo_library</span>
                  Event Photos
                </h2>
              </div>

              {event.photos && event.photos.length > 0 ? (
                <div className={styles.photosContainer}>
                  {photoGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className={`${styles.photoGroup} ${styles[group.type]}`}>
                      {group.images.map((photoId) => (
                        <div key={photoId} className={styles.photoItem} onClick={() => setSelectedPhoto(photoId)}>
                          <img
                            src={`${API_BASE}/api/images/${photoId}`}
                            alt="Event photo"
                            className={styles.photoImage}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noPhotos}>
                  <span className="material-symbols-outlined">photo_camera</span>
                  <p>No photos uploaded yet for this event.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Event Photo Preview Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -top-12 right-0 text-white hover:text-red-500 transition-colors p-2 font-bold text-xl flex items-center gap-1 bg-black/50 rounded-full"
              onClick={() => setSelectedPhoto(null)}
              title="Close"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
            <img
              src={`${API_BASE}/api/images/${selectedPhoto}`}
              alt="Event photo full preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorViewInvitation;
