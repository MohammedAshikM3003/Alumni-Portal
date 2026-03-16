import styles from './Al_View_Invitation.module.css';
import Sidebar from './Components/Sidebar/Sidebar';

const Alumini_View_Invitation = ({ onLogout }) => {

  return (
    <div className={styles.pageContainer}>
{/* Sidebar Navigation */}
      <Sidebar onLogout={onLogout} currentView="event_reunion" />

{/* Main Content Area */}
      <main className={styles.mainContent}>
{/* Navigation Back */}
        <div className={styles.backButton} onClick={() => window.history.back()}>
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back</span>
        </div>
        <br />

{/* Event Details Wrapper */}
        <div className={styles.eventContainer}>
          
{/* Left Panel: Event Poster */}
          <div className={styles.eventPoster}>
{/* Decorative background shapes */}
            <div className={styles.circleTop}></div>
            <div className={styles.circleBottom}></div>
            
            <div className={styles.posterContent}>
              <div className={styles.iconContainer}>
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <h2 className={styles.posterTitle}>
                40TH<br />
                ANNIVERSARY<br />
                ALUMNI GALA
              </h2>
              <hr className={styles.divider} />
              <p className={styles.posterDate}>Dec 15, 2024</p>
              <p className={styles.posterLocation}>Grand Ballroom</p>
            </div>
            
            <div className={styles.posterFooter}>
              SINCE 1984
            </div>
          </div>

{/* Right Panel: Event Information */}
          <div className={styles.eventInfo}>
            <span className={styles.badge}>UPCOMING EVENT</span>
            <h1 className={styles.eventTitle}>KSRCE 40th Anniversary Alumni Gala</h1>
            
            <div className={styles.infoStrip}>
              <div className={styles.infoBlock}>
                <div className={styles.infoIcon}>
                  <span className="material-symbols-outlined">calendar_today</span>
                </div>
                <div>
                  <p className={styles.infoLabel}>DATE</p>
                  <p className={styles.infoValue}>Dec 15, 2024</p>
                </div>
              </div>
              
              <div className={styles.infoBlock}>
                <div className={styles.infoIcon}>
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <div>
                  <p className={styles.infoLabel}>TIME</p>
                  <p className={styles.infoValue}>6:00 PM onwards</p>
                </div>
              </div>
              
              <div className={styles.infoBlock}>
                <div className={styles.infoIcon}>
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div>
                  <p className={styles.infoLabel}>LOCATION</p>
                  <p className={styles.infoValue}>Grand Ballroom</p>
                </div>
              </div>
            </div>

            <div className={styles.aboutSection}>
              <h3>About the Event</h3>
              <p>
                "A Night of Nostalgia & Networking. Join us for a special evening as we celebrate 40 years of academic excellence and alumni success."
              </p>
              <p>
                Gather with fellow graduates from across the decades to reminisce about your time at KSRCE. This landmark event features a keynote address from our distinguished founding members, a formal sit-down dinner, and plenty of opportunities to reconnect with old friends and expand your professional network.
              </p>
            </div>

            <div className={styles.featuresGrid}>
              <div className={styles.featureItem}>
                <span className={`material-symbols-outlined ${styles.checkIcon}`}>check</span>
                <span>Gala Dinner & Cocktail Reception</span>
              </div>
              <div className={styles.featureItem}>
                <span className={`material-symbols-outlined ${styles.checkIcon}`}>check</span>
                <span>Distinguished Alumni Awards</span>
              </div>
              <div className={styles.featureItem}>
                <span className={`material-symbols-outlined ${styles.checkIcon}`}>check</span>
                <span>Live Jazz Performance</span>
              </div>
              <div className={styles.featureItem}>
                <span className={`material-symbols-outlined ${styles.checkIcon}`}>check</span>
                <span>Networking Lounge Access</span>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Alumini_View_Invitation;