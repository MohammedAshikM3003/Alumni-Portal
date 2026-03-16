import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';
import styles from './Al_Accept_Invitation.module.css';

export default function Alumini_MailForm({ onLogout }) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [startYear, setStartYear] = useState('');

  const handleStartYearChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 4) {
      // If the value is 4 digits, check if it's between 2000 and 2100
      if (value.length === 4) {
        const year = parseInt(value);
        if (year < 2000 || year > 2100) {
          return; // Don't update if year is less than 2000 or greater than 2100
        }
      }
      setStartYear(value);
    }
  };

  const getEndYear = () => {
    if (startYear.length === 4) {
      return (parseInt(startYear) + 4).toString();
    }
    return '';
  };

  return (
    <div className={styles.pageContainer}>

      {/* Sidebar Navigation (Collapsed State) */}
      <Sidebar onLogout={onLogout} currentView={'mail'} />

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Mobile Header Row */}

        <div className={styles.contentWrapper}>
          
          {/* Back Button */}
          <div className={styles.backButton} onClick={() => window.history.back()}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </div>
          
          {/* Top Email Message Card */}
          <div className={styles.emailMessageCard}>
            <div className={styles.emailHeader}>
              <div className={styles.headerLeft}>
                <span className={`material-symbols-outlined ${styles.mailIcon}`}>mail</span>
                <span className={styles.badgeUpdate}>UPDATE</span>
                <span className={styles.sender}>From: Alumni Office</span>
                <span className={styles.divider}>|</span>
                <span className={styles.subject}>Invitation: Virtual Networking Session</span>
              </div>
              <button className={styles.collapseBtn} onClick={() => setIsExpanded(!isExpanded)}>
                <span className={`material-symbols-outlined ${isExpanded ? styles.iconExpanded : ''}`}>
                  expand_more
                </span>
              </button>
            </div>
            <div className={styles.emailBody}>
              {isExpanded ? (
                <p>Dear Alumni, You are invited to our session next Friday for an exclusive networking event with technology professionals. Register via the link provided in your portal.</p>
              ) : (
                <p>Dear Alumni, You are invited to our session next Friday...</p>
              )}
            </div>
          </div>

          {/* Bottom Form Card */}
          <div className={styles.formCard}>
            <form className={styles.formContent}>
              <div className={styles.inputGrid}>
                
                {/* Full Name */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Full Name</label>
                  <input 
                    type="text" 
                    className={styles.inputField} 
                    placeholder="e.g. Alexander Pierce" 
                  />
                </div>

                {/* Designation */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Designation</label>
                  <input 
                    type="text" 
                    className={styles.inputField} 
                    placeholder="e.g. Senior Product Designer" 
                  />
                </div>

                {/* Company Name */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Company Name</label>
                  <input 
                    type="text" 
                    className={styles.inputField} 
                    placeholder="e.g. Google LLC" 
                  />
                </div>

                {/* Mobile No */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Mobile No</label>
                  <input 
                    type="tel" 
                    className={styles.inputField} 
                    placeholder="e.g. +1 (555) 000-0000" 
                  />
                </div>

                {/* Personal Email */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Personal Email</label>
                  <input 
                    type="email" 
                    className={styles.inputField} 
                    placeholder="e.g. alex@gmail.com" 
                  />
                </div>

                {/* Official Email */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Official Email</label>
                  <input 
                    type="email" 
                    className={styles.inputField} 
                    placeholder="e.g. a.pierce@google.com" 
                  />
                </div>

                {/* Location */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Location</label>
                  <input 
                    type="text" 
                    className={styles.inputField} 
                    placeholder="e.g. San Francisco, CA" 
                  />
                </div>

                {/* Batch (Year of Passing) */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Batch (Year of Passing)</label>
                  <div className={styles.batchFieldWrapper}>
                    <input 
                      type="text" 
                      className={styles.batchInputField} 
                      placeholder="Start Year"
                      value={startYear}
                      onChange={handleStartYearChange}
                      maxLength={4}
                    />
                    <span className={styles.batchSeparator}>-</span>
                    <input 
                      type="text" 
                      className={styles.batchInputField} 
                      placeholder="End Year"
                      value={getEndYear()}
                      readOnly
                    />
                  </div>
                </div>

              </div>

              {/* Submit Button */}
              <div className={styles.submitContainer}>
                <button type="button" className={styles.submitBtn}>
                  Submit Information 
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
};
