import Sidebar from './Components/Sidebar/Sidebar';
import styles from './JobReference_Form.module.css';

const JobReference_Form = ({ onLogout }) => {

  return (
    <div className={styles.pageContainer}>

      {/* Sidebar Navigation (Collapsed State) */}
      <Sidebar onLogout={onLogout} currentView="job_reference_history" />

      {/* Main Content Area */}
      <main className={styles.mainContent}>
          {/* Navigation Back */}
          <div className={styles.backButton} onClick={() => window.history.back()}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </div>

        {/* Centered Form Wrapper */}
        <div className={styles.formWrapper}>
          <div className={styles.formCard}>
            
            {/* Card Header */}
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.formTitle}>Submit Job Reference</h2>
                <p className={styles.formSubtitle}>
                  Provide details about the career opportunity you'd like to share with the alumni community.
                </p>
              </div>
            </div>

            {/* Form Fields Container */}
            <form className={styles.formContent}>
              <div className={styles.inputGrid}>
                
                {/* Field: Company Name */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Company Name</label>
                  <input 
                    type="text" 
                    className={styles.inputField} 
                    placeholder="e.g. Microsoft" 
                  />
                </div>

                {/* Field: Role / Position */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Role / Position</label>
                  <input 
                    type="text" 
                    className={styles.inputField} 
                    placeholder="e.g. Senior Software Engineer" 
                  />
                </div>

                {/* Field: Target Branch */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Target Branch / Department</label>
                  <input 
                    type="text" 
                    className={styles.inputField} 
                    placeholder="e.g. IT / CSE / EEE" 
                  />
                </div>

                {/* Field: Number of Vacancies */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Number of Vacancies</label>
                  <input 
                    type="text" 
                    className={styles.inputField} 
                    placeholder="e.g. 5" 
                  />
                </div>
                
                {/* Field: Location */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Job Location</label>
                  <input 
                    type="text" 
                    className={styles.inputField} 
                    placeholder="e.g. Salem / Chennai / Banglore" 
                  />
                </div>

                {/* Field: Job Type */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Mode of Work</label>
                  <select className={styles.inputField} defaultValue="" required>
                    <option value="" disabled hidden>Select mode of work</option>
                    <option value="remote">Offline</option>
                    <option value="hybrid">Online</option>
                    <option value="onsite">Hybird</option>
                  </select>
                </div>

              </div>

              {/* Submit Button */}
              <button type="button" className={styles.submitBtn}>
                <span className="material-symbols-outlined">send</span>
                Submit Job Reference
              </button>
            </form>

          </div>
        </div>
      </main>
    </div>
  );
};

export default JobReference_Form;