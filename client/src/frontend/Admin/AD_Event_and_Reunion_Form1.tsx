import Sidebar from './Components/Sidebar/Sidebar';
import styles from './AD_Event_and_Reunion_Form1.module.css';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/authContext/authContext';
import { formatBranchName } from '../../utils/formatters';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Department {
  _id: string;
  branch: string;
  deptCode: string;
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

const Admin_Event_and_Reunion_Form1 = ({ onLogout }: { onLogout?: () => void }) => {

  const navigate = useNavigate();
  const { user } = useAuth();

  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDay, setEventDay] = useState('');
  const [eventTime, setEventTime] = useState('10:00');
  const [venue, setVenue] = useState('');
  const [batch, setBatch] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [coOrganizers, setCoOrganizers] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [isCoOrgDropdownOpen, setIsCoOrgDropdownOpen] = useState(false);
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [customBatch, setCustomBatch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const batchDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch departments
  useEffect(() => {
    const controller = new AbortController();
    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/departments`, {
            signal: controller.signal,
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        const data = await res.json();
        if (data.success) {
          setDepartments(data.departments);
        }
      } catch (err: any) {
          if (err.name === 'AbortError') return;
        console.error('Failed to fetch departments:', err);
      }
    };
    if (user?.token) fetchDepartments();

    return () => controller.abort();
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

  // Toggle co-organizer selection
  const toggleCoOrganizer = (deptId: string) => {
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
    if (errors.eventTime) setErrors(prev => ({ ...prev, eventTime: '' }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<string, string>> = {};
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
          batch: batch.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Event created successfully!');
        navigate('/admin/event_and_reunion_history');
      } else {
        alert(data.message || 'Failed to create event');
      }
    } catch (error: any) {
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
                  onChange={(e) => {
                    setEventName(e.target.value);
                    if (errors.eventName) setErrors(prev => ({ ...prev, eventName: '' }));
                  }}
                />
                {errors.eventName && <span className={styles.errorText}>{errors.eventName}</span>}
              </div>

              {/* Event Date and Day */}
              <div className={styles.rowGroup}>
                 <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Event Date</label>
                  <input
                    type="date"
                    name="eventDate"
                    className={`${styles.formInput} ${errors.eventDate ? styles.inputError : ''}`}
                    value={eventDate}
                    onChange={(e) => {
                      setEventDate(e.target.value);
                      if (errors.eventDate) setErrors(prev => ({ ...prev, eventDate: '' }));
                    }}
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
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {/* Hour Selection */}
                  <select
                    className={`${styles.formInput} ${styles.formSelect} ${errors.eventTime ? styles.inputError : ''}`}
                    value={timeHour}
                    onChange={(e) => handleTimeChange(e.target.value, timeMinute, timePeriod)}
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
                    className={`${styles.formInput} ${styles.formSelect} ${errors.eventTime ? styles.inputError : ''}`}
                    value={timeMinute}
                    onChange={(e) => handleTimeChange(timeHour, e.target.value, timePeriod)}
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
                    className={`${styles.formInput} ${styles.formSelect} ${errors.eventTime ? styles.inputError : ''}`}
                    value={timePeriod}
                    onChange={(e) => handleTimeChange(timeHour, timeMinute, e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
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
                  onChange={(e) => {
                    setVenue(e.target.value);
                    if (errors.venue) setErrors(prev => ({ ...prev, venue: '' }));
                  }}
                />
                {errors.venue && <span className={styles.errorText}>{errors.venue}</span>}
              </div>

              {/* Target Batch */}
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>Target Batch (Optional)</label>
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
                    if (errors.organizer) setErrors(prev => ({ ...prev, organizer: '' }));
                  }}
                >
                  <option value="">Select organizing department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {formatBranchName(dept.branch)} ({dept.deptCode})
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
                          <span>{formatBranchName(dept.branch)} ({dept.deptCode})</span>
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