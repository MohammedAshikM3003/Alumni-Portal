import { useNavigate } from 'react-router-dom';
import styles from './AD_Event_and_Reunion_Invitation.module.css';
import Sidebar from './Components/Sidebar/Sidebar';

const Admin_Event_and_Reunion_Invitation = ( { onLogout } ) => {
  const navigate = useNavigate();
  // Quick Info data
  const quickInfo = [
    { icon: 'calendar_month', title: 'Date & Time', value: 'Dec 15, 2024 • 10:00 AM' },
    { icon: 'location_on', title: 'Location', value: 'Main Auditorium, KSRCE' },
    { icon: 'confirmation_number', title: 'Registration', value: 'Open until Dec 10' },
  ];

  return (
    <div className={styles.pageContainer}>
      
      {/* Side Navigation */}
        <Sidebar onLogout={onLogout} currentView={'event_and_reunion_history'} />

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Back Button */}
        <div className={styles.backButton} onClick={() => navigate('/admin/event_and_reunion_history')} >
          <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
        </div>
        
        <div className={styles.contentWrapper} >
          {/* 1. Top Section: Header */}
          <header className={styles.headerSection}>
            <div className={styles.headerContent}>
              <span className={styles.upcomingBadge}>Upcoming Reunion</span>
              <h1 className={styles.mainTitle}>Silver Jubilee Reunion</h1>
              
              <div className={styles.speakerProfile}>
                <div className={styles.speakerAvatar}>
                  <img 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKo_gjDKaz3iH4y5EaHKmadJYejgKgXGBaVK1m_tXPPQ5j7EMj0EYx2ek-7_1s8Za6K4QLfc3pdrozqcR0ZT26I5sLvTDyVda7Tr9q6gZLFW-hYs8d9xhrh7J6ofqMIqHImz9gB-DP7RpRItkIIxjI8zY74hO6ad71Vwd1WM01ZuJ5bgkAaQOWDeNifn613rOjWIvulH58MSamQrSJAoo0SjT5anLaCzbStZwALgDI4FxX2kk0DrVv7kx0yIPcGPgd4Pe-HoVruvsU" 
                    alt="Dr Sarah Mitchell" 
                    onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
                  />
                </div>
                <div>
                  <h3 className={styles.speakerName}>Dr. Sarah Mitchell</h3>
                  <p className={styles.speakerRole}>Chief Academic Officer</p>
                </div>
              </div>
            </div>
          </header>

          {/* Quick Info Grid */}
          <section className={styles.quickInfoGrid}>
            {quickInfo.map((info, index) => (
              <div key={index} className={styles.infoCard}>
                <span className={`material-symbols-outlined ${styles.infoIcon}`}>
                  {info.icon}
                </span>
                <div>
                  <p className={styles.infoLabel}>{info.title}</p>
                  <p className={styles.infoValue}>{info.value}</p>
                </div>
              </div>
            ))}
          </section>

          {/* 2. Center Section: Event Description */}
          <section className={styles.descriptionSection}>
            <div className={styles.descriptionCard}>
              <h2 className={styles.sectionTitle}>
                <span className="material-symbols-outlined">description</span>
                Event Description
              </h2>
              <div className={styles.proseText}>
                <p>
                  Join us for a historic milestone as we celebrate 25 years of excellence, innovation, and community at K.S. Rangasamy College of Engineering. This Silver Jubilee Reunion is a dedicated space for alumni to reconnect with long-lost friends, share professional journeys, and witness the remarkable transformation of our alma mater.
                </p>
                <p>
                  The event will feature keynote addresses from distinguished alumni, departmental tours, and a gala dinner to honor the legacy of our institution. We look forward to welcoming you back to the campus where it all began. Revisit your favorite spots on campus, meet your mentors, and inspire the current generation of engineers with your success stories.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Bottom Section: Event Highlights */}
          <section className={styles.highlightsSection}>
            <div className={styles.highlightsHeader}>
              <h2 className={styles.sectionTitle}>
                <span className="material-symbols-outlined">auto_awesome_motion</span>
                Event Highlights
              </h2>
              <button className={styles.viewGalleryLink}>
                View Full Gallery <span className="material-symbols-outlined">open_in_new</span>
              </button>
            </div>

            {/* Balanced Grid Layout (5 Photos) */}
            <div className={styles.photoGrid}>
              
              {/* Large Featured 1 */}
              <div className={`${styles.photoWrapper} ${styles.gridItemLarge}`}>
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPxC9Oh_3tygRoHPfVI-auBhIArRgunwmFNlVdqzZRsCxFjoNtraP8V1N2IRaQkh3FJ5l2K6wNvR07Znm2vWFXP8a0uEf6bEnOXpu1GWkQISisOgaH_8WKlQKGFpvsxP7J4atKaLv4KcMIh_WhQTNSeirSJNP9KJYYnZVqj_5YiMnKPxQdi90gh1UhhfkbVFXUtUWShVBLuckYFcHSaa2cnaMcUqgZGeJfGN_TE9VxO13NvuBih8gac8CdTbZJn8aZasqbFw1bwWWj" 
                  alt="Networking Gala" 
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80"; }}
                />
                <div className={styles.photoOverlay}>
                  <span>Networking Gala</span>
                </div>
              </div>

              {/* Medium Image 2 */}
              <div className={`${styles.photoWrapper} ${styles.gridItemMedium}`}>
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEKGePryLaJKWcC3tKqe6dEp5RfYl4xY6rPQ9fMiJn9eIVCoEU4fACQAJ91mCS74lxECDNFawkUHNX32FK8L8eHx9hOZxTULZLQc4Fj3UqX7cecDOMRoqQ4O9BB2UkVV9TjlW3UM2e8a-UCkgcb8sXzghErzwbs5cu2RhK_4pDnw1SRa9CWeR82Uuqo2tyEE54xdBsBVWCQPbifD8mCwFr6pps_o5mXA5s_BhLawL7DBtdAMC1HU4cE0qxCYERufhJ215JCTw4-Zhh" 
                  alt="Keynote Sessions" 
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"; }}
                />
                <div className={styles.photoOverlay}>
                  <span>Keynote Sessions</span>
                </div>
              </div>

              {/* Small Image 3 */}
              <div className={`${styles.photoWrapper} ${styles.gridItemSmall}`}>
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhOo1In-DlJ7p5x_BYIZh7bJ9RFLqI85eom51CCxxPlE83SflJwwTJub7R2DJ228fMnasoJyzx6EWtMjUSgbS5L8aHzqVgsRGn5w1KP1_qbX9-i6fF4CSWptl09gGBcozkrjNrqho7pDHzuWp9Go3r6uWa291ANOr2N2adVdhvMzU5x9p6WyehK9O5MxjRWBzEZ01kJ9-pDK0ZikqErQ3xSVPxCxosA0GCcnDkOTtQpGIsJrC3pTFZCC3mh2PHhNRpZdz-uH0YadaN" 
                  alt="Campus Facade" 
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80"; }}
                />
              </div>

              {/* Small Image 4 */}
              <div className={`${styles.photoWrapper} ${styles.gridItemSmall}`}>
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBg0vGi3cGWwTSRFKKOIGHM8AjTLgXFoB-xRudktd5nQdAdU_h8uJufqSh6UNgtqMbYcKQkJJgPjY8AX0av23_sRjJo2pzeTsAXeu0wfJTBDx5PTiTxYiNXXP8RczfWlIY1rUHhsG68lT_f3zMqIDfZa-NWXK4HGQE32h-fRUgkEsp125mePCPNOr4F_eN5nhFC_e_qDROVm-8v1FvdPjKLb2VUY2sxdhaFvNXW7TnZbPdCx-RHRp0dsMG1xDaGgJEVuE6pTy2a6ncu" 
                  alt="Alumni Networking" 
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1523580494112-7498a8eb62ad?auto=format&fit=crop&w=800&q=80"; }}
                />
              </div>

              {/* Small Image 5 */}
              <div className={`${styles.photoWrapper} ${styles.gridItemSmall}`}>
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDu9liCK3zlrjZxIb_70135169NoUuk6gvCjtoo-c6a_32YQPQQK7qzlwHy79-rSP0S4pEOvb0GhKRGGIYXm-EhJ2eX202VWj8fYyt9Px9jq6a9s6ALIzQOGwc1OWYvG0Z9zRdBdNC2fVGNyTa83aT29mHQIIBS2ynb6QJ15zQuAAGwAQe4CHCggMLLmOh1QPSPOD_TCldGcltCpP0054YMC9UcbHncV4SvdgDEoAP2mGvGSsiB2ymx2hdSLVMbVHtmLV6gAF8VvBfK" 
                  alt="Interactive Workshop" 
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80"; }}
                />
              </div>

            </div>
          </section>
        </div>

      </main>

      {/* Quick Info Floating Button */}
      <div className={styles.floatingAction} onClick={() => { navigate('/admin/feedback') }} >
        <button className={styles.feedbackBtn}>
          <span className="material-symbols-outlined">rate_review</span>
          <span>Feedback</span>
        </button>
      </div>

    </div>
  );
};

export default Admin_Event_and_Reunion_Invitation;