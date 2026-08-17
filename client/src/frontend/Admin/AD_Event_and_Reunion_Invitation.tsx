import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './AD_Event_and_Reunion_Invitation.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';
import { formatBranchName } from '../../utils/formatters';

const API_BASE = import.meta.env.VITE_API_URL;

interface Department {
  _id: string;
  branch: string;
  deptCode: string;
}

interface EventDetails {
  _id: string;
  eventName: string;
  eventDate: string;
  eventDay: string;
  eventTime: string;
  venue: string;
  batch?: string;
  organizer: Department;
  coOrganizers: Department[];
  status: string;
  photos: string[];
}

interface PhotoGroup {
  type: string;
  images: string[];
}

// Generate target batch options dynamically (from currentYear + 4 down to 1995)
const generateBatchOptions = (): string[] => {
  const currentYear = new Date().getFullYear();
  const options = ['All Batches'];
  for (let year = currentYear + 4; year >= 1995; year--) {
    options.push(`${year - 4}-${year}`);
  }
  return options;
};

const BATCH_OPTIONS = generateBatchOptions();

const Admin_Event_and_Reunion_Invitation = ({ onLogout }: { onLogout?: () => void }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number; aspectRatio: number }>>({});
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([]);
  const [invitation, setInvitation] = useState<any>(null);

  // Form states
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDay, setEventDay] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [venue, setVenue] = useState('');
  const [batch, setBatch] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [coOrganizers, setCoOrganizers] = useState<string[]>([]);
  const [status, setStatus] = useState('upcoming');
  const [isCoOrgDropdownOpen, setIsCoOrgDropdownOpen] = useState(false);
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [customBatch, setCustomBatch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const batchDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch event and departments
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      if (!user?.token) {
        setError('Please login to view event details');
        setLoading(false);
        return;
      }

      try {
        // Fetch event
        const eventRes = await fetch(`${API_BASE}/api/events/${id}`, {
            signal: controller.signal,
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const eventData = await eventRes.json();

        if (eventData.success && eventData.event) {
          const e = eventData.event;
          setEvent(e);
          setEventName(e.eventName);
          setEventDate(e.eventDate?.split('T')[0] || '');
          setEventDay(e.eventDay);
          setEventTime(e.eventTime);
          setVenue(e.venue);
          setBatch(e.batch || '');
          setOrganizer(e.organizer?._id || '');
          setCoOrganizers(e.coOrganizers?.map((co: any) => co._id) || []);
          setStatus(e.status === 'pending' ? 'upcoming' : e.status);
          setPhotos(e.photos || []);

          // Fetch matching invitation
          try {
            const invRes = await fetch(`${API_BASE}/api/invitations/all`, {
              signal: controller.signal,
              headers: { Authorization: `Bearer ${user.token}` },
            });
            const invData = await invRes.json();
            if (invData.success && Array.isArray(invData.invitations)) {
              const matching = invData.invitations.find(
                (inv: any) => inv.subject?.toLowerCase() === e.eventName?.toLowerCase()
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

        // Fetch departments
        const deptRes = await fetch(`${API_BASE}/api/departments`, {
            signal: controller.signal,
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const deptData = await deptRes.json();
        if (deptData.success) {
          setDepartments(deptData.departments);
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

  // Calculate day when date changes
  useEffect(() => {
    if (eventDate) {
      const date = new Date(eventDate);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      setEventDay(days[date.getDay()]);
    }
  }, [eventDate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCoOrgDropdownOpen(false);
      }
      if (batchDropdownRef.current && !batchDropdownRef.current.contains(event.target as Node)) {
        setIsBatchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter out organizer from co-organizer options
  const coOrganizerOptions = departments.filter(dept => dept._id !== organizer);

  // Toggle co-organizer selection
  const toggleCoOrganizer = (deptId: string) => {
    if (coOrganizers.includes(deptId)) {
      setCoOrganizers(coOrganizers.filter(id => id !== deptId));
    } else {
      setCoOrganizers([...coOrganizers, deptId]);
    }
  };

  // Toggle batch selection
  const selectedBatches = batch ? batch.split(',').map(b => b.trim()).filter(Boolean) : [];
  
  const sortBatches = (batchList: string[]): string[] => {
    const isYearRange = (s: string) => /^\d{4}-\d{4}$/.test(s);
    return [...batchList].sort((a, b) => {
      if (a === 'All Batches') return -1;
      if (b === 'All Batches') return 1;
      if (isYearRange(a) && isYearRange(b)) {
        return a.localeCompare(b); // Sort ascending numerically
      }
      if (isYearRange(a)) return -1;
      if (isYearRange(b)) return 1;
      return a.localeCompare(b);
    });
  };

  const allBatchOptions = sortBatches([...new Set([...BATCH_OPTIONS, ...selectedBatches])]);
  
  const getSelectedBatchNames = () => {
    if (selectedBatches.length === 0) return 'Select target batches';
    return selectedBatches.join(', ');
  };

  const toggleBatchSelection = (batchVal: string) => {
    let current = [...selectedBatches];
    if (batchVal === 'All Batches') {
      if (current.includes('All Batches')) {
        setBatch('');
      } else {
        setBatch('All Batches');
      }
    } else {
      current = current.filter(b => b !== 'All Batches');
      if (current.includes(batchVal)) {
        current = current.filter(b => b !== batchVal);
      } else {
        current.push(batchVal);
      }
      setBatch(sortBatches(current).join(', '));
    }
  };

  const addCustomBatch = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    
    const currentYear = new Date().getFullYear();
    const maxStartYear = currentYear + 4;
    
    // Check YYYY format
    if (/^\d{4}$/.test(trimmed)) {
      const startYear = parseInt(trimmed, 10);
      if (startYear < 1995 || startYear > maxStartYear) {
        alert(`Please enter a valid start year between 1995 and ${maxStartYear}.`);
        return;
      }
    }
    
    // Check YYYY-YYYY format
    if (/^\d{4}-\d{4}$/.test(trimmed)) {
      const [start, end] = trimmed.split('-').map(Number);
      if (start < 1995 || start > maxStartYear || end < 1995 || end > maxStartYear + 4) {
        alert(`Please enter a valid batch start year between 1995 and ${maxStartYear}.`);
        return;
      }
    }

    let formatted = trimmed;
    if (/^\d{4}$/.test(trimmed)) {
      const startYear = parseInt(trimmed, 10);
      formatted = `${startYear}-${startYear + 4}`;
    }
    
    let current = [...selectedBatches];
    current = current.filter(b => b !== 'All Batches');
    if (!current.includes(formatted)) {
      current.push(formatted);
      setBatch(sortBatches(current).join(', '));
    }
    setCustomBatch('');
  };

  // Time formatting/parsing to store in HH:MM format
  const parseEventTime = (timeStr: string) => {
    if (!timeStr) return { hour: '10', minute: '00', period: 'AM' };
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = String(h % 12 || 12).padStart(2, '0');
    const displayM = mStr || '00';
    return { hour: displayH, minute: displayM, period };
  };

  const { hour: timeHour, minute: timeMinute, period: timePeriod } = parseEventTime(eventTime);

  const handleTimeChange = (h: string, m: string, p: string) => {
    let hour24 = parseInt(h, 10);
    if (p === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (p === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    const timeStr = `${String(hour24).padStart(2, '0')}:${m}`;
    setEventTime(timeStr);
  };

  // Get selected co-organizer names for display
  const getSelectedCoOrganizerNames = () => {
    if (coOrganizers.length === 0) return 'Select co-organizing departments';
    const selectedDepts = departments.filter(d => coOrganizers.includes(d._id));
    return selectedDepts.map(d => d.deptCode).join(', ');
  };

  // Handle Update
  const handleUpdate = async () => {
    if (!eventName.trim() || !eventDate || !eventTime || !venue.trim() || !organizer) {
      alert('Please fill all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          eventName: eventName.trim(),
          eventDate,
          eventDay,
          eventTime,
          venue: venue.trim(),
          organizer,
          coOrganizers,
          status,
          batch: batch.trim(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Event updated successfully!');
        setEvent(data.event);
        setIsEditing(false);
      } else {
        alert(data.message || 'Failed to update event');
      }
    } catch (err: any) {
      alert('Failed to update event');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE}/api/events/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      const data = await response.json();
      if (data.success) {
        alert('Event deleted successfully!');
        navigate('/admin/event_and_reunion_history');
      } else {
        alert(data.message || 'Failed to delete event');
      }
    } catch (err: any) {
      alert('Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    if (event) {
      setEventName(event.eventName);
      setEventDate(event.eventDate?.split('T')[0] || '');
      setEventDay(event.eventDay);
      setEventTime(event.eventTime);
      setVenue(event.venue);
      setBatch(event.batch || '');
      setOrganizer(event.organizer?._id || '');
      setCoOrganizers(event.coOrganizers?.map(co => co._id) || []);
      setStatus(event.status);
    }
    setIsEditing(false);
  };

  // Handle image upload (multiple images)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Define supported formats
    const supportedImageTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'image/bmp', 'image/tiff', 'image/tif', 'image/svg+xml', 'image/avif',
      'image/heic', 'image/heif', 'image/ico', 'image/x-icon'
    ];

    // Validate files
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const invalidFiles: string[] = [];
    const oversizedFiles: string[] = [];

    files.forEach(file => {
      const isImage = file.type.startsWith('image/') || supportedImageTypes.includes(file.type);

      if (!isImage) {
        invalidFiles.push(file.name);
      }

      if (file.size > maxFileSize) {
        oversizedFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      alert(`Unsupported file types: ${invalidFiles.join(', ')}.\nPlease select only image files.`);
      return;
    }

    if (oversizedFiles.length > 0) {
      alert(`Files too large: ${oversizedFiles.join(', ')}.\nMaximum file size is 10MB.`);
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('photos', file);
    });

    try {
      const response = await fetch(`${API_BASE}/api/events/${id}/photos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setPhotos([...photos, ...data.photoIds]);
      } else {
        alert(data.message || 'Failed to upload images');
      }
    } catch (err: any) {
      alert('Failed to upload images. Please check your internet connection and try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Handle image delete
  const handlePhotoDelete = async (photoId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/events/${id}/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setPhotos(photos.filter(p => p !== photoId));
      } else {
        alert(data.message || 'Failed to delete image');
      }
    } catch (err: any) {
      alert('Failed to delete image');
    }
  };

  // Handle image dimension tracking
  const handleImageLoad = (photoId: string, e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    setImageDimensions(prev => ({
      ...prev,
      [photoId]: {
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: aspectRatio
      }
    }));
  };

  // Simple left-to-right, row-by-row layout
  useEffect(() => {
    if (photos.length === 0) {
      setPhotoGroups([]);
      return;
    }

    // Simple row-based grouping - 3 images per row
    const groups = [];
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
  }, [photos]);

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

  if (error || !event) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'event_and_reunion_history'} />
        <main className={styles.mainContent}>
          <div className={styles.errorState}>{error || 'Event not found'}</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Sidebar onLogout={onLogout} currentView={'event_and_reunion_history'} />

      <main className={styles.mainContent}>
        {/* Back Button */}
        <div className={styles.backButton} onClick={() => navigate('/admin/event_and_reunion_history')}>
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back</span>
        </div>

        <div className={styles.contentWrapper}>
          {/* Header */}
          <header className={styles.headerSection}>
            <div className={styles.headerContent}>
              <h1 className={styles.mainTitle}>{isEditing ? 'Edit Event' : event.eventName}</h1>
            </div>
            {!isEditing && (
              <div className={styles.headerActions}>
                {status !== 'completed' && (
                  <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                    <span className="material-symbols-outlined">edit</span>
                    Edit
                  </button>
                )}
                <button className={styles.deleteBtn} onClick={handleDelete} disabled={isDeleting}>
                  <span className="material-symbols-outlined">delete</span>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </header>

          {/* Form / Details */}
          <div className={styles.formCard}>
            <div className={styles.form}>
              {/* Event Name */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Event Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              {/* Date and Day */}
              <div className={styles.rowGroup}>
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Event Date</label>
                  <input
                    type="date"
                    name="eventDate"
                    className={styles.formInput}
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Day</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={eventDay}
                    readOnly
                  />
                </div>
              </div>

              {/* Time */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Event Time</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {/* Hour Selection */}
                  <select
                    className={`${styles.formInput} ${styles.formSelect}`}
                    value={timeHour}
                    onChange={(e) => handleTimeChange(e.target.value, timeMinute, timePeriod)}
                    disabled={!isEditing}
                    style={{ flex: 1 }}
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>

                  {/* Minute Selection */}
                  <select
                    className={`${styles.formInput} ${styles.formSelect}`}
                    value={timeMinute}
                    onChange={(e) => handleTimeChange(timeHour, e.target.value, timePeriod)}
                    disabled={!isEditing}
                    style={{ flex: 1 }}
                  >
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                  {/* Period Selection */}
                  <select
                    className={`${styles.formInput} ${styles.formSelect}`}
                    value={timePeriod}
                    onChange={(e) => handleTimeChange(timeHour, timeMinute, e.target.value)}
                    disabled={!isEditing}
                    style={{ flex: 1 }}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {/* Venue */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Venue</label>
               <input
                  type="text"
                  className={styles.formInput}
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              {/* Target Batch */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Target Batch (Optional)</label>
                {isEditing ? (
                  <div className={styles.multiSelectDropdown} ref={batchDropdownRef}>
                    <div
                      className={styles.multiSelectTrigger}
                      onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
                    >
                      <span className={selectedBatches.length === 0 ? styles.placeholder : ''}>
                        {getSelectedBatchNames()}
                      </span>
                      <span className="material-symbols-outlined">
                        {isBatchDropdownOpen ? 'expand_less' : 'expand_more'}
                      </span>
                    </div>
                    {isBatchDropdownOpen && (
                      <div className={styles.multiSelectOptions}>
                        {/* Add Custom Batch Input */}
                        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-color)' }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            placeholder="Type custom batch..."
                            value={customBatch}
                            onChange={(e) => setCustomBatch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomBatch(customBatch);
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: '0.4rem 0.75rem',
                              fontSize: '0.85rem',
                              border: '1px solid var(--border-color)',
                              borderRadius: '0.375rem',
                              outline: 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              addCustomBatch(customBatch);
                            }}
                            style={{
                              padding: '0.4rem 0.75rem',
                              fontSize: '0.85rem',
                              backgroundColor: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            Add
                          </button>
                        </div>
                        {allBatchOptions.map((opt) => (
                          <label key={opt} className={styles.checkboxOption}>
                            <input
                              type="checkbox"
                              checked={selectedBatches.includes(opt)}
                              onChange={() => toggleBatchSelection(opt)}
                            />
                            <span className={styles.checkmark}></span>
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    className={styles.formInput}
                    value={batch || 'All Batches'}
                    readOnly
                  />
                )}
              </div>

              {/* Organizer */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Organizer (Department)</label>
                <select
                  className={`${styles.formInput} ${styles.formSelect}`}
                  value={organizer}
                  onChange={(e) => {
                    setOrganizer(e.target.value);
                    setCoOrganizers([]);
                  }}
                  disabled={!isEditing}
                >
                  <option value="">Select organizing department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {formatBranchName(dept.branch)} ({dept.deptCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Co-Organizers */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Co-Organizers (Optional)</label>
                {isEditing ? (
                  <div className={styles.multiSelectDropdown} ref={dropdownRef}>
                    <div
                      className={`${styles.multiSelectTrigger} ${!organizer ? styles.disabled : ''}`}
                      onClick={() => organizer && setIsCoOrgDropdownOpen(!isCoOrgDropdownOpen)}
                    >
                      <span className={coOrganizers.length === 0 ? styles.placeholder : ''}>
                        {getSelectedCoOrganizerNames()}
                      </span>
                      <span className="material-symbols-outlined">
                        {isCoOrgDropdownOpen ? 'expand_less' : 'expand_more'}
                      </span>
                    </div>
                    {isCoOrgDropdownOpen && (
                      <div className={styles.multiSelectOptions}>
                        {coOrganizerOptions.map((dept) => (
                          <label key={dept._id} className={styles.checkboxOption}>
                            <input
                              type="checkbox"
                              checked={coOrganizers.includes(dept._id)}
                              onChange={() => toggleCoOrganizer(dept._id)}
                            />
                            <span className={styles.checkmark}></span>
                            <span>{formatBranchName(dept.branch)} ({dept.deptCode})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    className={styles.formInput}
                    value={event.coOrganizers?.map(co => `${formatBranchName(co.branch)} (${co.deptCode})`).join(', ') || 'None'}
                    readOnly
                  />
                )}
              </div>

              {/* Status */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Status</label>
                {isEditing ? (
                  <select
                    className={`${styles.formInput} ${styles.formSelect}`}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <div className={styles.statusDisplay}>
                    <span className={`${styles.statusBadgeLarge} ${styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]}`}>
                      {status}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className={styles.actionButtons}>
                  <button className={styles.cancelBtn} onClick={handleCancelEdit}>
                    Cancel
                  </button>
                  <button className={styles.saveBtn} onClick={handleUpdate} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
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

          {/* Event Media Section - Only show for completed events */}
          {status === 'completed' && (
            <div className={styles.photosSection}>
              <div className={styles.photosSectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <span className="material-symbols-outlined">photo_library</span>
                  Event Photos
                </h2>
                <label className={styles.uploadBtn}>
                  <span className="material-symbols-outlined">add_photo_alternate</span>
                  {isUploading ? 'Uploading...' : 'Add Photos'}
                  <input
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.tif,.svg,.avif,.heic,.heif,.ico"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={isUploading}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {photos.length > 0 ? (
                <div className={styles.photosContainer}>
                  {photoGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className={`${styles.photoGroup} ${styles[group.type]}`}>
                      {group.images.map((photoId) => (
                        <div key={photoId} className={styles.photoItem}>
                          <img
                            src={`${API_BASE}/api/images/${photoId}`}
                            alt="Event photo"
                            className={styles.photoImage}
                            onLoad={(e) => handleImageLoad(photoId, e)}
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                              console.error('Image failed to load:', (e.target as HTMLImageElement).src);
                            }}
                          />
                          <button
                            className={styles.deletePhotoBtn}
                            onClick={() => handlePhotoDelete(photoId)}
                            title="Delete"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noPhotos}>
                  <span className="material-symbols-outlined">photo_camera</span>
                  <p>No photos uploaded yet. Add photos to showcase the event!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin_Event_and_Reunion_Invitation;
