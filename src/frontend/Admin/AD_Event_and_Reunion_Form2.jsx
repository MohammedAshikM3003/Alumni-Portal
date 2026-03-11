import styles from './AD_Event_and_Reunion_Form2.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { DateInput } from '../../components/Calendar';

const Admin_Event_and_Reunion_Form2 = ( { onLogout } ) => {
  return (
    <div className={styles.pageContainer}>
      
      {/* Sidebar */}
      <Sidebar onLogout={onLogout} currentView={'event_and_reunion_history'} />


      {/* Main Content */}
      <main className={styles.mainContent}>
          {/* Back Button */}
          <div className={styles.backButton} onClick={() => window.history.back()}>
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Back</span>
          </div>
        
        {/* Header */}
        <header className={styles.pageHeader}>
          <div>
            <h2 className={styles.pageTitle}>Invitation Creator</h2>
            <p className={styles.pageSubtitle}>Generate professional event flyers for alumni engagement.</p>
          </div>
          
          <div className={styles.headerActions}>
            <button className={styles.notificationBtn}>
              <span className="material-symbols-outlined">notifications</span>
              <span className={styles.notificationDot}></span>
            </button>
            <button className={styles.profileBtn}>
              <div className={styles.profileAvatar}>
                <span className="material-symbols-outlined">person</span>
              </div>
            </button>
          </div>
        </header>



        {/* Workspace Area */}
        <div className={styles.workspaceWrapper}>
          <div className={styles.workspaceGrid}>
            
            {/* Left Column: Form Controls (Scrollable) */}
            <div className={styles.controlsCol}>
              
              {/* Upload Banner Section */}
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className="material-symbols-outlined">upload_file</span>
                  <h3>College Banner / Header</h3>
                </div>
                <div className={styles.uploadArea}>
                  <input type="file" accept="image/*" className={styles.hiddenFileInput} id="banner-upload" />
                  <div className={styles.uploadBox}>
                    <div className={styles.uploadIconWrapper}>
                      <span className="material-symbols-outlined">cloud_upload</span>
                    </div>
                    <p className={styles.uploadTitle}>Click to Upload or Drag & Drop</p>
                    <p className={styles.uploadSubtitle}>PNG, JPG or JPEG (Max 5MB)</p>
                    <p className={styles.uploadHint}>High-resolution banner recommended</p>
                  </div>
                </div>
              </section>

              {/* Generate via Description */}
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <h3>Generate via Description</h3>
                </div>
                <form className={styles.formGroup} onSubmit={(e) => e.preventDefault()}>
                  <div className={styles.inputWrapper}>
                    <label htmlFor="event-desc" className={styles.inputLabel}>Event Description</label>
                    <textarea 
                      id="event-desc" 
                      className={styles.textareaCustom} 
                      rows="6" 
                      placeholder="Describe your event in detail (e.g., A networking brunch for 2015 graduates featuring industry speakers at the Grand Hall...)"
                    ></textarea>
                  </div>
                  <button type="submit" className={styles.generateBtn}>
                    <span className="material-symbols-outlined">colors_spark</span>
                    <span>Generate</span>
                  </button>
                </form>
              </section>

              {/* Generate via Details */}
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className="material-symbols-outlined">edit_note</span>
                  <h3>Generate via Details</h3>
                </div>
                <form className={styles.formGroup} onSubmit={(e) => e.preventDefault()}>
                  <div className={styles.detailsGrid}>
                    <div className={styles.fullWidth}>
                      <label htmlFor="event-name" className={styles.inputLabel}>Event Name</label>
                      <input id="event-name" type="text" className={styles.inputCustom} placeholder="e.g. Homecoming 2024" />
                    </div>
                    <div>
                      <label htmlFor="event-date" className={styles.inputLabel}>Date</label>
                      <DateInput theme="admin" id="event-date" className={styles.inputCustom} />
                    </div>
                    <div>
                      <label htmlFor="event-time" className={styles.inputLabel}>Time</label>
                      <input id="event-time" type="time" className={styles.inputCustom} />
                    </div>
                    <div className={styles.fullWidth}>
                      <label htmlFor="event-location" className={styles.inputLabel}>Location</label>
                      <input id="event-location" type="text" className={styles.inputCustom} placeholder="e.g. Main Auditorium, K.S.R Campus" />
                    </div>
                  </div>
                  <button type="submit" className={styles.generateBtn}>
                    Generate
                  </button>
                </form>
              </section>
              
            </div>

            {/* Right Column: Flyer Preview */}
            <div className={styles.previewCol}>
              
              <div className={styles.previewBox}>
                <div className={styles.previewPlaceholderIcon}>
                  <span className="material-symbols-outlined">image</span>
                </div>
                <h4 className={styles.previewTitle}>Flyer Preview</h4>
                <p className={styles.previewSubtitle}>
                  Fill in the details or provide a description on the left to generate your professional alumni invitation flyer.
                </p>
                <div className={styles.loadingDots}>
                  <span></span><span></span><span></span>
                </div>
              </div>

              {/* Send Button Area */}
              <div className={styles.sendActionArea}>
                <button className={styles.sendBtn}>
                  <span>Send Invitation</span>
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>

            </div>

          </div>
        </div>

      </main>
    </div>
  );
};

export default Admin_Event_and_Reunion_Form2;