import styles from "./Dashboard.module.css";
import Sidebar from "../Components/Sidebar/Sidebar";

export default function Dashboard({ onLogout, onNavigate }) {
  return (
    <div className={styles.dashboardContainer}>
      
      {/* Sidebar */}
      <Sidebar onLogout={onLogout}  />

      {/* Main */}
      <main className={styles.mainContent}>
        
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={`${styles.collegeName} ${styles.hideOnMedium}`}>
              K.S.R College of Engineering
            </h1>
          </div>

          <div className={styles.headerRight}>
            <div className={`${styles.searchContainer} ${styles.hideOnSmall}`}>
              <input
                type="text"
                placeholder="Search alumni, jobs..."
                className={styles.searchInput}
              />
              <span className={`material-symbols-outlined ${styles.searchIcon}`}>
                search
              </span>
            </div>

            <div className={styles.headerFlexContainer}>
              <button className={styles.notificationBtn}>
                <span className="material-symbols-outlined">notifications</span>
                <span className={styles.notificationDot}></span>
              </button>

              <div className={styles.divider}></div>

              <div className={styles.userInfo}>
                <div className={`${styles.userDetails} ${styles.hideOnLarge}`}>
                  <p className={styles.userName}>Mohammed Ashik M</p>
                  <p className={styles.userClass}>Class of 2018</p>
                </div>
                <div className={styles.userAvatar}>
                  <img
                    alt="User profile"
                    className={styles.imageFullCover}
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCy29l1WzunyAjiRD6SzVOveOoOJ4sRZWjusYjhMmBN8mEcEU612GP9-RWaw7OPzq_9vdwrx7a-_tRk7usal0ltsyGKefbK7NlKRwNMKlx5dyAsY_t6_9foDZay8Za9LYG4PLA2ZOORrD_AKThNfSBNKXRXR0GqVHV49AkIoLI4Z42dUOGQn1S5Do6x-CeFLH6R9seCFXLyF2BGuBd2sm2dDHuA1ffwbhc-f8KrfvnqpWMrPvcTMvaeWMqC26-CypNOPXTK_hzGfbPX"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className={styles.contentArea}>
          <div className={styles.contentWrapper}>
            
            <section className={styles.cardsGrid}>

              {/* Latest Messages Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.iconBox} ${styles.iconBoxBlue}`}>
                    <span className={`material-symbols-outlined ${styles.iconBlue}`}>mail</span>
                  </div>
                  <span className={`${styles.badge} ${styles.badgeNew}`}>2 New</span>
                </div>
                <h3 className={styles.cardTitle}>Latest Messages</h3>
                <div className={styles.cardContent}>
                  <div className={styles.messageItem}>
                    <p className={`${styles.messageLabel} ${styles.messageLabelAdmin}`}>Admin</p>
                    <p className={styles.messageText}>Welcome to the network, Mohammed!</p>
                    <p className={styles.messageTime}>2 hours ago</p>
                  </div>
                  <div className={styles.messageItem}>
                    <p className={`${styles.messageLabel} ${styles.messageLabelCareer}`}>Career Cell</p>
                    <p className={styles.messageText}>New job referral available for SDE-1...</p>
                    <p className={styles.messageTime}>Yesterday</p>
                  </div>
                </div>
                <button 
                  className={`${styles.buttonBase} ${styles.buttonSecondary}`}
                  onClick={() => onNavigate && onNavigate('mail')}
                >
                  Go to Inbox
                </button>
              </div>

              {/* Career Hub Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.iconBox} ${styles.iconBoxEmerald}`}>
                    <span className={`material-symbols-outlined ${styles.iconEmerald}`}>work_outline</span>
                  </div>
                  <span className={styles.badgeInfo}>12 active postings</span>
                </div>
                <h3 className={styles.cardTitle}>Career Hub</h3>
                <div className={styles.cardContent}>
                  <div className={styles.careerItem}>
                    <div>
                      <p className={styles.careerTitle}>Senior Dev, Google</p>
                      <p className={styles.careerSubtitle}>Referral by Rahul S.</p>
                    </div>
                    <span className={`material-symbols-outlined ${styles.iconPrimaryXl}`}>arrow_forward</span>
                  </div>
                  <div className={styles.careerItem}>
                    <div>
                      <p className={styles.careerTitle}>Lead Architect, IBM</p>
                      <p className={styles.careerSubtitle}>Open Referral</p>
                    </div>
                    <span className={`material-symbols-outlined ${styles.iconPrimaryXl}`}>arrow_forward</span>
                  </div>
                </div>
                <button className={`${styles.buttonBase} ${styles.buttonOutline}`}>Explore All Jobs</button>
              </div>

              {/* Giving Back Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.iconBox} ${styles.iconBoxOrange}`}>
                    <span className={`material-symbols-outlined ${styles.iconOrange}`}>payments</span>
                  </div>
                  <span className={styles.badgeOrange}>Scholarship Goal</span>
                </div>
                <h3 className={styles.cardTitleSmall}>Giving Back</h3>
                <p className={styles.cardDescription}>Support the Class of 2024 merit scholarships.</p>
                <div className={styles.progressSection}>
                  <div className={styles.progressHeader}>
                    <span>Progress</span>
                    <span>75% Achieved</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '75%' }}></div>
                  </div>
                  <p className={styles.progressText}>₹7.5L raised of ₹10L target</p>
                </div>
                <div className={styles.contributionsSection}>
                  <p className={styles.contributionsTitle}>Recent Contributions</p>
                  <div className={styles.contributionsList}>
                    <div className={styles.contributionItem}>
                      <span className={styles.contributionDate}>Oct 20</span>
                      <span className={styles.contributionAmount}>₹5,000</span>
                    </div>
                    <div className={styles.contributionItem}>
                      <span className={styles.contributionDate}>Oct 18</span>
                      <span className={styles.contributionAmount}>₹10,000</span>
                    </div>
                  </div>
                </div>
                <button className={`${styles.buttonBase} ${styles.buttonPrimary}`}>Donate Now</button>
              </div>

              {/* Grand Reunion Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.iconBox} ${styles.iconBoxPurple}`}>
                    <span className={`material-symbols-outlined ${styles.iconPurple}`}>event_upcoming</span>
                  </div>
                  <span className={styles.badgePurple}>Upcoming</span>
                </div>
                <h3 className={styles.cardTitleSmall}>Grand Reunion 2024</h3>
                <p className={styles.eventDescription}>Join us for an evening of nostalgia and networking as we celebrate 40 years of excellence.</p>
                <div className={styles.eventLocation}>
                  <span className={`material-symbols-outlined ${styles.eventLocationIcon}`}>location_on</span>
                  <span className={styles.eventLocationText}>Main Campus Auditorium</span>
                </div>
                <div className={styles.eventCountdown}>
                  <div className={styles.countdownBox}>
                    <p className={styles.countdownNumber}>14</p>
                    <p className={styles.countdownLabel}>Days</p>
                  </div>
                  <div className={styles.countdownBox}>
                    <p className={styles.countdownNumber}>08</p>
                    <p className={styles.countdownLabel}>Hrs</p>
                  </div>
                </div>
                <button className={`${styles.buttonBase} ${styles.buttonDark}`}>RSVP Today</button>
              </div>

              {/* Achievements & News Card */}
              <div className={`${styles.card} ${styles.cardWide}`}>
                <div className={styles.achievementsHeader}>
                  <div className={styles.achievementsHeaderInner}>
                    <div className={styles.iconBoxSky}>
                      <span className={`material-symbols-outlined ${styles.iconPrimaryXl}`}>military_tech</span>
                    </div>
                    <h3 className={styles.cardTitle}>Achievements &amp; News</h3>
                  </div>
                  <button className={styles.viewAllButton}>
                    View All <span className={`material-symbols-outlined ${styles.viewAllIcon}`}>open_in_new</span>
                  </button>
                </div>
                <div className={styles.newsGrid}>
                  <div className={styles.newsCard}>
                    <p className={styles.newsDate}>Oct 24, 2023</p>
                    <h4 className={styles.newsTitle}>Startup center secures ₹5Cr Funding</h4>
                    <p className={styles.newsDescription}>Major grant to boost innovation hub, benefiting 50+ student startups.</p>
                    <a className={styles.newsLink} href="#">
                      Read More <span className={`material-symbols-outlined ${styles.newsLinkIcon}`}>arrow_forward_ios</span>
                    </a>
                  </div>
                  <div className={styles.newsCard}>
                    <p className={styles.newsDate}>Oct 22, 2023</p>
                    <h4 className={styles.newsTitle}>Dr. Arul wins "Outstanding Researcher"</h4>
                    <p className={styles.newsDescription}>Honored for breakthrough contributions in Renewable Energy Systems.</p>
                    <a className={styles.newsLink} href="#">
                      Read More <span className={`material-symbols-outlined ${styles.newsLinkIcon}`}>arrow_forward_ios</span>
                    </a>
                  </div>
                  <div className={styles.newsCard}>
                    <p className={styles.newsDate}>Oct 20, 2023</p>
                    <h4 className={styles.newsTitle}>New Industry Partnership with Tech Corp</h4>
                    <p className={styles.newsDescription}>MoU signed for internship programs and specialized training modules.</p>
                    <a className={styles.newsLink} href="#">
                      Read More <span className={`material-symbols-outlined ${styles.newsLinkIcon}`}>arrow_forward_ios</span>
                    </a>
                  </div>
                  <div className={styles.newsCard}>
                    <p className={styles.newsDate}>Oct 18, 2023</p>
                    <h4 className={styles.newsTitle}>Alumni Sports Meet Registration Open</h4>
                    <p className={styles.newsDescription}>Join the annual football and cricket tournament at the campus grounds.</p>
                    <a className={styles.newsLink} href="#">
                      Read More <span className={`material-symbols-outlined ${styles.newsLinkIcon}`}>arrow_forward_ios</span>
                    </a>
                  </div>
                </div>
              </div>

            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
