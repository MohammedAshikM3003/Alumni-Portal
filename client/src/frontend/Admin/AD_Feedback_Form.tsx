import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Sidebar from './Components/Sidebar/Sidebar';
import styles from './AD_Feedback_form.module.css';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface FeedbackSection {
  rating: string;
  comment: string;
}

interface FeedbackData {
  reviewedBy: string;
  submittedBy: {
    name: string;
  };
  date: string;
  time?: string;
  visionIV: FeedbackSection;
  missionIM: FeedbackSection;
  visionDV: FeedbackSection;
  missionDM: FeedbackSection;
  peos: FeedbackSection;
  signature: string;
}

const FeedbackCard = ({ title, sectionKey, feedback }: { title: string; sectionKey: 'visionIV' | 'missionIM' | 'visionDV' | 'missionDM' | 'peos'; feedback: FeedbackData }) => {
  const section = feedback[sectionKey];
  return (
    <div className={styles.feedbackCard}>
      <h5 className={styles.cardTitle}>{title}</h5>
      <div className={styles.radioGroup}>
        <label className={styles.radioLabel}>
          <input type="radio" name={sectionKey} checked={section?.rating === 'needs_improvement'} disabled readOnly />
          Needs improvement
        </label>
        <label className={styles.radioLabel}>
          <input type="radio" name={sectionKey} checked={section?.rating === 'satisfied'} disabled readOnly />
          Satisfied
        </label>
        <label className={styles.radioLabel}>
          <input type="radio" name={sectionKey} checked={section?.rating === 'best'} disabled readOnly />
          Best
        </label>
      </div>
      <input 
        type="text"
        className={styles.commentBox} 
        placeholder="Comments/Suggestions"
        value={section?.comment || ''}
        readOnly
      />
    </div>
  );
};

