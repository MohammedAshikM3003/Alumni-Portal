import styles from './AD_Event_and_Reunion_Form2.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { DateInput, TimeInput } from '../../components/Calendar';
import { useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const Admin_Event_and_Reunion_Form2 = ( { onLogout } ) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canvasRef = useRef(null);

  // Receive data from Form1
  const { eventName: initialEventName = '', alumniName = '' } = location.state || {};

  // Form state
  const [eventName, setEventName] = useState(initialEventName);
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState(new Date().toTimeString().slice(0, 5));
  const [eventLocation, setEventLocation] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  // Preview state
  const [flyerGenerated, setFlyerGenerated] = useState(false);
  const [flyerBlob, setFlyerBlob] = useState(null);
  const [flyerPreviewUrl, setFlyerPreviewUrl] = useState(null);
  const [sending, setSending] = useState(false);

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

  // Generate flyer on canvas
  const generateFlyer = useCallback((name, date, time, loc, desc) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = 800;
    const H = 1100;
    canvas.width = W;
    canvas.height = H;

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#F0FDF4');
    bgGrad.addColorStop(0.5, '#FFFFFF');
    bgGrad.addColorStop(1, '#ECFDF5');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Top accent bar
    const accentGrad = ctx.createLinearGradient(0, 0, W, 0);
    accentGrad.addColorStop(0, '#2E6F40');
    accentGrad.addColorStop(1, '#16A34A');
    ctx.fillStyle = accentGrad;
    ctx.fillRect(0, 0, W, 8);

    // College header
    ctx.fillStyle = '#2E6F40';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('K.S.R. COLLEGE OF ENGINEERING', W / 2, 60);
    ctx.fillStyle = '#6B7280';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('(AUTONOMOUS), TIRUCHENGODE – 637 215', W / 2, 82);
    ctx.fillText('DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING', W / 2, 100);

    // Divider
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 120);
    ctx.lineTo(W - 60, 120);
    ctx.stroke();

    // "YOU ARE INVITED" badge
    ctx.fillStyle = '#2E6F40';
    const badgeW = 280;
    const badgeH = 40;
    const badgeX = (W - badgeW) / 2;
    const badgeY = 145;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 20);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('✉  YOU ARE INVITED', W / 2, badgeY + 26);

    // Event name
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 40px Inter, sans-serif';
    const eventNameLines = wrapText(ctx, name || 'Alumni Event', W - 120, 40);
    let y = 230;
    eventNameLines.forEach(line => {
      ctx.fillText(line, W / 2, y);
      y += 48;
    });

    // Decorative line
    ctx.strokeStyle = '#2E6F40';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 60, y + 10);
    ctx.lineTo(W / 2 + 60, y + 10);
    ctx.stroke();
    y += 40;

    // Alumni name
    if (alumniName) {
      ctx.fillStyle = '#6B7280';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('Dear', W / 2, y);
      y += 28;
      ctx.fillStyle = '#2E6F40';
      ctx.font = 'bold 26px Inter, sans-serif';
      ctx.fillText(alumniName, W / 2, y);
      y += 45;
    }

    // Description
    if (desc) {
      ctx.fillStyle = '#4B5563';
      ctx.font = '15px Inter, sans-serif';
      const descLines = wrapText(ctx, desc, W - 140, 15);
      descLines.slice(0, 6).forEach(line => {
        ctx.fillText(line, W / 2, y);
        y += 22;
      });
      y += 20;
    }

    // Event Details box
    const boxX = 60;
    const boxW = W - 120;
    const boxY = y;
    const boxH = 200;

    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2E6F40';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'left';

    let detailY = boxY + 40;
    const detailX = boxX + 40;

    // Date
    ctx.fillText('📅  DATE', detailX, detailY);
    ctx.fillStyle = '#374151';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText(formatDateForFlyer(date), detailX + 160, detailY);
    detailY += 45;

    // Time
    ctx.fillStyle = '#2E6F40';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText('🕐  TIME', detailX, detailY);
    ctx.fillStyle = '#374151';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText(formatTimeForFlyer(time), detailX + 160, detailY);
    detailY += 45;

    // Location
    if (loc) {
      ctx.fillStyle = '#2E6F40';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillText('📍  VENUE', detailX, detailY);
      ctx.fillStyle = '#374151';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText(loc, detailX + 160, detailY);
    }

    // Bottom accent
    ctx.textAlign = 'center';
    y = boxY + boxH + 50;
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText('We look forward to your gracious presence.', W / 2, y);

    // Bottom bar
    const bottomGrad = ctx.createLinearGradient(0, 0, W, 0);
    bottomGrad.addColorStop(0, '#2E6F40');
    bottomGrad.addColorStop(1, '#16A34A');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, H - 8, W, 8);

    // Convert canvas to blob and return as promise
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          setFlyerBlob(blob);
          setFlyerPreviewUrl(URL.createObjectURL(blob));
          setFlyerGenerated(true);
          resolve(blob);
        }
      }, 'image/png');
    });
  }, [alumniName]);

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

  // Handle "Generate via Details" form submit — generates flyer and sends to MongoDB
  const handleDetailsGenerate = async (e) => {
    e.preventDefault();
    if (!eventName.trim()) {
      alert('Please enter an event name');
      return;
    }
    setSending(true);
    try {
      const blob = await generateFlyer(eventName, eventDate, eventTime, eventLocation, '');
      if (!blob) return;

      const formData = new FormData();
      formData.append('flyer', blob, 'invitation_flyer.png');
      formData.append('eventName', eventName);
      formData.append('alumniName', alumniName);
      formData.append('date', eventDate);
      formData.append('time', eventTime);
      formData.append('location', eventLocation);

      const res = await fetch(`${API_BASE}/api/invitation`, {
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

  // Handle "Generate via Description" form submit
  const handleDescGenerate = (e) => {
    e.preventDefault();
    if (!eventDesc.trim()) {
      alert('Please enter an event description');
      return;
    }
    generateFlyer(eventName || 'Alumni Event', eventDate, eventTime, eventLocation, eventDesc);
  };

  // Send invitation — store flyer image in MongoDB via GridFS
  const handleSendInvitation = async () => {
    if (!flyerBlob) {
      alert('Please generate a flyer first');
      return;
    }
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('flyer', flyerBlob, 'invitation_flyer.png');
      formData.append('eventName', eventName);
      formData.append('alumniName', alumniName);
      formData.append('date', eventDate);
      formData.append('time', eventTime);
      formData.append('location', eventLocation);

      const res = await fetch(`${API_BASE}/api/invitation`, {
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

  return (
    <div className={styles.pageContainer}>
      
      {/* Sidebar */}
      <Sidebar onLogout={onLogout} currentView={'event_and_reunion_history'} />

      {/* Hidden canvas for flyer generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Main Content */}
      <main className={styles.mainContent}>
          {/* Back Button */}
          <div className={styles.backButton} onClick={() => navigate('/admin/event_and_reunion_form1')} >
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
                <form className={styles.formGroup} onSubmit={handleDescGenerate}>
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
                  <button type="submit" className={styles.generateBtn}>
                  <span className="material-symbols-outlined">auto_awesome</span>
                    <span>Generate</span>
                  </button>
                </form>
              </section>

              {/* Generate via Details */}
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className="material-symbols-outlined">edit_note</span>
                  <h3>Generate via Details</h3>
                </div>
                <form className={styles.formGroup} onSubmit={handleDetailsGenerate}>
                  <div className={styles.detailsGrid}>
                    <div className={styles.fullWidth}>
                      <label htmlFor="event-name" className={styles.inputLabel}>Event Name</label>
                      <input id="event-name" type="text" className={styles.inputCustom} placeholder="e.g. Homecoming 2024" value={eventName} onChange={(e) => setEventName(e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="event-date" className={styles.inputLabel}>Date</label>
                      <DateInput theme="admin" id="event-date" className={styles.inputCustom} value={eventDate} onChange={(e) => setEventDate(e.target.value)} defaultToToday />
                    </div>
                    <div>
                      <label htmlFor="event-time" className={styles.inputLabel}>Time</label>
                      <TimeInput theme="admin" id="event-time" className={styles.inputCustom} value={eventTime} onChange={(e) => setEventTime(e.target.value)} defaultToNow />
                    </div>
                    <div className={styles.fullWidth}>
                      <label htmlFor="event-location" className={styles.inputLabel}>Location</label>
                      <input id="event-location" type="text" className={styles.inputCustom} placeholder="e.g. Main Auditorium, K.S.R Campus" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
                    </div>
                  </div>
                  <button type="submit" className={styles.generateBtn}>
                    Generate
                  </button>
                </form>
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