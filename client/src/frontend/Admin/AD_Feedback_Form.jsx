import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Sidebar from './Components/Sidebar/Sidebar';
import styles from './AD_Feedback_form.module.css';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;


const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const Admin_Feedback_Form = ({ onLogout }) => {
  const navigate = useNavigate();
  const formCardRef = useRef(null);
  const { id } = useParams();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!user?.token) {
        setError('Please login to view feedback details');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/feedback/${id}`, {
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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFeedback();
    }
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

  const assessments = [
    {
      id: 'vision_iv',
      title: 'Section: Vision (IV)',
      rating: feedback.visionIV?.rating,
      comment: feedback.visionIV?.comment || '',
    },
    {
      id: 'mission_im',
      title: 'Section: Mission (IM)',
      rating: feedback.missionIM?.rating,
      comment: feedback.missionIM?.comment || '',
    },
    {
      id: 'vision_dv',
      title: 'Section: Vision (DV)',
      rating: feedback.visionDV?.rating,
      comment: feedback.visionDV?.comment || '',
    },
    {
      id: 'mission_dm',
      title: 'Section: Mission (DM)',
      rating: feedback.missionDM?.rating,
      comment: feedback.missionDM?.comment || '',
    },
    {
      id: 'peos',
      title: 'Section: PEOs',
      rating: feedback.peos?.rating,
      comment: feedback.peos?.comment || '',
    },
  ];

  const signatureUrl = feedback.signature ? `${API_BASE}/api/feedback/image/${feedback.signature}` : null;

  return (
    <div className={styles.pageLayout}>

      {/* Sidebar */}
      <Sidebar onLogout={onLogout} currentView={'feedback'} />

      {/* BEGIN: Main Content Area */}
      <main className={styles.mainContent}>
        {/* Back Button */}

        <div className={styles.backButton} onClick={() => navigate('/admin/feedback')} >
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back</span>
        </div>
        {/* BEGIN: Scrollable Feedback Container */}
        <div className={styles.scrollableContainer}>
          <div className={styles.formCard} ref={formCardRef}>

            {/* BEGIN: Form Header */}
            <div className={styles.formHeader}>
              <h2 className={styles.collegeName}>K.S.R. COLLEGE OF ENGINEERING (Autonomous), TIRUCHENGODE – 637 215</h2>
              <h3 className={styles.departmentName}>DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING</h3>
              <p className={styles.programName}>PROGRAM NAME: B.E. Computer Science and Engineering</p>

              <div className={styles.metaGrid}>
                <div className={styles.inputGroup}>
                  <label>Reviewed By (Individual or committee name with Address):</label>
                  <input readOnly type="text" value={feedback.reviewedBy || feedback.submittedBy?.name || ''} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Date:</label>
                  <input readOnly type="text" value={formatDate(feedback.date)} />
                </div>
              </div>
            </div>
            {/* END: Form Header */}

            {/* BEGIN: Form Columns */}
            <div className={styles.formColumns}>

              {/* BEGIN: Left Column (Reference Data) */}
              <div className={styles.referenceColumn}>
                <section className={styles.refSection}>
                  <h4>Vision of the Institution</h4>
                  <p>To become a globally prominent institution in engineering and management, offering value-based holistic education that fosters research, innovation and sustainable development.</p>
                </section>

                <section className={styles.refSection}>
                  <h4>Mission of the Institution</h4>
                  <ul>
                    <li>
                      <span className={styles.listNum}>1.</span>
                      <span>To impart value-based quality education through modern pedagogy and state-of-the-art infrastructure.</span>
                    </li>
                    <li>
                      <span className={styles.listNum}>2.</span>
                      <span>To enhance learning and managerial skills through cutting-edge laboratories and industry collaboration.</span>
                    </li>
                    <li>
                      <span className={styles.listNum}>3.</span>
                      <span>To promote research and innovation through collaboration, social responsibility and commitment to sustainable development.</span>
                    </li>
                  </ul>
                </section>

                <section className={styles.refSection}>
                  <h4>Vision of the Department</h4>
                  <p>To produce globally competent learners and innovators in Computer Science and Engineering, committed to ethical values and sustainable development.</p>
                </section>

                <section className={styles.refSection}>
                  <h4>Mission of the Department</h4>
                  <div className={styles.gridList}>
                    <p><span className={styles.boldGreen}>DM1:</span> To provide student-centric education;</p>
                    <p><span className={styles.boldGreen}>DM2:</span> To impart quality technical education;</p>
                    <p><span className={styles.boldGreen}>DM3:</span> To meet global industry demand;</p>
                    <p><span className={styles.boldGreen}>DM4:</span> To promote interdisciplinary innovation.</p>
                  </div>
                </section>

                <section className={styles.refSection}>
                  <h4>Program Educational Objectives (PEOs)</h4>
                  <div className={styles.gridList}>
                    <p><span className={styles.boldGreen}>PEO1:</span> Graduates will integrate engineering fundamentals and computing to devise innovative solutions and effectively resolve complex problems.</p>
                    <p><span className={styles.boldGreen}>PEO2:</span> Graduates will drive sustainable and ethical solutions by engaging in lifelong learning and adapting to technological advancements.</p>
                    <p><span className={styles.boldGreen}>PEO3:</span> Graduates will enhance their careers through continuous learning, innovation, and research to meet the evolving needs of the industry.</p>
                  </div>
                </section>
              </div>
              {/* END: Left Column */}

              {/* BEGIN: Right Column (Assessment Forms) */}
              <div className={styles.assessmentColumn}>

                {assessments.map((item) => (
                  <div key={item.id} className={styles.assessmentCard}>
                    <h5>{item.title}</h5>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioLabel}>
                        <input disabled name={item.id} type="radio" className={styles.radioInput} checked={item.rating === 'needs_improvement'} readOnly />
                        <span>Needs improvement</span>
                      </label>
                      <label className={styles.radioLabel}>
                        <input disabled name={item.id} type="radio" className={styles.radioInput} checked={item.rating === 'satisfied'} readOnly />
                        <span>Satisfied</span>
                      </label>
                      <label className={styles.radioLabel}>
                        <input disabled name={item.id} type="radio" className={styles.radioInput} checked={item.rating === 'best'} readOnly />
                        <span>Best</span>
                      </label>
                    </div>
                    <textarea
                      readOnly
                      className={styles.feedbackTextarea}
                      placeholder="Comments/Suggestions"
                      rows="2"
                      value={item.comment}
                    ></textarea>
                  </div>
                ))}

                {/* Signature & Submission */}
                <div className={styles.signatureSection}>
                  <div className={styles.signatureBox}>
                    <p className={styles.signatureLabel}>Digital Signature</p>
                    <div className={styles.signatureDisplay}>
                      {signatureUrl ? (
                        <img src={signatureUrl} alt="Signature" className={styles.signatureImage} />
                      ) : (
                        <span className={styles.signatureFont}>{feedback.submittedBy?.name?.split(' ')[0] || 'N/A'}</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.actionRow}>
                    <button type="button" className={styles.downloadBtn} onClick={handleDownload}>Download</button>
                  </div>
                </div>

              </div>
              {/* END: Right Column */}

            </div>
            {/* END: Form Columns */}

          </div>
        </div>
        {/* END: Scrollable Feedback Container */}

      </main>
      {/* END: Main Content Area */}
    </div>
  );
};

export default Admin_Feedback_Form;
