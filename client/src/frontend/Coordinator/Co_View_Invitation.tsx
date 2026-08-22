import React, { useState, useEffect, useRef, FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Camera, ChevronDown, Check, X } from 'lucide-react';
import styles from './Co_View_Invitation.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';
import { formatBranchName } from '../../utils/formatters';
import { DateInput } from '../../components/Calendar';

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
  status: 'upcoming' | 'completed' | 'cancelled';
  photos: string[];
}

interface PhotoGroup {
  type: 'trio' | 'pair' | 'single';
  images: string[];
}

const generateBatchOptions = (): string[] => {
  const currentYear = new Date().getFullYear();
  const options = ['All Batches'];
  for (let year = currentYear + 4; year >= 1995; year--) {
    options.push(`${year - 4}-${year}`);
  }
  return options;
};

const BATCH_OPTIONS = generateBatchOptions();

interface CoordinatorViewInvitationProps {
  onLogout: () => void;
}

const CoordinatorViewInvitation: FC<CoordinatorViewInvitationProps> = ({ onLogout }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [coordinatorDept, setCoordinatorDept] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([]);
  const [invitation, setInvitation] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Edit & Delete states
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  // Form states for editing
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDay, setEventDay] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [venue, setVenue] = useState('');
  const [batch, setBatch] = useState('');
  const [coOrganizers, setCoOrganizers] = useState<string[]>([]);
  const [status, setStatus] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [isCoOrgDropdownOpen, setIsCoOrgDropdownOpen] = useState(false);
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [customBatch, setCustomBatch] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const batchDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch coordinator profile, event details, and departments
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async (): Promise<void> => {
      if (!user?.token) {
        setError('Please login to view event details');
        setLoading(false);
        return;
      }

      try {
        const [eventRes, coordRes, deptRes] = await Promise.all([
          fetch(`${API_BASE}/api/events/${id}`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          fetch(`${API_BASE}/api/coordinators/profile/me`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          fetch(`${API_BASE}/api/departments`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);

        const eventData = await eventRes.json();
        const coordData = await coordRes.json();
        const deptData = await deptRes.json();

        if (deptData.success && deptData.departments) {
          setDepartments(deptData.departments);
        }

        const dept = coordData.success && coordData.data ? coordData.data.department : (user.department || '');
        setCoordinatorDept(dept);

        if (eventData.success && eventData.event) {
          const loadedEvent: EventDetails = {
            ...eventData.event,
            status: eventData.event.status === 'pending' ? 'upcoming' : eventData.event.status,
          };
          setEvent(loadedEvent);
          setPhotos(loadedEvent.photos || []);

          // Populate edit fields
          setEventName(loadedEvent.eventName);
          setEventDate(loadedEvent.eventDate ? loadedEvent.eventDate.split('T')[0] : '');
          setEventDay(loadedEvent.eventDay || '');
          setEventTime(loadedEvent.eventTime || '');
          setVenue(loadedEvent.venue || '');
          setBatch(loadedEvent.batch || '');
          setCoOrganizers(loadedEvent.coOrganizers?.map((co) => co._id) || []);
          setStatus(loadedEvent.status);

          // Fetch matching invitation
          try {
            const invRes = await fetch(`${API_BASE}/api/invitations/all`, {
              signal: controller.signal,
              headers: { Authorization: `Bearer ${user.token}` },
            });
            const invData = await invRes.json();
            if (invData.success && Array.isArray(invData.invitations)) {
              const matching = invData.invitations.find(
                (inv: any) => inv.subject?.toLowerCase() === loadedEvent.eventName?.toLowerCase()
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

  // Group photos
  useEffect(() => {
    if (photos && photos.length > 0) {
      const groups: PhotoGroup[] = [];
      const imagesPerRow = 3;
      for (let i = 0; i < photos.length; i += imagesPerRow) {
        const rowImages = photos.slice(i, i + imagesPerRow);
        if (rowImages.length === 3) groups.push({ type: 'trio', images: rowImages });
        else if (rowImages.length === 2) groups.push({ type: 'pair', images: rowImages });
        else groups.push({ type: 'single', images: rowImages });
      }
      setPhotoGroups(groups);
    } else {
      setPhotoGroups([]);
    }
  }, [photos]);

  // Calculate day when date changes
  useEffect(() => {
    if (eventDate) {
      const date = new Date(eventDate);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      setEventDay(days[date.getDay()]);
    }
  }, [eventDate]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCoOrgDropdownOpen(false);
      }
      if (batchDropdownRef.current && !batchDropdownRef.current.contains(e.target as Node)) {
        setIsBatchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Is this coordinator the organizer?
  const isOrganizer = event
    ? formatBranchName(event.organizer?.branch || '').toLowerCase() === formatBranchName(coordinatorDept).toLowerCase() ||
      (event.organizer?.deptCode || '').toLowerCase() === coordinatorDept.toLowerCase()
    : false;

  // Co-organizer options
  const coOrganizerOptions = departments.filter((d) => d._id !== event?.organizer?._id);

  const toggleCoOrganizer = (deptId: string) => {
    if (coOrganizers.includes(deptId)) {
      setCoOrganizers(coOrganizers.filter((cid) => cid !== deptId));
    } else {
      setCoOrganizers([...coOrganizers, deptId]);
    }
  };

  const getSelectedCoOrganizerNames = () => {
    if (coOrganizers.length === 0) return 'Select co-organizing departments';
    const selected = departments.filter((d) => coOrganizers.includes(d._id));
    return selected.map((d) => d.deptCode).join(', ');
  };

  // Batches
  const selectedBatches = batch ? batch.split(',').map((b) => b.trim()).filter(Boolean) : [];

  const sortBatches = (batchList: string[]): string[] => {
    const isYearRange = (s: string) => /^\d{4}-\d{4}$/.test(s);
    return [...batchList].sort((a, b) => {
      if (a === 'All Batches') return -1;
      if (b === 'All Batches') return 1;
      if (isYearRange(a) && isYearRange(b)) return a.localeCompare(b);
      if (isYearRange(a)) return -1;
      if (isYearRange(b)) return 1;
      return a.localeCompare(b);
    });
  };

  const allBatchOptions = sortBatches([...new Set([...BATCH_OPTIONS, ...selectedBatches])]);

  const toggleBatchSelection = (batchVal: string) => {
    let current = [...selectedBatches];
    if (batchVal === 'All Batches') {
      setBatch(current.includes('All Batches') ? '' : 'All Batches');
    } else {
      current = current.filter((b) => b !== 'All Batches');
      if (current.includes(batchVal)) current = current.filter((b) => b !== batchVal);
      else current.push(batchVal);
      setBatch(sortBatches(current).join(', '));
    }
  };

  const addCustomBatch = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const currentYear = new Date().getFullYear();
    const maxStartYear = currentYear + 4;

    if (/^\d{4}$/.test(trimmed)) {
      const startYear = parseInt(trimmed, 10);
      if (startYear < 1995 || startYear > maxStartYear) {
        alert(`Please enter a valid start year between 1995 and ${maxStartYear}.`);
        return;
      }
    }

    let formatted = trimmed;
    if (/^\d{4}$/.test(trimmed)) {
      const startYear = parseInt(trimmed, 10);
      formatted = `${startYear}-${startYear + 4}`;
    }

    let current = [...selectedBatches].filter((b) => b !== 'All Batches');
    if (!current.includes(formatted)) {
      current.push(formatted);
      setBatch(sortBatches(current).join(', '));
    }
    setCustomBatch('');
  };

  // Time handling
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
    if (p === 'PM' && hour24 !== 12) hour24 += 12;
    else if (p === 'AM' && hour24 === 12) hour24 = 0;
    setEventTime(`${String(hour24).padStart(2, '0')}:${m}`);
  };

  // Handle Update Event
  const handleUpdate = async () => {
    if (!eventName.trim() || !eventDate || !eventTime || !venue.trim()) {
      alert('Please fill all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/events/${id}`, {
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
          coOrganizers,
          status,
          batch: batch.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.event) {
        alert('Event updated successfully!');
        setEvent(data.event);
        setIsEditing(false);
      } else {
        alert(data.message || 'Failed to update event');
      }
    } catch {
      alert('Failed to update event. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Event
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/events/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      const data = await res.json();
      if (data.success) {
        alert('Event deleted successfully!');
        navigate('/coordinator/invitations');
      } else {
        alert(data.message || 'Failed to delete event');
      }
    } catch {
      alert('Failed to delete event. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('photos', file);
    });

    try {
      const res = await fetch(`${API_BASE}/api/events/${id}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user?.token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.photoIds) {
        setPhotos((prev) => [...prev, ...data.photoIds]);
        alert(`${data.photoIds.length} photo(s) uploaded successfully!`);
      } else {
        alert(data.message || 'Failed to upload photos');
      }
    } catch {
      alert('Failed to upload photos. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Photo Delete
  const handleDeletePhoto = async (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/events/${id}/photos/${photoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      const data = await res.json();
      if (data.success) {
        setPhotos((prev) => prev.filter((p) => p !== photoId));
      } else {
        alert(data.message || 'Failed to delete photo');
      }
    } catch {
      alert('Failed to delete photo');
    }
  };

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
          <div style={{ padding: '1rem 2rem' }}>
            <div className={styles.errorState}>{error || 'Event not found'}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Sidebar onLogout={onLogout} currentView={'Events_and_Reunions'} />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* Back Button */}
          <div
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#475569', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}
            onClick={() => navigate('/coordinator/invitations')}
          >
            <ArrowLeft size={16} />
            <span>Back to Events &amp; Reunion</span>
          </div>

          {/* Header */}
          <header className={styles.headerSection}>
            <div className={styles.headerContent}>
              <h1 className={styles.mainTitle}>{event.eventName}</h1>
            </div>

            {/* Action Buttons for Organizer Coordinator */}
            {isOrganizer && !isEditing && (
              <div className={styles.headerActions}>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={() => setIsEditing(true)}
                >
                  <Edit size={16} />
                  <span>Edit Event</span>
                </button>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 size={16} />
                  <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              </div>
            )}
          </header>

          {/* Details & Edit Form Card */}
          <div className={styles.formCard}>
            <div className={styles.form}>
              {/* Event Name */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Event Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    className={styles.formInput}
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    className={styles.formInput}
                    value={event.eventName}
                    disabled
                  />
                )}
              </div>

              {/* Date and Day */}
              <div className={styles.rowGroup}>
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Event Date</label>
                  {isEditing ? (
                    <DateInput
                      value={eventDate}
                      onChange={(e: any) => setEventDate(e?.target?.value ?? e)}
                      className={styles.formInput}
                    />
                  ) : (
                    <input
                      type="text"
                      className={styles.formInput}
                      value={new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                      disabled
                    />
                  )}
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Day</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={isEditing ? eventDay : event.eventDay}
                    disabled
                  />
                </div>
              </div>

              {/* Time and Venue */}
              <div className={styles.rowGroup}>
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Event Time</label>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <select
                        className={styles.formInput}
                        style={{ width: '80px', textAlign: 'center' }}
                        value={timeHour}
                        onChange={(e) => handleTimeChange(e.target.value, timeMinute, timePeriod)}
                      >
                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <span style={{ fontWeight: 800 }}>:</span>
                      <select
                        className={styles.formInput}
                        style={{ width: '80px', textAlign: 'center' }}
                        value={timeMinute}
                        onChange={(e) => handleTimeChange(timeHour, e.target.value, timePeriod)}
                      >
                        {['00', '15', '30', '45'].map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <select
                        className={styles.formInput}
                        style={{ width: '80px', textAlign: 'center' }}
                        value={timePeriod}
                        onChange={(e) => handleTimeChange(timeHour, timeMinute, e.target.value)}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  ) : (
                    <input
                      type="text"
                      className={styles.formInput}
                      value={event.eventTime}
                      disabled
                    />
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Venue / Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className={styles.formInput}
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                    />
                  ) : (
                    <input
                      type="text"
                      className={styles.formInput}
                      value={event.venue}
                      disabled
                    />
                  )}
                </div>
              </div>

              {/* Target Batches */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Target Batches</label>
                {isEditing ? (
                  <div className={styles.multiSelectDropdown} ref={batchDropdownRef}>
                    <div
                      className={styles.multiSelectTrigger}
                      onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
                    >
                      <span>{selectedBatches.length > 0 ? selectedBatches.join(', ') : 'All Batches'}</span>
                      <ChevronDown size={16} />
                    </div>
                    {isBatchDropdownOpen && (
                      <div className={styles.multiSelectOptions}>
                        {allBatchOptions.map((b) => (
                          <div
                            key={b}
                            className={styles.checkboxOption}
                            onClick={() => toggleBatchSelection(b)}
                          >
                            <div
                              style={{
                                width: '16px',
                                height: '16px',
                                border: '1.5px solid #cbd5e1',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: selectedBatches.includes(b) ? '#ff3d00' : 'white',
                                borderColor: selectedBatches.includes(b) ? '#ff3d00' : '#cbd5e1',
                              }}
                            >
                              {selectedBatches.includes(b) && <Check size={12} color="white" />}
                            </div>
                            <span>{b}</span>
                          </div>
                        ))}
                        <div className={styles.customBatchInputWrapper}>
                          <input
                            type="text"
                            className={styles.customBatchInput}
                            placeholder="Add e.g. 2015-2019"
                            value={customBatch}
                            onChange={(e) => setCustomBatch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomBatch(customBatch);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className={styles.customBatchBtn}
                            onClick={() => addCustomBatch(customBatch)}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    className={styles.formInput}
                    value={event.batch || 'All Batches'}
                    disabled
                  />
                )}
              </div>

              {/* Organizer */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Organizer (Department)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={`${event.organizer?.branch || 'N/A'} (${event.organizer?.deptCode || ''})`}
                  disabled
                />
              </div>

              {/* Co-Organizers */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Co-Organizers</label>
                {isEditing ? (
                  <div className={styles.multiSelectDropdown} ref={dropdownRef}>
                    <div
                      className={styles.multiSelectTrigger}
                      onClick={() => setIsCoOrgDropdownOpen(!isCoOrgDropdownOpen)}
                    >
                      <span>{getSelectedCoOrganizerNames()}</span>
                      <ChevronDown size={16} />
                    </div>
                    {isCoOrgDropdownOpen && (
                      <div className={styles.multiSelectOptions}>
                        {coOrganizerOptions.map((dept) => (
                          <div
                            key={dept._id}
                            className={styles.checkboxOption}
                            onClick={() => toggleCoOrganizer(dept._id)}
                          >
                            <div
                              style={{
                                width: '16px',
                                height: '16px',
                                border: '1.5px solid #cbd5e1',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: coOrganizers.includes(dept._id) ? '#ff3d00' : 'white',
                                borderColor: coOrganizers.includes(dept._id) ? '#ff3d00' : '#cbd5e1',
                              }}
                            >
                              {coOrganizers.includes(dept._id) && <Check size={12} color="white" />}
                            </div>
                            <span>
                              {dept.deptCode} - {formatBranchName(dept.branch)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    className={styles.formInput}
                    value={event.coOrganizers?.map((co) => `${co.branch} (${co.deptCode})`).join(', ') || 'None'}
                    disabled
                  />
                )}
              </div>

              {/* Status */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Status</label>
                {isEditing ? (
                  <div className={styles.statusButtons}>
                    <button
                      type="button"
                      className={`${styles.statusBtn} ${status === 'upcoming' ? styles.active : ''}`}
                      onClick={() => setStatus('upcoming')}
                    >
                      Upcoming
                    </button>
                    <button
                      type="button"
                      className={`${styles.statusBtn} ${styles.completedBtn} ${status === 'completed' ? styles.active : ''}`}
                      onClick={() => setStatus('completed')}
                    >
                      Completed
                    </button>
                    <button
                      type="button"
                      className={`${styles.statusBtn} ${styles.cancelledBtn} ${status === 'cancelled' ? styles.active : ''}`}
                      onClick={() => setStatus('cancelled')}
                    >
                      Cancelled
                    </button>
                  </div>
                ) : (
                  <div className={styles.statusDisplay}>
                    <span className={`${styles.statusBadgeLarge} ${styles[`status${event.status.charAt(0).toUpperCase() + event.status.slice(1)}`]}`}>
                      {event.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Save & Cancel Buttons in Edit Mode */}
              {isEditing && (
                <div className={styles.actionButtons}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => {
                      setIsEditing(false);
                      setEventName(event.eventName);
                      setEventDate(event.eventDate ? event.eventDate.split('T')[0] : '');
                      setEventDay(event.eventDay || '');
                      setEventTime(event.eventTime || '');
                      setVenue(event.venue || '');
                      setBatch(event.batch || '');
                      setCoOrganizers(event.coOrganizers?.map((co) => co._id) || []);
                      setStatus(event.status);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.saveBtn}
                    onClick={handleUpdate}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Invitation Details Section */}
          {invitation && (
            <div className={styles.photosSection}>
              <div className={styles.photosSectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <span className="material-symbols-outlined">mail</span>
                  <span>Sent Invitation Details</span>
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
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Subject</p>
                  <p style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '1.5rem', fontWeight: 600 }}>{invitation.subject}</p>

                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Description / Message</p>
                  <p style={{ fontSize: '0.95rem', color: '#334155', whiteSpace: 'pre-line', lineHeight: '1.6' }}>{invitation.description}</p>
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
                  <span>Event Photos ({photos.length})</span>
                </h2>

                {/* Photo Upload for department events */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                  <button
                    type="button"
                    className={styles.uploadPhotosBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Camera size={16} />
                    <span>{isUploading ? 'Uploading...' : 'Upload Photos'}</span>
                  </button>
                </div>
              </div>

              {photos && photos.length > 0 ? (
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
                          {isOrganizer && (
                            <button
                              type="button"
                              className={styles.deletePhotoBtn}
                              onClick={(e) => handleDeletePhoto(photoId, e)}
                              title="Delete Photo"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
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

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            padding: '1rem',
          }}
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                color: 'white',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={28} />
            </button>
            <img
              src={`${API_BASE}/api/images/${selectedPhoto}`}
              alt="Full Preview"
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '12px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorViewInvitation;
