import { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import styles from './Co_Feedback_Form.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from './Components/BackButton/Back';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const CoordinatorFeedbackForm = ({ onLogout }) => {
  const { id } = useParams();
  const { user } = useAuth();
  const formCardRef = useRef(null);
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

    try {
      const canvas = await html2canvas(formCardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

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

      const fileName = `feedback-review-${Date.now()}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      alert('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
        <Sidebar currentView="feedback" onLogout={onLogout} />
        <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden items-center justify-center">
          <div className="text-slate-600">Loading feedback details...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
        <Sidebar currentView="feedback" onLogout={onLogout} />
        <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden items-center justify-center">
          <div className="text-red-600">{error}</div>
        </main>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
        <Sidebar currentView="feedback" onLogout={onLogout} />
        <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden items-center justify-center">
          <div className="text-red-600">Feedback not found</div>
        </main>
      </div>
    );
  }

  const assessments = [
    {
      id: 'vision_iv',
      title: 'Vision (IV)',
      rating: feedback.visionIV?.rating,
      comment: feedback.visionIV?.comment || '',
    },
    {
      id: 'mission_im',
      title: 'Mission (IM)',
      rating: feedback.missionIM?.rating,
      comment: feedback.missionIM?.comment || '',
    },
    {
      id: 'vision_dv',
      title: 'Vision (DV)',
      rating: feedback.visionDV?.rating,
      comment: feedback.visionDV?.comment || '',
    },
    {
      id: 'mission_dm',
      title: 'Mission (DM)',
      rating: feedback.missionDM?.rating,
      comment: feedback.missionDM?.comment || '',
    },
    {
      id: 'peos',
      title: 'PEOs',
      rating: feedback.peos?.rating,
      comment: feedback.peos?.comment || '',
    },
  ];

  return (
    <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar currentView="feedback" onLogout={onLogout} />
      {/* Main Content Area */}
      <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
        <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} bg-[#F8FAFC]`}>
          <Back to={'/coordinator/feedback_history'} />
          <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-10" ref={formCardRef}>
            {/* Form Header */}
            <div className="text-center mb-10 border-b border-slate-100 pb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-2 uppercase tracking-tight">K.S.R. COLLEGE OF ENGINEERING (Autonomous), TIRUCHENGODE – 637 215</h2>
              <h3 className="text-lg font-semibold text-slate-700 mb-4 uppercase">DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING</h3>
              <p className="text-[#FF3D00] font-bold text-lg mb-8">PROGRAM NAME: B.E. Computer Science and Engineering</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Reviewed By:</label>
                  <input className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-700 focus:ring-[#FF3D00] focus:border-[#FF3D00] cursor-not-allowed" readOnly type="text" value={feedback.reviewedBy || feedback.submittedBy?.name || ''} />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Date:</label>
                  <input className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-700 focus:ring-[#FF3D00] focus:border-[#FF3D00] cursor-not-allowed" readOnly type="text" value={formatDate(feedback.date)} />
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Column (Reference) */}
              <div className="space-y-10">
                <section>
                  <h4 className={styles.visionTitle}>Vision of the Institution</h4>
                  <p className="italic text-slate-600 leading-relaxed text-sm">To become a globally prominent institution in engineering and management, offering value-based holistic education that fosters research, innovation and sustainable development.</p>
                </section>
                <section>
                  <h4 className={styles.visionTitle}>Mission of the Institution</h4>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start">
                      <span className="font-bold mr-2 text-[#FF3D00]">1.</span>
                      <span>To impart value-based quality education through modern pedagogy and state-of-the-art infrastructure.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold mr-2 text-[#FF3D00]">2.</span>
                      <span>To enhance learning and managerial skills through cutting-edge laboratories and industry collaboration.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold mr-2 text-[#FF3D00]">3.</span>
                      <span>To promote research and innovation through collaboration, social responsibility and commitment to sustainable development.</span>
                    </li>
                  </ul>
                </section>
                <section>
                  <h4 className={styles.visionTitle}>Vision of the Department</h4>
                  <p className="italic text-slate-600 leading-relaxed text-sm">To produce globally competent learners and innovators in Computer Science and Engineering, committed to ethical values and sustainable development.</p>
                </section>
                <section>
                  <h4 className={styles.visionTitle}>Mission of the Department</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                    <p><span className="font-bold text-[#FF3D00] mr-1">DM1:</span> To provide student-centric education;</p>
                    <p><span className="font-bold text-[#FF3D00] mr-1">DM2:</span> To impart quality technical education;</p>
                    <p><span className="font-bold text-[#FF3D00] mr-1">DM3:</span> To meet global industry demand;</p>
                    <p><span className="font-bold text-[#FF3D00] mr-1">DM4:</span> To promote interdisciplinary innovation.</p>
                  </div>
                </section>
                <section>
                  <h4 className={styles.visionTitle}>Program Educational Objectives (PEOs)</h4>
                  <div className="space-y-4 text-sm text-slate-600">
                    <p><span className="font-bold text-[#FF3D00] mr-1">PEO1:</span> Graduates will integrate engineering fundamentals and computing to devise innovative solutions and effectively resolve complex problems.</p>
                    <p><span className="font-bold text-[#FF3D00] mr-1">PEO2:</span> Graduates will drive sustainable and ethical solutions by engaging in lifelong learning and adapting to technological advancements.</p>
                    <p><span className="font-bold text-[#FF3D00] mr-1">PEO3:</span> Graduates will enhance their careers through continuous learning, innovation, and research to meet the evolving needs of the industry.</p>
                  </div>
                </section>
              </div>

              {/* Right Column (Assessments) */}
              <div className="space-y-6">
                {assessments.map((item) => (
                  <div key={item.id} className={styles.assessmentCard}>
                    <h5 className="text-base font-bold text-slate-800 mb-4">Section: {item.title}</h5>
                    <div className="flex flex-wrap gap-4 mb-5">
                      {['needs_improvement', 'satisfied', 'best'].map((ratingValue) => (
                        <label key={ratingValue} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={item.id}
                            className="w-5 h-5 text-[#FF3D00] focus:ring-[#FF3D00] border-slate-300"
                            checked={item.rating === ratingValue}
                            readOnly
                            disabled
                          />
                          <span className="text-sm text-slate-600">
                            {ratingValue === 'needs_improvement' ? 'Needs improvement' : ratingValue === 'satisfied' ? 'Satisfied' : 'Best'}
                          </span>
                        </label>
                      ))}
                    </div>
                    <textarea
                      className="w-full border border-slate-200 rounded-lg text-sm focus:ring-[#FF3D00] focus:border-[#FF3D00] p-3 cursor-not-allowed"
                      placeholder="Comments/Suggestions"
                      rows="2"
                      readOnly
                      value={item.comment}
                    />
                  </div>
                ))}

                {/* Signature */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="mb-6">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Digital Signature (E-Sign)</p>
                    <div className="w-full border border-slate-200 rounded-xl h-32 flex items-center justify-center bg-slate-50">
                      {feedback.signature ? (
                        <img
                          src={`${API_BASE}/api/feedback/image/${feedback.signature}`}
                          alt="Signature"
                          className="max-h-28 max-w-full object-contain"
                        />
                      ) : (
                        <span className={styles.digitalSignature}>{feedback.submittedBy?.name?.split(' ')[0] || 'N/A'}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={handleDownload} className="bg-[#FF3D00] hover:bg-red-600 text-white font-bold py-3 px-10 rounded-lg transition-all shadow-md active:scale-95 uppercase tracking-wider text-sm">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default CoordinatorFeedbackForm;
