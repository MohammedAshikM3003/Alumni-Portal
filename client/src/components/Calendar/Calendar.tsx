import React, { useState } from 'react';
import styles from './Calendar.module.css';

interface CalendarProps {
  value?: string;
  onChange?: (date: string) => void;
  onClose?: () => void;
  theme?: string;
  yearRange?: string;
}

const Calendar = ({ value, onChange, onClose, theme = 'admin', yearRange = 'default' }: CalendarProps) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value.split('-').map(Number).map((n, i) => i === 1 ? n - 1 : n) as any) : today);
  const [viewMode, setViewMode] = useState('day');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const weekDays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handlePrevYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
  };

  const handleNextYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    // Auto-apply the selection
    if (onChange) {
      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(newDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${dayStr}`;
      onChange(formattedDate);
    }
    if (onClose) onClose();
  };

  const handleMonthClick = (monthIndex: number) => {
    const newDate = new Date(currentDate.getFullYear(), monthIndex, selectedDate?.getDate() || 1);
    setSelectedDate(newDate);
    setCurrentDate(newDate);
    setViewMode('day');
  };

  const handleYearClick = (year: number) => {
    const newDate = new Date(year, selectedDate?.getMonth() || currentDate.getMonth(), selectedDate?.getDate() || 1);
    setSelectedDate(newDate);
    setCurrentDate(newDate);
    setViewMode('month');
  };

  const handleApply = () => {
    if (selectedDate && onChange) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      onChange(formattedDate);
    }
    if (onClose) onClose();
  };

  const handleCancel = () => {
    if (onClose) onClose();
  };

  const isSelectedDate = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentDate.getMonth() &&
      selectedDate.getFullYear() === currentDate.getFullYear()
    );
  };

  const isSelectedMonth = (monthIndex: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getMonth() === monthIndex &&
      selectedDate.getFullYear() === currentDate.getFullYear()
    );
  };

  const isSelectedYear = (year: number) => {
    if (!selectedDate) return false;
    return selectedDate.getFullYear() === year;
  };

  const isTodayDate = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  const renderDayView = () => {
    const days = [];
    const totalCells = 42; // 6 rows × 7 days

    // Previous month's days
    const prevMonthDays = startingDayOfWeek;
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    const prevMonthLastDay = prevMonth.getDate();

    for (let i = prevMonthDays - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} className={`${styles.dayCell} ${styles.otherMonth}`}>
          {prevMonthLastDay - i}
        </div>
      );
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = isSelectedDate(day);
      const isToday = isTodayDate(day);
      days.push(
        <div
          key={`current-${day}`}
          className={`${styles.dayCell} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''}`}
          onClick={() => handleDateClick(day)}
        >
          {day}
        </div>
      );
    }

    // Next month's days
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <div key={`next-${day}`} className={`${styles.dayCell} ${styles.otherMonth}`}>
          {day}
        </div>
      );
    }

    return days;
  };

  const renderMonthView = () => {
    return monthsShort.map((month, index) => (
      <div
        key={month}
        className={`${styles.monthCell} ${isSelectedMonth(index) ? styles.selected : ''}`}
        onClick={() => handleMonthClick(index)}
      >
        {month}
      </div>
    ));
  };

  const renderYearView = () => {
    const currentYear = today.getFullYear();
    let startYear, endYear;

    // Extended range for DOB fields (1950 to current year)
    if (yearRange === 'dob') {
      startYear = 1950;
      endYear = currentYear;
    } else {
      // Default: 10 years before and after current year
      startYear = currentYear - 10;
      endYear = currentYear + 10;
    }

    const years = [];

    for (let year = endYear; year >= startYear; year--) {
      years.push(year);
    }

    return years.map((year) => (
      <div
        key={year}
        className={`${styles.yearCell} ${isSelectedYear(year) ? styles.selected : ''}`}
        onClick={() => handleYearClick(year)}
      >
        {year}
      </div>
    ));
  };

  return (
    <div className={`${styles.calendarContainer} ${styles[theme]}`}>
      <div className={styles.calendarHeader}>
        <div className={styles.viewTabs}>
          <button
            type="button"
            className={`${styles.viewTab} ${viewMode === 'day' ? styles.activeTab : ''}`}
            onClick={() => setViewMode('day')}
          >
            Day
          </button>
          <button
            type="button"
            className={`${styles.viewTab} ${viewMode === 'month' ? styles.activeTab : ''}`}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
          <button
            type="button"
            className={`${styles.viewTab} ${viewMode === 'year' ? styles.activeTab : ''}`}
            onClick={() => setViewMode('year')}
          >
            Year
          </button>
        </div>
        <button type="button" className={styles.closeButton} onClick={handleCancel}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {viewMode !== 'year' && (
        <div className={styles.monthYearHeader}>
          <button 
            type="button"
            className={styles.navButton} 
            onClick={viewMode === 'month' ? handlePrevYear : handlePrevMonth}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className={styles.monthYear}>
            {viewMode === 'month' ? currentDate.getFullYear() : `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          </div>
          <button 
            type="button"
            className={styles.navButton} 
            onClick={viewMode === 'month' ? handleNextYear : handleNextMonth}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}

      <div className={styles.calendarBody}>
        {viewMode === 'day' && (
          <>
            <div className={styles.weekDaysHeader}>
              {weekDays.map((day) => (
                <div key={day} className={styles.weekDay}>
                  {day}
                </div>
              ))}
            </div>
            <div className={styles.daysGrid}>{renderDayView()}</div>
          </>
        )}
        
        {viewMode === 'month' && (
          <div className={styles.monthsGrid}>{renderMonthView()}</div>
        )}

        {viewMode === 'year' && (
          <>
            <div className={styles.yearViewHeader}>Select Year</div>
            <div className={styles.yearsGrid}>{renderYearView()}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default Calendar;
