import Sidebar from './Components/Sidebar/Sidebar';
import styles from './Mail_form.module.css';

export default function MailForm({ onLogout }) {

  return (
    <div className={styles.pageContainer}>

      {/* Sidebar Navigation (Collapsed State) */}
      <Sidebar onLogout={onLogout} currentView={'mail'} />

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Mobile Header Row */}

        <div className={styles.contentWrapper}>
          
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
              <button className={styles.collapseBtn}>
                <span className="material-symbols-outlined">expand_more</span>
              </button>
            </div>
            <div className={styles.emailBody}>
              <p>Dear Alumni, You are invited to our session next Friday...</p>
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
                  <div className={styles.selectWrapper}>
                    <select className={styles.selectField} defaultValue="">
                      <option value="" disabled>Select Year</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                      <option value="2021">2021</option>
                      <option value="2020">2020</option>
                    </select>
                    <span className={`material-symbols-outlined ${styles.selectIcon}`}>expand_more</span>
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
