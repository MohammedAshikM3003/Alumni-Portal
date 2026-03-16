import { useNavigate } from 'react-router-dom';
import styles from './AD_Dashboard.module.css';
import Sidebar from './Components/Sidebar/Sidebar';


const Admin_Dashboard = ( { onLogout } ) => {
  const navigate = useNavigate();



  return (
    <div className={styles.dashboardWrapper}>
      {/* Sidebar removed as requested */}
      <Sidebar onLogout={onLogout} currentView={'dashboard'} />

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.collegeName}>
              K.S.R College of Engineering
            </h1>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.searchContainer}>
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
                <div className={styles.userDetails}>
                  <p className={styles.userName}>Mohammed Ashik M</p>
                  <p className={styles.userClass}>Class of 2018</p>
                </div>
                <div className={styles.userAvatar}>
                  <img
                    alt="User profile"
                    className={styles.imageFullCover}
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDxsNmGHJS4TO6MjPYdAg6oNXiyZ7Xh78kZgm9lsfgXsBK2T70asN2eP7qf_lvE8bRMgMvaqSUHihcEO2W_XKcwX5W4MYd106wTTZbnc-ltRKtYlnXqg72coW16fUw8Gg2rEYPURS73pTyg7sgl_DNd-R4bpG9jeM2WP2WzwaEZnA11ZEpbUqfCEqLX8vtvoEJ8SsQsh_W1YP3aEooWbTJSSIcMsuHlEQ9QujCTaMRhjsMwC9tK1YFfoScM2bkVeu8ov-qFc0BQJJA"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className={styles.dashboardContent}>
          {/* Cards Row 1 */}
          <div className={styles.cardsRow}>
            <div className={`${styles.card} ${styles.overlapColumn}`}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Mail</h2>
                <span className={styles.cardBadge}>2 New</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.mailPreview}>Welcome back to the network, Mohammed! We have some new alumni connect...</div>
                <div className={styles.mailPreview}>New job referral available for SDE-1 role at Google. Interested...</div>
              </div>
              <button className={styles.cardAction} onClick={() => { navigate('/admin/mail') }} >Go to Inbox →</button>
            </div>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>💼</div>
                <h2 className={styles.cardTitle}>Career Hub</h2>
                <span className={styles.cardStatus}>12 Active</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.jobPreview}><b>Senior Dev, Google</b> <span>Referral by Rahul S.</span></div>
                <div className={styles.jobPreview}><b>Lead Architect, IBM</b> <span>Open Referral</span></div>
              </div>
              <button className={styles.cardActionOutline} onClick={() => { navigate('/admin/job_and_reference') }} >Explore All Jobs</button>
            </div>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>💸</div>
                <span className={styles.cardStatusGreen}>Scholarship Goal</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.donationTitle}>Latest Department Donation</div>
                <div className={styles.donationAmount}>₹50,000</div>
                <div className={styles.donationDept}>Computer Science Dept</div>
                <div className={styles.donationTime}>Received 2 hours ago</div>
              </div>
              <button className={styles.cardActionPrimary} onClick={() => { navigate('/admin/donation_history') }} >View History</button>
            </div>
          </div>
          {/* Cards Row 2 */}
          <div className={styles.cardsRow}>
            <div className={`${styles.card} ${styles.overlapColumn}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardUpcoming}>Upcoming</span>
                <span className={styles.cardIcon}>📅</span>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.reunionTitle}>Alumni Reunion 2024</h3>
                <p className={styles.reunionDesc}>Join us for an evening of nostalgia and networking as we celebrate 40 years of excellence. Reconnect with old friends and make new memories.</p>
                <div className={styles.reunionCountdown}><div><b>24</b> Days</div><div><b>08</b> Hrs</div></div>
                <button className={styles.reunionBtn} onClick={() => { navigate('/admin/event_and_reunion_history') }} >RSVP Today</button>
              </div>
            </div>
            <div className={styles.cardAchievements}>
              <div className={styles.achievementsHeader}>
                <div className={styles.cardIcon}>🏆</div>
                <h2 className={styles.achievementsTitle}>Achievements & News</h2>
              </div>
              <div className={styles.achievementsGrid}>
                <div className={styles.achievementItem}>
                  <span className={styles.achievementDate}>Oct 24, 2023</span>
                  <h4 className={styles.achievementTitle}>Startup center secures ₹5Cr Funding</h4>
                  <p className={styles.achievementDesc}>Major grant to boost innovation hub, benefiting 50+ student startups across departments.</p>
                  <a className={styles.achievementReadMore} href="#">Read More →</a>
                </div>
                <div className={styles.achievementItem}>
                  <span className={styles.achievementDate}>Oct 22, 2023</span>
                  <h4 className={styles.achievementTitle}>Dr. Arul wins "Researcher"</h4>
                  <p className={styles.achievementDesc}>Honored for breakthrough contributions in Renewable Energy Systems and sustainable engineering.</p>
                  <a className={styles.achievementReadMore} href="#">Read More →</a>
                </div>
                <div className={styles.achievementItem}>
                  <span className={styles.achievementDate}>Oct 20, 2023</span>
                  <h4 className={styles.achievementTitle}>Industry Partnership</h4>
                  <p className={styles.achievementDesc}>MoU signed for internship programs and specialized training modules for final year students.</p>
                  <a className={styles.achievementReadMore} href="#">Read More →</a>
                </div>
                <div className={styles.achievementItem}>
                  <span className={styles.achievementDate}>Oct 18, 2023</span>
                  <h4 className={styles.achievementTitle}>Alumni Sports Meet</h4>
                  <p className={styles.achievementDesc}>Join the annual football and cricket tournament at the campus grounds. Register now.</p>
                  <a className={styles.achievementReadMore} href="#">Read More →</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Night mode button removed */}
      </main>

    </div>
  );
};

export default Admin_Dashboard;
