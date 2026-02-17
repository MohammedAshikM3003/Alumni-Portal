import { useNavigate } from 'react-router-dom';
import styles from './ViewMail.module.css';
import Sidebar from './Components/Sidebar/Sidebar';

const ViewMail = ({ onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.pageContainer}>
      {/* Sidebar */}
      <Sidebar onLogout={onLogout} currentView="mail" />

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Mail Container */}
        <div className={`${styles.mailContainer} ${styles.customScrollbar}`}>
          <div className={styles.contentWrapper}>
            {/* Navigation Back */}
            <div className={styles.backButton} onClick={() => window.history.back()}>
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Back</span>
            </div>

            {/* Mail Card */}
            <div className={styles.mailCard}>
              {/* Card Header Meta */}
              <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                  <div className={styles.iconBox}>
                    <span className="material-symbols-outlined">corporate_fare</span>
                  </div>
                  <div className={styles.senderInfo}>
                    <h2>Alumni Office</h2>
                    <p>OFFICIAL COMMUNICATION</p>
                  </div>
                </div>
                <div className={styles.headerRight}>
                  <p>Oct 24, 2023</p>
                  <p>09:12 AM</p>
                </div>
              </div>

              {/* Mail Body and PDF Container */}
              <div className={styles.contentWithPdf}>
                {/* Mail Subject & Body */}
                <div className={styles.mailBody}>
                  <h3 className={styles.mailSubject}>
                    Invitation: Virtual Networking Session for Technology Professionals
                  </h3>
                  <div className={styles.mailContent}>
                    <p>Dear Rahul,</p>
                    <p>
                      We are excited to invite you to our upcoming <strong>Virtual Networking Session</strong>. 
                      This event is specifically designed for technology professionals to connect, share insights, 
                      and explore new opportunities within our global alumni network.
                    </p>
                    <p>
                      The technology landscape is evolving faster than ever. Whether you're working in AI, 
                      Software Development, Cloud Architecture, or Cybersecurity, this session will provide 
                      a platform to engage with fellow pioneers from KSRCE who are shaping the industry worldwide.
                    </p>
                    <div className={styles.eventDetails}>
                      <h4>
                        <span className="material-symbols-outlined">event</span> Event Details
                      </h4>
                      <ul>
                        <li><span>Date:</span> Saturday, November 12, 2023</li>
                        <li><span>Time:</span> 6:00 PM - 7:30 PM IST</li>
                        <li><span>Platform:</span> Zoom Virtual Meeting</li>
                      </ul>
                    </div>
                    <p>
                      We look forward to your participation and the valuable perspective you bring to our community. 
                      Together, we can strengthen the KSRCE legacy of excellence.
                    </p>
                    <p>
                      Best regards,<br />
                      <span className={styles.signature}>The Alumni Relations Team</span>
                    </p>
                  </div>
                </div>

                {/* PDF Preview Section - Right Side */}
                <div className={styles.pdfSection}>
                  <div className={styles.pdfHeader}>
                    <div className={styles.pdfInfo}>
                      <span className="material-symbols-outlined">description</span>
                      <div>
                        <p className={styles.pdfTitle}>Event_Brochure.pdf</p>
                        <p className={styles.pdfSize}>2.4 MB • PDF Document</p>
                      </div>
                    </div>
                  </div>
                  <div className={styles.pdfPreview}>
                    <div className={styles.pdfPlaceholder}>
                      <span className="material-symbols-outlined">picture_as_pdf</span>
                      <p>PDF Preview</p>
                      <span className={styles.pdfText}>Event_Brochure.pdf</span>
                    </div>
                  </div>
                  <div className={styles.pdfDownloadContainer}>
                    <button className={styles.downloadButton}>
                      <span className="material-symbols-outlined">download</span>
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className={styles.actionFooter}>
                <button className={styles.declineButton}>
                  Decline
                </button>
                <button className={styles.acceptButton} onClick={() => {navigate('/alumini/mail/viewmail/acceptmail')}}>
                  Accept Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewMail;
