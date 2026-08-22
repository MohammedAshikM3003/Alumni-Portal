import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ChevronDown, Check, Plus } from 'lucide-react';
import styles from './Co_Event_and_Reunion_Form.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';
import { DateInput } from '../../components/Calendar';
import { formatBranchName } from '../../utils/formatters';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Department {
  _id: string;
  branch: string;
  deptCode: string;
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

const Coordinator_Event_and_Reunion_Form = ({ onLogout }: { onLogout?: () => void }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDay, setEventDay] = useState('');
  const [eventTime, setEventTime] = useState('10:00');
  const [venue, setVenue] = useState('');
  const [batch, setBatch] = useState('');
  const [organizerId, setOrganizerId] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [coOrganizers, setCoOrganizers] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [isCoOrgDropdownOpen, setIsCoOrgDropdownOpen] = useState(false);
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [customBatch, setCustomBatch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const batchDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch coordinator profile & departments
  useEffect(() => {
    const controller = new AbortController();
    const initData = async () => {
      if (!user?.token) return;
      try {
        const [coordRes, deptRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/coordinators/profile/me`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          fetch(`${API_BASE_URL}/api/departments`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);

        const coordData = await coordRes.json();
        const deptData = await deptRes.json();

        let allDepts: Department[] = [];
        if (deptData.success && deptData.departments) {
          allDepts = deptData.departments;
          setDepartments(allDepts);
        }

        if (coordData.success && coordData.data) {
          const deptStr = coordData.data.department || '';
          setOrganizerName(deptStr);
          const match = allDepts.find(
            (d) =>
              formatBranchName(d.branch).toLowerCase() === formatBranchName(deptStr).toLowerCase() ||
              d.deptCode.toLowerCase() === deptStr.toLowerCase()
          );
          if (match) {
            setOrganizerId(match._id);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Failed to load coordinator or departments:', err);
      }
    };

    initData();
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

  // Close dropdowns on outside click
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

  // Co-organizers options (excluding coordinator's department)
  const coOrganizerOptions = departments.filter((dept) => dept._id !== organizerId);

  const toggleCoOrganizer = (deptId: string) => {
    if (coOrganizers.includes(deptId)) {
      setCoOrganizers(coOrganizers.filter((id) => id !== deptId));
    } else {
      setCoOrganizers([...coOrganizers, deptId]);
    }
  };

  const getSelectedCoOrganizerNames = () => {
    if (coOrganizers.length === 0) return 'Select co-organizing departments';
    const selected = departments.filter((d) => coOrganizers.includes(d._id));
    return selected.map((d) => d.deptCode).join(', ');
  };

  // Batches handling
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
      if (current.includes(batchVal)) {
        current = current.filter((b) => b !== batchVal);
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

  // Time parsing
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
    const timeStr = `${String(hour24).padStart(2, '0')}:${m}`;
    setEventTime(timeStr);
    if (errors.eventTime) setErrors((prev) => ({ ...prev, eventTime: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<string, string>> = {};
    if (!eventName.trim()) newErrors.eventName = 'Event name is required';
    if (!eventDate) newErrors.eventDate = 'Event date is required';
    if (!eventTime) newErrors.eventTime = 'Event time is required';
    if (!venue.trim()) newErrors.venue = 'Venue is required';

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
          organizer: organizerId || undefined,
          coOrganizers,
          batch: batch.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Event created successfully for your department!');
        navigate('/coordinator/invitations');
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
      <Sidebar onLogout={onLogout} currentView={'Events_and_Reunions'} />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.backButton} onClick={() => navigate('/coordinator/invitations')}>
            <ArrowLeft size={16} />
            <span>Back to Events &amp; Reunion</span>
          </div>

          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Host New Event / Reunion</h2>
              <p className={styles.formSubtitle}>
                Schedule an alumni gathering or reunion for <strong>{organizerName || 'your department'}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                {/* Event Name */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    Event Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.textInput}
                    placeholder="e.g. Annual Alumni Meet 2026"
                    value={eventName}
                    onChange={(e) => {
                      setEventName(e.target.value);
                      if (errors.eventName) setErrors((prev) => ({ ...prev, eventName: '' }));
                    }}
                  />
                  {errors.eventName && <span className={styles.fieldError}>{errors.eventName}</span>}
                </div>

                {/* Organizing Department (Locked to Coordinator Scope) */}
                <div className={styles.formGridTwoCol}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Organizing Department</span>
                      <Lock size={13} color="#ff3d00" />
                      <span style={{ color: '#ff3d00', fontSize: '0.72rem' }}>(Your Department)</span>
                    </label>
                    <input
                      type="text"
                      className={`${styles.textInput} ${styles.lockedInput}`}
                      value={organizerName || 'Loading...'}
                      readOnly
                    />
                  </div>

                  {/* Co-Organizing Departments */}
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Co-Organizing Departments (Optional)</label>
                    <div className={styles.customDropdownContainer} ref={dropdownRef}>
                      <div
                        className={styles.dropdownTrigger}
                        onClick={() => setIsCoOrgDropdownOpen(!isCoOrgDropdownOpen)}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getSelectedCoOrganizerNames()}
                        </span>
                        <ChevronDown size={16} />
                      </div>
                      {isCoOrgDropdownOpen && (
                        <div className={styles.dropdownMenu}>
                          {coOrganizerOptions.map((dept) => (
                            <div
                              key={dept._id}
                              className={styles.dropdownOption}
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
                  </div>
                </div>

                {/* Target Batches */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Target Batches (Optional)</label>
                  <div className={styles.customDropdownContainer} ref={batchDropdownRef}>
                    <div
                      className={styles.dropdownTrigger}
                      onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedBatches.length > 0 ? selectedBatches.join(', ') : 'Select target batches'}
                      </span>
                      <ChevronDown size={16} />
                    </div>
                    {isBatchDropdownOpen && (
                      <div className={styles.dropdownMenu}>
                        {allBatchOptions.map((b) => (
                          <div
                            key={b}
                            className={styles.dropdownOption}
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
                            placeholder="Add custom e.g. 2015-2019"
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
                </div>

                {/* Date, Day, Time */}
                <div className={styles.formGridTwoCol}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      Event Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <DateInput
                      value={eventDate}
                      onChange={(e: any) => {
                        const val = e?.target?.value ?? e;
                        setEventDate(val);
                        if (errors.eventDate) setErrors((prev) => ({ ...prev, eventDate: '' }));
                      }}
                      className={styles.textInput}
                      placeholder="Select event date"
                    />
                    {errors.eventDate && <span className={styles.fieldError}>{errors.eventDate}</span>}
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Event Day</label>
                    <input
                      type="text"
                      className={`${styles.textInput} ${styles.lockedInput}`}
                      value={eventDay || 'Auto-calculated from date'}
                      readOnly
                    />
                  </div>
                </div>

                {/* Time Picker & Venue */}
                <div className={styles.formGridTwoCol}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      Event Time <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div className={styles.timePickerRow}>
                      <select
                        className={styles.timeSelect}
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
                        className={styles.timeSelect}
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
                        className={styles.timeSelect}
                        value={timePeriod}
                        onChange={(e) => handleTimeChange(timeHour, timeMinute, e.target.value)}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      Venue / Location <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="e.g. Main Auditorium / Seminar Hall A"
                      value={venue}
                      onChange={(e) => {
                        setVenue(e.target.value);
                        if (errors.venue) setErrors((prev) => ({ ...prev, venue: '' }));
                      }}
                    />
                    {errors.venue && <span className={styles.fieldError}>{errors.venue}</span>}
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmitting}
                >
                  <Plus size={18} />
                  <span>{isSubmitting ? 'Creating Event...' : 'Schedule & Host Event'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Coordinator_Event_and_Reunion_Form;
