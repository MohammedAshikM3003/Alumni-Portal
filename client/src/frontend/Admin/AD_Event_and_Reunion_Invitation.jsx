import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './AD_Event_and_Reunion_Invitation.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const Admin_Event_and_Reunion_Invitation = ({ onLogout }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({});
  const [photoGroups, setPhotoGroups] = useState([]);

  // Form states
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDay, setEventDay] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [venue, setVenue] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [coOrganizers, setCoOrganizers] = useState([]);
  const [status, setStatus] = useState('pending');
  const [isCoOrgDropdownOpen, setIsCoOrgDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch event and departments
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.token) {
        setError('Please login to view event details');
        setLoading(false);
        return;
      }

      try {
        // Fetch event
        const eventRes = await fetch(`${API_BASE}/api/events/${id}`, {
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
          setOrganizer(e.organizer?._id || '');
          setCoOrganizers(e.coOrganizers?.map(co => co._id) || []);
          setStatus(e.status);
          setPhotos(e.photos || []);
        } else {
          setError('Event not found');
        }

        // Fetch departments
        const deptRes = await fetch(`${API_BASE}/api/departments`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const deptData = await deptRes.json();
        if (deptData.success) {
          setDepartments(deptData.departments);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
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
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCoOrgDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter out organizer from co-organizer options
  const coOrganizerOptions = departments.filter(dept => dept._id !== organizer);

  // Toggle co-organizer selection
  const toggleCoOrganizer = (deptId) => {
    if (coOrganizers.includes(deptId)) {
      setCoOrganizers(coOrganizers.filter(id => id !== deptId));
    } else {
      setCoOrganizers([...coOrganizers, deptId]);
    }
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
          Authorization: `Bearer ${user.token}`,
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
    } catch (err) {
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
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const data = await response.json();
      if (data.success) {
        alert('Event deleted successfully!');
        navigate('/admin/event_and_reunion_history');
      } else {
        alert(data.message || 'Failed to delete event');
      }
    } catch (err) {
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
      setOrganizer(event.organizer?._id || '');
      setCoOrganizers(event.coOrganizers?.map(co => co._id) || []);
      setStatus(event.status);
    }
    setIsEditing(false);
  };

  // Handle image upload (multiple images)
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Define supported formats
    const supportedImageTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'image/bmp', 'image/tiff', 'image/tif', 'image/svg+xml', 'image/avif',
      'image/heic', 'image/heif', 'image/ico', 'image/x-icon'
    ];

    // Validate files
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const invalidFiles = [];
    const oversizedFiles = [];

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
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setPhotos([...photos, ...data.photoIds]);
      } else {
        alert(data.message || 'Failed to upload images');
      }
    } catch (err) {
      alert('Failed to upload images. Please check your internet connection and try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Handle image delete
  const handlePhotoDelete = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/events/${id}/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setPhotos(photos.filter(p => p !== photoId));
      } else {
        alert(data.message || 'Failed to delete image');
      }
    } catch (err) {
      alert('Failed to delete image');
    }
  };

  // Handle image dimension tracking
  const handleImageLoad = (photoId, e) => {
    const img = e.target;
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
              <span className={`${styles.statusBadge} ${styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]}`}>
                {status}
              </span>
              <h1 className={styles.mainTitle}>{isEditing ? 'Edit Event' : event.eventName}</h1>
            </div>
            {!isEditing && (
              <div className={styles.headerActions}>
                <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                  <span className="material-symbols-outlined">edit</span>
                  Edit
                </button>
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
                <input
                  type="time"
                  className={styles.formInput}
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  disabled={!isEditing}
                />
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
                      {dept.branch} ({dept.deptCode})
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
                            <span>{dept.branch} ({dept.deptCode})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    className={styles.formInput}
                    value={event.coOrganizers?.map(co => `${co.branch} (${co.deptCode})`).join(', ') || 'None'}
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
                    <option value="pending">Pending</option>
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
                            onError={(e) => {
                              console.error('Image failed to load:', e.target.src);
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
