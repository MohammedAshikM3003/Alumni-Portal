import { useNavigate } from 'react-router-dom';
import styles from './Landing.module.css';
import NavBar from '../../components/Navbar/NavBar';
import collegeLogoSvg from '../../assets/KSR_College_Banner.svg';

export default function Landing() {

  const navigate = useNavigate();

  return (
    <div className={styles.body}>
      {/* Navigation */}
      <NavBar isLanding={true} />

      {/* Hero Section */}
      <section className={styles.hero} id="home">
        <div className={styles.containerStandard}>
          <div className={styles.badge}>
            <span className={styles.pulseWrapper}>
              <span className={styles.pulseRing}></span>
              <span className={styles.pulseDot}></span>
            </span>
            Global Network for Excellence
          </div>
          <h1 className={styles.heroTitle}>
            Connecting Generations,<br/>Building Legacies
          </h1>
          <p className={styles.heroDescription}>
            A premium space where K.S.R.C.E. graduates unite to mentor, grow, and lead the future of engineering across the globe.
          </p>
          <div className={styles.heroButtons}>
            <button className={styles.primaryButton}>Explore Directory</button>
            <button className={styles.secondaryButton}>Our Impact</button>
          </div>
        </div>
      </section>

      {/* Network Section */}
      <section className={styles.section} id="network">
        <div className={styles.containerStandard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>The Alumni Network</h2>
            <div className={styles.titleAccent}></div>
          </div>
          <div className={styles.networkGrid}>
            <div className={`${styles.glassCard} ${styles.cardLarge}`}>
              <div className={styles.cardContent}>
                <div>
                  <div className={styles.iconBox}>
                    <span className="material-symbols-outlined">language</span>
                  </div>
                  <h3 className={styles.cardTitle}>Global Reach</h3>
                  <p className={styles.cardText}>
                    Connect with 15,000+ alumni across 40 countries. From Silicon Valley to European Innovation Hubs, our network spans the most influential tech ecosystems in the world.
                  </p>
                </div>
                <div className={styles.cardFooter}>
                  <div className={styles.avatarGroup}>
                    <div className={styles.avatar1}></div>
                    <div className={styles.avatar2}></div>
                    <div className={styles.avatar3}></div>
                    <div className={styles.avatar4}>+12k</div>
                  </div>
                  <span className={styles.cardLabel}>Active Members</span>
                </div>
              </div>
            </div>

            <div className={`${styles.glassCard} ${styles.cardMedium}`}>
              <div className={styles.cardRow}>
                <div className={styles.iconBoxOrange}>
                  <span className="material-symbols-outlined">military_tech</span>
                </div>
                <div>
                  <h3 className={styles.cardTitleMedium}>Mentorship Program</h3>
                  <p className={styles.cardTextSmall}>
                    A direct bridge between industry titans and the next generation of engineers.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.glassCard}>
              <div className={styles.iconBoxSmall}>
                <span className="material-symbols-outlined">business_center</span>
              </div>
              <h3 className={styles.cardTitleSmall}>Career Hub</h3>
              <p className={styles.cardTextTiny}>
                Exclusive alumni job boards and priority referral pathways.
              </p>
            </div>

            <div className={styles.glassCard}>
              <div className={styles.iconBoxSmallOrange}>
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <h3 className={styles.cardTitleSmall}>Ventures</h3>
              <p className={styles.cardTextTiny}>
                Seed funding and strategic support for alumni-led startups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className={styles.sectionWhite} id="events">
        <div className={styles.containerStandard}>
          <div className={styles.eventsHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Upcoming Gatherings</h2>
              <p className={styles.sectionSubtitle}>
                Moments to reconnect and celebrate our shared journey
              </p>
            </div>
            <button className={styles.viewAllButton}>VIEW ALL EVENTS</button>
          </div>
          <div className={styles.eventsGrid}>
            {/* Event 1 */}
            <div className={styles.eventCard}>
              <div className={styles.eventImage}>
                <div className={styles.eventDate}>
                  <span className={styles.dateMonth}>Dec</span>
                  <span className={styles.dateDay}>24</span>
                </div>
                <div className={styles.eventIcon}>
                  <span className="material-symbols-outlined">festival</span>
                </div>
              </div>
              <div className={styles.eventContent}>
                <div className={styles.eventLocation}>
                  <span className="material-symbols-outlined">pin_drop</span> Main Campus
                </div>
                <h3 className={styles.eventTitle}>Silver Jubilee Reunion '99</h3>
                <p className={styles.eventDescription}>
                  Honoring 25 years of excellence. A night of nostalgia, networking, and celebrating institutional growth.
                </p>
                <button className={styles.eventButton}>Register Now</button>
              </div>
            </div>

            {/* Event 2 */}
            <div className={styles.eventCard}>
              <div className={styles.eventImage}>
                <div className={styles.eventDate}>
                  <span className={styles.dateMonth}>Jan</span>
                  <span className={styles.dateDay}>15</span>
                </div>
                <div className={styles.eventIcon}>
                  <span className="material-symbols-outlined">data_object</span>
                </div>
              </div>
              <div className={styles.eventContent}>
                <div className={styles.eventLocation}>
                  <span className="material-symbols-outlined">podium</span> Virtual Hub
                </div>
                <h3 className={styles.eventTitle}>Alumni Tech Summit</h3>
                <p className={styles.eventDescription}>
                  Deep dive into GenAI with alumni leading core engineering teams at global giants like Google and AWS.
                </p>
                <button className={styles.eventButton}>Register Now</button>
              </div>
            </div>

            {/* Event 3 */}
            <div className={styles.eventCard}>
              <div className={styles.eventImage}>
                <div className={styles.eventDate}>
                  <span className={styles.dateMonth}>Feb</span>
                  <span className={styles.dateDay}>02</span>
                </div>
                <div className={styles.eventIcon}>
                  <span className="material-symbols-outlined">diversity_3</span>
                </div>
              </div>
              <div className={styles.eventContent}>
                <div className={styles.eventLocation}>
                  <span className="material-symbols-outlined">meeting_room</span> Placement Cell
                </div>
                <h3 className={styles.eventTitle}>Career Bridge Day</h3>
                <p className={styles.eventDescription}>
                  A direct interaction day for final year students to meet hiring managers from our illustrious alumni pool.
                </p>
                <button className={styles.eventButton}>Register Now</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={styles.section} id="stories">
        <div className={styles.containerStandard}>
          <div className={styles.testimonialHeader}>
            <h2 className={styles.sectionTitle}>Success Paths</h2>
            <p className={styles.sectionSubtitle}>
              How KSRCE shaped global industry leaders
            </p>
          </div>
          <div className={styles.testimonialContainer}>
            <div className={styles.testimonialSlider}>
              {/* Testimonial 1 */}
              <div className={styles.testimonialSlide}>
                <div className={styles.testimonialAvatar}>
                  <span className="material-symbols-outlined">person</span>
                </div>
                <blockquote className={styles.testimonialQuote}>
                  <span className={`material-symbols-outlined ${styles.quoteIcon}`}>format_quote</span>
                  <p className={styles.testimonialText}>
                    "The technical foundation at KSRCE was instrumental in my journey to engineering leadership. This portal is a brilliant bridge for us to give back."
                  </p>
                </blockquote>
                <div className={styles.testimonialAuthor}>
                  <h4 className={styles.authorName}>Dr. Rajesh Kumar</h4>
                  <p className={styles.authorDetails}>
                    Batch of 2008 <span className={styles.separator}>|</span> Senior Engineering Director
                  </p>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className={styles.testimonialSlide}>
                <div className={styles.testimonialAvatar}>
                  <span className="material-symbols-outlined">person</span>
                </div>
                <blockquote className={styles.testimonialQuote}>
                  <span className={`material-symbols-outlined ${styles.quoteIcon}`}>format_quote</span>
                  <p className={styles.testimonialText}>
                    "Founding my venture was possible because of the KSRCE network. The mentorship here is truly world-class and deeply rooted in excellence."
                  </p>
                </blockquote>
                <div className={styles.testimonialAuthor}>
                  <h4 className={styles.authorName}>Sneha Kapoor</h4>
                  <p className={styles.authorDetails}>
                    Batch of 2014 <span className={styles.separator}>|</span> Tech Founder & CEO
                  </p>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className={styles.testimonialSlide}>
                <div className={styles.testimonialAvatar}>
                  <span className="material-symbols-outlined">person</span>
                </div>
                <blockquote className={styles.testimonialQuote}>
                  <span className={`material-symbols-outlined ${styles.quoteIcon}`}>format_quote</span>
                  <p className={styles.testimonialText}>
                    "KSRCE provided not just a degree, but a lifetime of connections that open doors globally. I am incredibly proud to be an alum."
                  </p>
                </blockquote>
                <div className={styles.testimonialAuthor}>
                  <h4 className={styles.authorName}>Arun Varma</h4>
                  <p className={styles.authorDetails}>
                    Batch of 2005 <span className={styles.separator}>|</span> Principal Architect
                  </p>
                </div>
              </div>
            </div>
            <div className={styles.testimonialIndicators}>
              <div className={styles.indicatorActive}></div>
              <div className={styles.indicator}></div>
              <div className={styles.indicator}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.containerStandard}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <img
                alt="Logo"
                className={styles.footerLogo}
                src={collegeLogoSvg}
              />
              <p className={styles.footerDescription}>
                Building a bridge between our glorious past and an innovative future. K.S.R. College of Engineering Alumni Association.
              </p>
              <div className={styles.socialLinks}>
                <a href="#" className={styles.socialLink}>
                  <span className="material-symbols-outlined">hub</span>
                </a>
                <a href="#" className={styles.socialLink}>
                  <span className="material-symbols-outlined">forum</span>
                </a>
              </div>
            </div>

            <div className={styles.footerColumn}>
              <h5 className={styles.footerTitle}>Navigation</h5>
              <ul className={styles.footerList}>
                <li><a href="#" className={styles.footerLink}>Find Friends</a></li>
                <li><a href="#" className={styles.footerLink}>Event Gallery</a></li>
                <li><a href="#" className={styles.footerLink}>Job Portal</a></li>
                <li><a href="#" className={styles.footerLink}>Philanthropy</a></li>
              </ul>
            </div>

            <div className={styles.footerColumn}>
              <h5 className={styles.footerTitle}>Connect</h5>
              <ul className={styles.footerList}>
                <li><a href="#" className={styles.footerLink}>Campus Map</a></li>
                <li><a href="#" className={styles.footerLink}>Magazine</a></li>
                <li><a href="#" className={styles.footerLink}>Support Desk</a></li>
              </ul>
            </div>

            <div className={styles.footerColumn}>
              <h5 className={styles.footerTitle}>Newsletter</h5>
              <p className={styles.newsletterText}>Get curated alumni updates monthly.</p>
              <div className={styles.newsletterForm}>
                <input 
                  className={styles.newsletterInput}
                  placeholder="Email address" 
                  type="email"
                />
                <button className={styles.newsletterButton}>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p>© 2024 K.S.R. COLLEGE OF ENGINEERING. ALL RIGHTS RESERVED.</p>
            <div className={styles.footerBottomLinks}>
              <a href="#" className={styles.footerBottomLink}>Privacy Policy</a>
              <a href="#" className={styles.footerBottomLink}>Terms & Conditions</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Button */}
      <button className={styles.floatingButton} onClick={() => { navigate('/login') }}>
        <span className="material-symbols-outlined">person_add</span>
        <span className={styles.floatingTooltip} >JOIN NOW</span>
      </button>
    </div>
  );
}
