import Sidebar from './Components/Sidebar/Sidebar';
import styles from './AD_Event_and_Reunion_Form1.module.css';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Admin_Event_and_Reunion_Form1 = ( { onLogout } ) => {

  const navigate = useNavigate();
  const { user } = useAuth();

  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDay, setEventDay] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [venue, setVenue] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [coOrganizers, setCoOrganizers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [isCoOrgDropdownOpen, setIsCoOrgDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/departments`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        const data = await res.json();
        if (data.success) {
          setDepartments(data.departments);
        }
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      }
    };
    if (user?.token) fetchDepartments();
  }, [user?.token]);

  // Calculate day when date changes
  useEffect(() => {
    if (eventDate) {
      const date = new Date(eventDate);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      setEventDay(days[date.getDay()]);
    } else {
      setEventDay('');
    }
  }, [eventDate]);

  // Filter out organizer from co-organizer options
  const coOrganizerOptions = departments.filter(dept => dept._id !== organizer);

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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!eventName.trim()) newErrors.eventName = 'Event name is required';
    if (!eventDate) newErrors.eventDate = 'Event date is required';
    if (!eventTime) newErrors.eventTime = 'Event time is required';
    if (!venue.trim()) newErrors.venue = 'Venue is required';
    if (!organizer) newErrors.organizer = 'Organizer is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
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
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Event created successfully!');
        navigate('/admin/event_and_reunion_history');
      } else {
        alert(data.message || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };





  return (
    <div className={styles.pageContainer}>
      
      {/* Sidebar */}
      <Sidebar onLogout={onLogout} currentView={'event_and_reunion_history'} />

      {/* Main Content */}
      <main className={styles.mainContent}>
          {/* Back Button */}
          <div className={styles.backButton} onClick={() => navigate('/admin/event_and_reunion_history') }>
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Back</span>
          </div>

        {/* Form Container */}
        <div className={styles.contentWrapper}>
          <div className={styles.formCard}>
            
            {/* Form Header */}
            <div className={styles.formHeader}>
              <div className={styles.formIconWrapper}>
                <span className="material-symbols-outlined">mail</span>
              </div>
              <h3 className={styles.formTitle}>Create New Invitation</h3>
              <p className={styles.formSubtitle}>Fill in the event and alumni details to generate a customized invitation.</p>
            </div>

            {/* Form */}
            <form className={styles.form} onSubmit={handleFormSubmit}>

              {/* Event Name */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Event Name</label>
                <input
                  type="text"
                  className={`${styles.formInput} ${errors.eventName ? styles.inputError : ''}`}
                  placeholder="Enter event name"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
                {errors.eventName && <span className={styles.errorText}>{errors.eventName}</span>}
              </div>

              {/* Event Date and Day */}
              <div className={styles.rowGroup}>
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Event Date</label>
                  <input
                    type="date"
                    className={`${styles.formInput} ${errors.eventDate ? styles.inputError : ''}`}
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                  {errors.eventDate && <span className={styles.errorText}>{errors.eventDate}</span>}
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Day</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={eventDay}
                    placeholder="Auto-calculated"
                    readOnly
                  />
                </div>
              </div>

              {/* Event Time */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Event Time</label>
                <input
                  type="time"
                  className={`${styles.formInput} ${errors.eventTime ? styles.inputError : ''}`}
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
                {errors.eventTime && <span className={styles.errorText}>{errors.eventTime}</span>}
              </div>

              {/* Venue */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Venue</label>
                <input
                  type="text"
                  className={`${styles.formInput} ${errors.venue ? styles.inputError : ''}`}
                  placeholder="Enter event venue"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
                {errors.venue && <span className={styles.errorText}>{errors.venue}</span>}
              </div>

              {/* Organizer */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Organizer (Department)</label>
                <select
                  className={`${styles.formInput} ${styles.formSelect} ${errors.organizer ? styles.inputError : ''}`}
                  value={organizer}
                  onChange={(e) => {
                    setOrganizer(e.target.value);
                    setCoOrganizers([]);
                  }}
                >
                  <option value="">Select organizing department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.branch} ({dept.deptCode})
                    </option>
                  ))}
                </select>
                {errors.organizer && <span className={styles.errorText}>{errors.organizer}</span>}
              </div>

              {/* Co-Organizers */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Co-Organizers (Optional)</label>
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
                {!organizer && <span className={styles.helperText}>Select an organizer first</span>}
              </div>

              {/* Submit Button */}
              <div className={styles.submitWrapper}>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Event...' : 'Create Event'}
                </button>
              </div>

            </form>

          </div>
        </div>

      </main>
    </div>
  );
};

export default Admin_Event_and_Reunion_Form1;