import React, { useState, useRef, useEffect } from 'react';
import styles from './TimePicker.module.css';

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  onClose?: () => void;
  theme?: string;
}

const TimePicker = ({ value, onChange, onClose, theme = 'admin' }: TimePickerProps) => {
  // Parse initial value (HH:MM format)
  const parseTime = (timeStr?: string) => {
    if (!timeStr) {
      const now = new Date();
      return {
        hours: now.getHours(),
        minutes: now.getMinutes()
      };
    }
    const [h, m] = timeStr.split(':').map(Number);
    return { hours: h || 0, minutes: m || 0 };
  };

  const initialTime = parseTime(value);
  const initialPeriod = initialTime.hours >= 12 ? 'PM' as const : 'AM' as const;
  const initialDisplayHours = initialTime.hours % 12 || 12;
  const [hours, setHours] = useState(initialDisplayHours);
  const [minutes, setMinutes] = useState(initialTime.minutes);
  const [activeColumn, setActiveColumn] = useState('hour');
  const [is24Hour, setIs24Hour] = useState(false);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialPeriod);

  const hourRef = useRef<HTMLDivElement | null>(null);
  const minuteRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollToSelected(hourRef, hours);
    scrollToSelected(minuteRef, minutes);
  }, []);

  const scrollToSelected = (ref: React.RefObject<HTMLDivElement | null>, value: number) => {
    if (ref.current) {
      const item = ref.current.querySelector(`[data-value="${value}"]`);
      if (item) {
        item.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  };

  const handleHourClick = (h: number) => {
    setHours(h);
    setActiveColumn('minute');
    setTimeout(() => scrollToSelected(minuteRef, minutes), 50);
  };

  const handleMinuteClick = (m: number) => {
    setMinutes(m);
  };

  const handlePeriodToggle = (p: 'AM' | 'PM') => {
    setPeriod(p);
  };

  const handleFormatToggle = () => {
    const newIs24 = !is24Hour;
    setIs24Hour(newIs24);
    if (newIs24) {
      // Switching to 24h: convert AM/PM hour back
      let h24 = hours;
      if (!is24Hour) {
        h24 = period === 'PM' ? (hours % 12) + 12 : hours % 12;
      }
      setHours(h24);
    } else {
      // Switching to 12h: convert 24h to 12h display
      const h12 = hours % 12 || 12;
      setHours(h12);
      setPeriod(hours >= 12 ? 'PM' : 'AM');
    }
  };

  const handleApply = () => {
    let h24 = hours;
    if (!is24Hour) {
      h24 = period === 'PM' ? (hours % 12) + 12 : hours % 12;
    }
    const formattedHours = String(h24).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const timeString = `${formattedHours}:${formattedMinutes}`;
    if (onChange) {
      onChange(timeString);
    }
    if (onClose) onClose();
  };

  const handleCancel = () => {
    if (onClose) onClose();
  };

  const formatHour = (h: number) => {
    if (is24Hour) return String(h).padStart(2, '0');
    const h12 = h % 12 || 12;
    return String(h12).padStart(2, '0');
  };

  const formatMinute = (m: number) => {
    return String(m).padStart(2, '0');
  };

  const displayHours = is24Hour ? Array.from({ length: 24 }, (_, i) => i) : Array.from({ length: 12 }, (_, i) => i + 1);
  const minutesArray = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className={`${styles.timePickerContainer} ${styles[theme]}`}>
      {/* Header */}
      <div className={styles.timePickerHeader}>
        <div className={styles.viewTabs}>
          <button
            className={`${styles.viewTab} ${activeColumn === 'hour' ? styles.activeTab : ''}`}
            onClick={() => setActiveColumn('hour')}
          >
            Hour
          </button>
          <button
            className={`${styles.viewTab} ${activeColumn === 'minute' ? styles.activeTab : ''}`}
            onClick={() => setActiveColumn('minute')}
          >
            Minute
          </button>
        </div>
        <button className={styles.formatToggle} onClick={handleFormatToggle}>
          {is24Hour ? '24H' : '12H'}
        </button>
        <button className={styles.closeButton} onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Current Time Display */}
      <div className={styles.currentTimeDisplay}>
        <span className={`${styles.timeSegment} ${activeColumn === 'hour' ? styles.activeSegment : ''}`}>
          {formatHour(hours)}
        </span>
        <span className={styles.timeSeparator}>:</span>
        <span className={`${styles.timeSegment} ${activeColumn === 'minute' ? styles.activeSegment : ''}`}>
          {formatMinute(minutes)}
        </span>
        {!is24Hour && (
          <div className={styles.periodSelector}>
            <button
              className={`${styles.periodBtn} ${period === 'AM' ? styles.periodActive : ''}`}
              onClick={() => handlePeriodToggle('AM')}
            >
              AM
            </button>
            <button
              className={`${styles.periodBtn} ${period === 'PM' ? styles.periodActive : ''}`}
              onClick={() => handlePeriodToggle('PM')}
            >
              PM
            </button>
          </div>
        )}
      </div>

      {/* Time Selection Columns */}
      <div className={styles.timePickerBody}>
        {/* Hours Column */}
        <div
          className={`${styles.timeColumn} ${activeColumn === 'hour' ? styles.activeColumn : ''}`}
          ref={hourRef}
          onClick={() => setActiveColumn('hour')}
        >
          <div className={styles.columnLabel}>Hour</div>
          <div className={styles.scrollContainer}>
            {displayHours.map((h) => (
              <div
                key={h}
                data-value={h}
                className={`${styles.timeCell} ${hours === h ? styles.selected : ''}`}
                onClick={() => handleHourClick(h)}
              >
                {formatHour(h)}
              </div>
            ))}
          </div>
        </div>

        {/* Minutes Column */}
        <div
          className={`${styles.timeColumn} ${activeColumn === 'minute' ? styles.activeColumn : ''}`}
          ref={minuteRef}
          onClick={() => setActiveColumn('minute')}
        >
          <div className={styles.columnLabel}>Minute</div>
          <div className={styles.scrollContainer}>
            {minutesArray.map((m) => (
              <div
                key={m}
                data-value={m}
                className={`${styles.timeCell} ${minutes === m ? styles.selected : ''}`}
                onClick={() => handleMinuteClick(m)}
              >
                {formatMinute(m)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.timePickerFooter}>
        <button className={styles.cancelButton} onClick={handleCancel}>
          Cancel
        </button>
        <button className={styles.applyButton} onClick={handleApply}>
          Apply
        </button>
      </div>
    </div>
  );
};

export default TimePicker;
