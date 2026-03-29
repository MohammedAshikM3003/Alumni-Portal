import styles from './AD_Event_and_Reunion_Flyer.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { DateInput, TimeInput } from '../../components/Calendar';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const Admin_Event_and_Reunion_Form2 = ( { onLogout } ) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canvasRef = useRef(null);

  // Receive data from navigation state (mail data)
  const {
    eventName: initialEventName = '',
    alumniName = '',
    mailId,
    mailData,
    eventDate: initialEventDate = '',
    eventTime: initialEventTime = '',
    eventLocation: initialEventLocation = '',
    recipientEmails = [],
    recipients = []
  } = location.state || {};

  // Multi-guest state
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [guestCreationMode, setGuestCreationMode] = useState('single'); // 'single' or 'multiple'
  const [guests, setGuests] = useState([]);
  const [currentGuestIndex, setCurrentGuestIndex] = useState(0);

  // Canvas Flyer state
  const [eventName, setEventName] = useState(initialEventName);
  const [eventDate, setEventDate] = useState(initialEventDate || new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState(initialEventTime || new Date().toTimeString().slice(0, 5));
  const [eventLocation, setEventLocation] = useState(initialEventLocation);
  const [eventDesc, setEventDesc] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  // Canvas Flyer Preview state
  const [flyerGenerated, setFlyerGenerated] = useState(false);
  const [flyerBlob, setFlyerBlob] = useState(null);
  const [flyerPreviewUrl, setFlyerPreviewUrl] = useState(null);
  const [sending, setSending] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

  // Gemini Flyer state
  const [geminiTemplate, setGeminiTemplate] = useState(null);
  const [geminiTemplatePreview, setGeminiTemplatePreview] = useState(null);
  const [geminiEventName, setGeminiEventName] = useState('');
  const [geminiGuestName, setGeminiGuestName] = useState('');
  const [geminiGuestImage, setGeminiGuestImage] = useState('');
  const [geminiDate, setGeminiDate] = useState(new Date().toISOString().split('T')[0]);
  const [geminiVenue, setGeminiVenue] = useState('');
  const [geminiHostedBy, setGeminiHostedBy] = useState('K.S.R. College of Engineering');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiPreviewUrl, setGeminiPreviewUrl] = useState(null);
  const [geminiError, setGeminiError] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Initialize guests from mail data on mount
  useEffect(() => {
    // Fetch events for dropdown
    fetchEvents();

    if (recipients && recipients.length > 0) {
      setGuests(recipients);
      // Multiple guests: No auto-populate, show dialog
      if (recipients.length > 1) {
        setShowGuestDialog(true);
      } else {
        // Single guest: Auto-populate from mail
        const singleGuest = recipients[0];
        setGeminiEventName(initialEventName);
        setGeminiDate(initialEventDate || new Date().toISOString().split('T')[0]);
        setGeminiVenue(initialEventLocation);
        setGeminiGuestName(singleGuest?.name || '');
        // Format guest image URL properly
        if (singleGuest?.profilePhoto) {
          const photoUrl = singleGuest.profilePhoto.startsWith('http') || singleGuest.profilePhoto.startsWith('/api')
            ? singleGuest.profilePhoto
            : `${API_BASE}${singleGuest.profilePhoto}`;
          setGeminiGuestImage(photoUrl);
        }
      }
    } else if (alumniName) {
      // Legacy single guest from alumniName
      setGuests([{ name: alumniName, email: recipientEmails[0] || '' }]);
      setGeminiEventName(initialEventName);
      setGeminiDate(initialEventDate || new Date().toISOString().split('T')[0]);
      setGeminiVenue(initialEventLocation);
      setGeminiGuestName(alumniName);
    }
  }, []);

  // Fetch events from collection
  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const res = await fetch(`${API_BASE}/api/events`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setEvents(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  // Handle event selection from dropdown
  const handleEventSelect = (eventId) => {
    const selectedEvent = events.find(e => e._id === eventId);
    if (selectedEvent) {
      setGeminiEventName(selectedEvent.eventName);
      // Convert Date to YYYY-MM-DD format
      const eventDate = new Date(selectedEvent.eventDate);
      const dateStr = eventDate.toISOString().split('T')[0];
      setGeminiDate(dateStr);
      setGeminiVenue(selectedEvent.venue);
      // Time might need formatting
      if (selectedEvent.eventTime) {
        setGeminiHostedBy(selectedEvent.organizer?.name || 'K.S.R. College of Engineering');
      }
    }
  };

  // Handle banner upload
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setBannerPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Format time for display on flyer
  const formatTimeForFlyer = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
  };

  // Format date for display on flyer
  const formatDateForFlyer = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Text wrapping helper
  const wrapText = (ctx, text, maxWidth, fontSize) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Handle "Generate via Description" form submit — enhance text using Ollama
  const handleDescGenerate = async (e) => {
    e.preventDefault();
    if (!eventDesc.trim()) {
      alert('Please enter a description to enhance');
      return;
    }

    setEnhancing(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/enhance-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ text: eventDesc }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enhance text');

      setEventDesc(data.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setEnhancing(false);
    }
  };

  // Send invitation — store flyer image in MongoDB via GridFS
  const handleSendInvitation = async () => {
    if (!flyerBlob) {
      alert('Please generate a flyer first');
      return;
    }
    if (!eventLocation.trim()) {
      alert('Please enter an event location');
      return;
    }
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('flyer', flyerBlob, 'invitation_flyer.png');
      formData.append('sender', alumniName || 'K.S.R. College of Engineering');
      formData.append('subject', eventName || 'Alumni Event');
      formData.append('eventDate', eventDate);
      formData.append('eventTime', eventTime);
      formData.append('venue', eventLocation);
      formData.append('description', eventDesc || `You are cordially invited to ${eventName || 'our event'}. Join us for this special occasion.`);

      const res = await fetch(`${API_BASE}/api/invitations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send invitation');

      alert('Invitation sent successfully!');
      navigate('/admin/event_and_reunion_history');
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  // Gemini Flyer Handlers
  const handleGeminiTemplateChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      setGeminiTemplate(file);
      const reader = new FileReader();
      reader.onload = (ev) => setGeminiTemplatePreview(ev.target.result);
      reader.readAsDataURL(file);
      setGeminiError(null);
    }
  };

  // Auto-populate Gemini form from canvas form
  const handlePopulateFromCanvas = () => {
    // Only auto-populate if single guest
    if (guests.length > 1) {
      setGeminiError('For multiple guests, please enter details manually or select from Events dropdown');
      return;
    }

    setGeminiEventName(eventName);
    setGeminiDate(eventDate);
    setGeminiVenue(eventLocation);
    if (bannerFile) {
      setGeminiTemplate(bannerFile);
      setGeminiTemplatePreview(bannerPreview);
    }
    // Populate with current guest
    if (guests.length > 0) {
      const currentGuest = guests[currentGuestIndex] || guests[0];
      setGeminiGuestName(currentGuest.name || '');
      setGeminiGuestImage(currentGuest.profilePhoto || '');
    }
  };

  // Handle guest creation mode selection
  const handleGuestModeSelection = (mode) => {
    setGuestCreationMode(mode);
    setShowGuestDialog(false);
    if (mode === 'single' && guests.length > 0) {
      const firstGuest = guests[0];
      setGeminiGuestName(firstGuest.name || '');
      // Format guest image URL properly
      if (firstGuest.profilePhoto) {
        const photoUrl = firstGuest.profilePhoto.startsWith('http') || firstGuest.profilePhoto.startsWith('/api')
          ? firstGuest.profilePhoto
          : `${API_BASE}${firstGuest.profilePhoto}`;
        setGeminiGuestImage(photoUrl);
      }
    }
  };

  const handleGenerateGeminiFlyer = async (e) => {
    e.preventDefault();

    if (!geminiEventName.trim()) {
      setGeminiError('Event name is required');
      return;
    }
    if (!geminiGuestName.trim()) {
      setGeminiError('Guest name is required');
      return;
    }
    if (!geminiTemplate) {
      setGeminiError('Please upload a template image');
      return;
    }

    setGeminiLoading(true);
    setGeminiError(null);

    try {
      const formData = new FormData();
      formData.append('template', geminiTemplate);
      formData.append('eventName', geminiEventName.trim());
      formData.append('guestName', geminiGuestName.trim());
      formData.append('guestImage', geminiGuestImage.trim());
      formData.append('organizer', geminiHostedBy.trim());
      formData.append('date', geminiDate);
      formData.append('venue', geminiVenue.trim());
      formData.append('hostedBy', geminiHostedBy.trim());
      formData.append('eventDescription', eventDesc.trim());

      const res = await fetch(`${API_BASE}/api/flyers/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to generate flyer');
      }

      // Use image URL from API endpoint
      const imageUrl = `${API_BASE}/api/flyers/image/${data.data.imageId}`;
      setGeminiPreviewUrl(imageUrl);
    } catch (err) {
      setGeminiError(err.message);
      console.error('Gemini flyer generation error:', err);
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleDownloadGeminiFlyer = async () => {
    if (!geminiPreviewUrl) return;

    try {
      const res = await fetch(geminiPreviewUrl);
      if (!res.ok) throw new Error('Failed to download flyer');

      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${geminiEventName || 'flyer'}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      setGeminiError('Failed to download flyer');
      console.error('Download error:', err);
    }
  };

  const handleRegenerateGeminiFlyer = (e) => {
    e.preventDefault();
    handleGenerateGeminiFlyer(e);
  };

  return (
    <div className={styles.pageContainer}>

      {/* Sidebar */}
      <Sidebar onLogout={onLogout} currentView={'mail'} />

      {/* Guest Selection Modal */}
      {showGuestDialog && guests.length > 1 && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0, color: '#111827', fontSize: '1.25rem' }}>Multiple Recipients Detected</h2>
            <p style={{ color: '#6B7280' }}>
              You have {guests.length} guests/recipients. How would you like to create flyers?
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => handleGuestModeSelection('single')}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#2E6F40',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                🎯 Separate Flyer for Each
              </button>
              <button
                onClick={() => handleGuestModeSelection('multiple')}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#16A34A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                👥 One Flyer with All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for flyer generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Main Content */}
      <main className={styles.mainContent}>
          {/* Back Button */}
          <div className={styles.backButton} onClick={() => navigate('/admin/mail/view_mail', { state: { mailId, mailData } })} >
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Back</span>
          </div>
        
        {/* Header */}
        <header className={styles.pageHeader}>
          <div>
            <h2 className={styles.pageTitle}>Invitation Creator</h2>
            <p className={styles.pageSubtitle}>Generate professional event flyers for alumni engagement.</p>
          </div>
          
          <div className={styles.headerActions}>
            <button className={styles.notificationBtn}>
              <span className="material-symbols-outlined">notifications</span>
              <span className={styles.notificationDot}></span>
            </button>
            <button className={styles.profileBtn}>
              <div className={styles.profileAvatar}>
                <span className="material-symbols-outlined">person</span>
              </div>
            </button>
          </div>
        </header>



        {/* Workspace Area */}
        <div className={styles.workspaceWrapper}>
          <div className={styles.workspaceGrid}>
            
            {/* Left Column: Form Controls (Scrollable) */}
            <div className={styles.controlsCol}>
              {/* Upload Banner Section */}
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className="material-symbols-outlined">upload_file</span>
                  <h3>College Banner / Header</h3>
                </div>
                <div className={styles.uploadArea}>
                  <input type="file" accept="image/*" className={styles.hiddenFileInput} id="banner-upload" onChange={handleBannerChange} />
                  <div className={styles.uploadBox}>
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="Banner" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px' }} />
                    ) : (
                      <>
                        <div className={styles.uploadIconWrapper}>
                          <span className="material-symbols-outlined">cloud_upload</span>
                        </div>
                        <p className={styles.uploadTitle}>Click to Upload or Drag & Drop</p>
                        <p className={styles.uploadSubtitle}>PNG, JPG or JPEG (Max 5MB)</p>
                        <p className={styles.uploadHint}>High-resolution banner recommended</p>
                      </>
                    )}
                  </div>
                </div>
              </section>

              {/* Generate via Description */}
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <h3>Generate via Description</h3>
                </div>
                <form className={styles.formGroup}>
                  <div className={styles.inputWrapper}>
                    <label htmlFor="event-desc" className={styles.inputLabel}>Event Description</label>
                    <textarea 
                      id="event-desc" 
                      className={styles.textareaCustom} 
                      rows="6" 
                      placeholder="Describe your event in detail (e.g., A networking brunch for 2015 graduates featuring industry speakers at the Grand Hall...)"
                      value={eventDesc}
                      onChange={(e) => setEventDesc(e.target.value)}
                    ></textarea>
                  </div>
                  <button onClick={handleDescGenerate} className={styles.generateBtn} disabled={enhancing}>
                  <span className="material-symbols-outlined">auto_awesome</span>
                    <span>{enhancing ? 'Enhancing...' : 'Enhance Text'}</span>
                  </button>
                </form>
              </section>              

              {/* Gemini Flyer Generation Section */}
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <h3>Generate from Template (Gemini)</h3>
                </div>

                {/* Template Upload */}
                <div className={styles.uploadArea}>
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.hiddenFileInput}
                    id="gemini-template-upload"
                    onChange={handleGeminiTemplateChange}
                  />
                  <div className={styles.uploadBox}>
                    {geminiTemplatePreview ? (
                      <img
                        src={geminiTemplatePreview}
                        alt="Template"
                        style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px' }}
                      />
                    ) : (
                      <>
                        <div className={styles.uploadIconWrapper}>
                          <span className="material-symbols-outlined">image</span>
                        </div>
                        <p className={styles.uploadTitle}>Upload Flyer Template</p>
                        <p className={styles.uploadSubtitle}>PNG, JPG or JPEG (Max 5MB)</p>
                        <p className={styles.uploadHint}>This template will be used as visual reference for AI</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Gemini Form */}
                <form className={styles.formGroup}>
                  {/* Multi-guest selector */}
                  {guests.length > 0 && guestCreationMode === 'single' && guests.length > 1 && (
                    <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#F0FDF4', borderRadius: '0.75rem', border: '1px solid #DCFCE7' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
                        Guest {currentGuestIndex + 1} of {guests.length}
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {guests.map((guest, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setCurrentGuestIndex(idx);
                              setGeminiGuestName(guest.name || '');
                              // Format guest image URL properly
                              if (guest.profilePhoto) {
                                const photoUrl = guest.profilePhoto.startsWith('http') || guest.profilePhoto.startsWith('/api')
                                  ? guest.profilePhoto
                                  : `${API_BASE}${guest.profilePhoto}`;
                                setGeminiGuestImage(photoUrl);
                              } else {
                                setGeminiGuestImage('');
                              }
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: currentGuestIndex === idx ? '#2E6F40' : '#E2E8F0',
                              color: currentGuestIndex === idx ? 'white' : '#374151',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: currentGuestIndex === idx ? 600 : 500
                            }}
                          >
                            {guest.name?.split(' ')[0] || `Guest ${idx + 1}`}
                          </button>
                        ))}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.5rem', marginBottom: 0 }}>
                        💡 Click to switch between guests and generate individual flyers
                      </p>
                    </div>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <button
                      type="button"
                      onClick={handlePopulateFromCanvas}
                      className={styles.generateBtn}
                      style={{ backgroundColor: '#16A34A', fontSize: '0.875rem' }}
                    >
                      <span className="material-symbols-outlined">content_paste</span>
                      <span>Populate from Canvas Form</span>
                    </button>
                  </div>

                  <div className={styles.detailsGrid}>
                    <div className={styles.fullWidth}>
                      <label htmlFor="gemini-event-name" className={styles.inputLabel}>Event Name (Select or Enter)</label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select
                          id="gemini-event-name"
                          className={styles.inputCustom}
                          value={geminiEventName}
                          onChange={(e) => handleEventSelect(e.target.value)}
                          style={{ flex: 1 }}
                        >
                          <option value="">-- Select from Events --</option>
                          {eventsLoading ? (
                            <option disabled>Loading events...</option>
                          ) : (
                            events.map((event) => (
                              <option key={event._id} value={event._id}>
                                {event.eventName}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <input
                        type="text"
                        className={styles.inputCustom}
                        placeholder="Or enter event name manually"
                        value={geminiEventName}
                        onChange={(e) => setGeminiEventName(e.target.value)}
                        style={{ marginTop: '0.5rem' }}
                      />
                    </div>
                    <div className={styles.fullWidth}>
                      <label htmlFor="gemini-guest-name" className={styles.inputLabel}>Chief Guest / Honoree</label>
                      <input
                        id="gemini-guest-name"
                        type="text"
                        className={styles.inputCustom}
                        placeholder="e.g. Dr. John Smith"
                        value={geminiGuestName}
                        onChange={(e) => setGeminiGuestName(e.target.value)}
                      />
                    </div>
                    <div className={styles.fullWidth}>
                      <label className={styles.inputLabel}>Guest Photo</label>
                      {geminiGuestImage ? (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          padding: '1rem',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '0.75rem',
                          border: '1px solid #E5E7EB'
                        }}>
                          <img
                            src={geminiGuestImage}
                            alt="Guest"
                            style={{
                              width: '120px',
                              height: '120px',
                              borderRadius: '12px',
                              objectFit: 'cover',
                              border: '3px solid var(--primary)',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: '2rem 1rem',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '0.75rem',
                          border: '2px dashed #D1D5DB',
                          color: '#9CA3AF',
                          fontSize: '0.875rem'
                        }}>
                          No photo available
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="gemini-date" className={styles.inputLabel}>Date</label>
                      <DateInput
                        theme="admin"
                        id="gemini-date"
                        className={styles.inputCustom}
                        value={geminiDate}
                        onChange={(e) => setGeminiDate(e.target.value)}
                        defaultToToday
                      />
                    </div>
                    <div>
                      <label htmlFor="gemini-venue" className={styles.inputLabel}>Venue</label>
                      <input
                        id="gemini-venue"
                        type="text"
                        className={styles.inputCustom}
                        placeholder="e.g. Grand Auditorium"
                        value={geminiVenue}
                        onChange={(e) => setGeminiVenue(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="gemini-hosted-by" className={styles.inputLabel}>Organizer (Department)</label>
                      <input
                        id="gemini-hosted-by"
                        type="text"
                        className={styles.inputCustom}
                        value={geminiHostedBy}
                        onChange={(e) => setGeminiHostedBy(e.target.value)}
                      />
                    </div>
                  </div>

                  {geminiError && (
                    <div className={styles.errorMessage}>
                      {geminiError}
                    </div>
                  )}

                  <button
                    onClick={handleGenerateGeminiFlyer}
                    className={styles.generateBtn}
                    disabled={geminiLoading}
                  >
                    <span className="material-symbols-outlined">magic_button</span>
                    <span>{geminiLoading ? 'Generating...' : 'Generate Flyer'}</span>
                  </button>
                </form>

                {/* Gemini Preview */}
                {geminiPreviewUrl && (
                  <div className={styles.geminiPreviewContainer}>
                    <div className={styles.geminiPreviewImage}>
                      <img
                        src={geminiPreviewUrl}
                        alt="Generated Flyer"
                      />
                    </div>
                    <div className={styles.geminiButtonGroup}>
                      <button
                        onClick={handleDownloadGeminiFlyer}
                        className={styles.generateBtn}
                      >
                        <span className="material-symbols-outlined">download</span>
                        <span>Download</span>
                      </button>
                      <button
                        onClick={handleRegenerateGeminiFlyer}
                        className={styles.generateBtn}
                        disabled={geminiLoading}
                      >
                        <span className="material-symbols-outlined">refresh</span>
                        <span>{geminiLoading ? 'Generating...' : 'Regenerate'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </section>

            </div>

            {/* Right Column: Flyer Preview */}
            <div className={styles.previewCol}>
              
              <div className={styles.previewBox}>
                {flyerGenerated && flyerPreviewUrl ? (
                  <img src={flyerPreviewUrl} alt="Flyer Preview" className={styles.flyerImage} />
                ) : (
                  <>
                    <div className={styles.previewPlaceholderIcon}>
                      <span className="material-symbols-outlined">image</span>
                    </div>
                    <h4 className={styles.previewTitle}>Flyer Preview</h4>
                    <p className={styles.previewSubtitle}>
                      Fill in the details or provide a description on the left to generate your professional alumni invitation flyer.
                    </p>
                    <div className={styles.loadingDots}>
                      <span></span><span></span><span></span>
                    </div>
                  </>
                )}
              </div>

              {/* Send Button Area */}
              <div className={styles.sendActionArea}>
                <button 
                  className={styles.sendBtn} 
                  onClick={handleSendInvitation} 
                  disabled={!flyerGenerated || sending}
                  style={{ opacity: (!flyerGenerated || sending) ? 0.6 : 1 }}
                >
                  <span>{sending ? 'Sending...' : 'Send Invitation'}</span>
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Admin_Event_and_Reunion_Form2;