const Admin_Feedback_Form = ({ onLogout }: { onLogout?: () => void }) => {
  const navigate = useNavigate();
  const formCardRef = useRef<HTMLDivElement>(null);
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchFeedback = async () => {
      if (!user?.token) {
        setError('Please login to view feedback details');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/feedback/${id}`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch feedback details');
        }

        const data = await response.json();

        if (data.success && data.feedback) {
          setFeedback(data.feedback);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFeedback();
    }

    return () => controller.abort();
  }, [id, user]);

  const handleDownload = async () => {
    if (!formCardRef.current) return;

    const canvas = await html2canvas(formCardRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;

    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    const widthRatio = maxWidth / canvas.width;
    const heightRatio = maxHeight / canvas.height;
    const ratio = Math.min(widthRatio, heightRatio);

    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;
    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');

    const date = new Date().toISOString().split('T')[0];
    pdf.save(`feedback-review-${date}.pdf`);
  };

  if (loading) {
    return (
      <div className={styles.pageLayout}>
        <Sidebar onLogout={onLogout} currentView={'feedback'} />
        <main className={styles.mainContent}>
          <div className={styles.loadingState}>Loading feedback details...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageLayout}>
        <Sidebar onLogout={onLogout} currentView={'feedback'} />
        <main className={styles.mainContent}>
          <div className={styles.errorState}>{error}</div>
        </main>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className={styles.pageLayout}>
        <Sidebar onLogout={onLogout} currentView={'feedback'} />
        <main className={styles.mainContent}>
          <div className={styles.errorState}>Feedback not found</div>
        </main>
      </div>
    );
  }

  const signatureUrl = feedback.signature ? `${API_BASE}/api/feedback/image/${feedback.signature}` : null;

  return (
    <div className={styles.pageLayout}>
      {/* Sidebar Navigation */}
      <Sidebar onLogout={onLogout} currentView={'feedback'} />

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Back Button */}
        <div className={styles.backButton} onClick={() => navigate('/admin/feedback')} >
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back</span>
        </div>

        {/* Content Wrapper */}
        <div className={styles.contentWrapper}>
          
          {/* SINGLE UNIFIED DOCUMENT CARD */}
          <div className={styles.mainDocumentCard} ref={formCardRef}>
            
            {/* Header Section */}
            <div className={styles.docHeader}>
              <h2>K.S.R. COLLEGE OF ENGINEERING (AUTONOMOUS), TIRUCHENGODE – 637215</h2>
              <h3>DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING</h3>
              <h4>PROGRAM NAME: B.E. Computer Science and Engineering</h4>
            </div>

            {/* Reviewer Details Section */}
            <div className={styles.reviewerSection}>
              <div className={styles.inputGroup}>
                <label>REVIEWED BY (INDIVIDUAL OR COMMITTEE NAME WITH ADDRESS):</label>
                <input 
                  readOnly 
                  type="text" 
                  className={styles.textInput} 
                  value={feedback.reviewedBy || feedback.submittedBy?.name || ''} 
                />
              </div>
              <div className={styles.inputGroup}>
                <div className={styles.inputGroup2}>
                  <div className={styles.inputGroupDate}>
                    <label>DATE:</label>
                    <div className={styles.dateInputWrapper}>
                      <input 
                        readOnly 
                        type="text" 
                        className={styles.dateInput} 
                        value={formatDate(feedback.date)} 
                      />
                    </div>
                  </div>
                  <div className={styles.inputGroupTime}>
                    <label>TIME:</label>
                    <div className={styles.TimeInputWrapper}>
                      <input 
                        readOnly 
                        type="text" 
                        className={styles.TimeInput} 
                        value={feedback.time || ''} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <hr className={styles.mainDivider} />

            {/* Content Body - Row by Row Grid for Perfect Alignment */}
            <div className={styles.docBody}>
              
              {/* ROW 1: Vision of Institution */}
              <div className={styles.gridRow}>
                <div className={styles.leftCol}>
                  <h5 className={styles.blueHeading}>VISION OF THE INSTITUTION</h5>
                  <p className={styles.italicText}>To become a globally prominent institution in engineering and management, offering value-based holistic education that fosters research, innovation and sustainable development.</p>
                </div>
                <div className={styles.rightCol}>
                  <FeedbackCard title="Section: Vision (IV)" sectionKey="visionIV" feedback={feedback} />
                </div>
              </div>

              {/* ROW 2: Mission of Institution */}
              <div className={styles.gridRow}>
                <div className={styles.leftCol}>
                  <h5 className={styles.blueHeading}>MISSION OF THE INSTITUTION</h5>
                  <ol className={styles.orderedList}>
                    <li>To impart value-based quality education through modern pedagogy and state-of-the-art infrastructure.</li>
                    <li>To enhance learning and managerial skills through cutting-edge laboratories and industry collaboration.</li>
                    <li>To promote research and innovation through collaboration, social responsibility and commitment to sustainable development.</li>
                  </ol>
                </div>
                <div className={styles.rightCol}>
                  <FeedbackCard title="Section: Mission (IM)" sectionKey="missionIM" feedback={feedback} />
                </div>
              </div>

              {/* ROW 3: Vision of Department */}
              <div className={styles.gridRow}>
                <div className={styles.leftCol}>
                  <h5 className={styles.blueHeading}>VISION OF THE DEPARTMENT</h5>
                  <p className={styles.italicText}>To produce globally competent learners and innovators in Computer Science and Engineering, committed to ethical values and sustainable development.</p>
                </div>
                <div className={styles.rightCol}>
                  <FeedbackCard title="Section: Vision (DV)" sectionKey="visionDV" feedback={feedback} />
                </div>
              </div>

              {/* ROW 4: Mission of Department */}
              <div className={styles.gridRow}>
                <div className={styles.leftCol}>
                  <h5 className={styles.blueHeading}>MISSION OF THE DEPARTMENT</h5>
                  <ul className={styles.noBulletList}>
                    <li><strong>DM1:</strong> To provide student-centric education</li>
                    <li><strong>DM2:</strong> To impart quality technical education</li>
                    <li><strong>DM3:</strong> To meet global industry demand</li>
                    <li><strong>DM4:</strong> To promote interdisciplinary innovation</li>
                  </ul>
                </div>
                <div className={styles.rightCol}>
                  <FeedbackCard title="Section: Mission (DM)" sectionKey="missionDM" feedback={feedback} />
                </div>
              </div>

              {/* ROW 5: PEOs & Final Submission */}
              <div className={styles.gridRow}>
                <div className={styles.leftCol}>
                  <h5 className={styles.blueHeading}>PROGRAM EDUCATIONAL OBJECTIVES (PEOS)</h5>
                  <div className={styles.peoBlock}>
                    <h6>PEO1:</h6>
                    <p>Graduates will integrate engineering fundamentals and computing to devise innovative solutions and effectively resolve complex problems.</p>
                  </div>
                  <div className={styles.peoBlock}>
                    <h6>PEO2:</h6>
                    <p>Graduates will drive sustainable and ethical solutions by engaging in lifelong learning and adapting to technological advancements.</p>
                  </div>
                  <div className={styles.peoBlock}>
                    <h6>PEO3:</h6>
                    <p>Graduates will enhance their careers through continuous learning, innovation, and research to meet the evolving needs of the industry.</p>
                  </div>
                </div>
                
                <div className={styles.rightCol}>
                  <FeedbackCard title="Section: Program Educational Objectives (PEOs)" sectionKey="peos" feedback={feedback} />
                  
                  {/* Digital Signature */}
                  <div className={styles.signatureSection}>
                    <div className={styles.signatureTitleWrapper}>
                      <h5 className={styles.signatureTitle}>DIGITAL SIGNATURE:</h5>
                    </div>
                    <div className={styles.uploadBox}>
                      {signatureUrl ? (
                        <div className={styles.imageContainer}>
                          <img src={signatureUrl} alt="Signature Preview" className={styles.signaturePreview} />
                        </div>
                      ) : (
                        <div className={styles.imageContainer}>
                          <span className={styles.signatureFont}>
                            {feedback.submittedBy?.name?.split(' ')[0] || 'N/A'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Download Button */}
                  <button className={styles.submitBtn} onClick={handleDownload}>
                    Download Feedback Form
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin_Feedback_Form;
