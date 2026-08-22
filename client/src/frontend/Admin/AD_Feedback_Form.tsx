import { FC, useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import styles from './AD_Feedback_Form.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from './Components/Back_Button/Back_Button';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

interface Assessment {
  rating: 'needs_improvement' | 'satisfied' | 'best';
  comment: string;
}

interface Feedback {
  _id: string;
  reviewedBy?: string;
  submittedBy?: {
    name: string;
    email?: string;
  };
  date: string;
  visionIV: Assessment;
  missionIM: Assessment;
  visionDV: Assessment;
  missionDM: Assessment;
  peos: Assessment;
  signature: any;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface AdminFeedbackFormProps {
  onLogout: () => void;
}

const Admin_Feedback_Form: FC<AdminFeedbackFormProps> = ({ onLogout }) => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const formCardRef = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchFeedback = async (): Promise<void> => {
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
        setError(err.message || 'An unknown error occurred');
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

  const signatureId = feedback.signature && typeof feedback.signature === 'object'
    ? feedback.signature._id || feedback.signature.toString()
    : feedback.signature;

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
      title: 'Program Educational Objectives (PEOs)',
      rating: feedback.peos?.rating,
      comment: feedback.peos?.comment || '',
    },
  ];

  const renderAssessmentCard = (item: any) => (
    <div key={item.id} className="space-y-3">
      <h5 className="text-[16px] font-bold text-[#2e6f40] uppercase tracking-wide">Section: {item.title}</h5>
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap gap-5 mb-4">
          {['needs_improvement', 'satisfied', 'best'].map((ratingValue) => (
            <label key={ratingValue} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={item.id}
                className="w-[18px] h-[18px] text-[#2e6f40] focus:ring-[#2e6f40] border-slate-300 cursor-not-allowed"
                checked={item.rating === ratingValue}
                readOnly
                disabled
              />
              <span className="text-[16px] text-black">
                {ratingValue === 'needs_improvement' ? 'Needs improvement' : ratingValue === 'satisfied' ? 'Satisfied' : 'Best'}
              </span>
            </label>
          ))}
        </div>
        <input
          type="text"
          className="w-full border border-[#E5E7EB] rounded-lg text-[16px] px-4 py-3 cursor-not-allowed text-black bg-white focus:outline-none placeholder:text-slate-400"
          placeholder="Comments/Suggestions"
          readOnly
          value={item.comment}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-[#F8FAFC] font-display text-black h-screen flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar currentView="feedback" onLogout={onLogout} />
      {/* Main Content Area */}
      <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
        <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} p-8 bg-[#F8FAFC]`}>
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-6">
              <div className="mb-4">
                <Back to={'/admin/feedback'} />
              </div>
              <h1 className="text-2xl font-bold text-black">Feedback</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 relative mb-8" ref={formCardRef}>
              {/* Form Header */}
              <div className="text-center mb-10">
                <h2 className="text-[22px] font-bold text-black mb-3 uppercase tracking-tight">K.S.R. COLLEGE OF ENGINEERING (AUTONOMOUS), TIRUCHENGODE – 637215</h2>
                <h3 className="text-base font-semibold text-black mb-3 uppercase">DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING</h3>
                <p className="text-[#2e6f40] font-bold text-base mb-8">PROGRAM NAME: B.E. Computer Science and Engineering</p>
                
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-6 text-left">
                  <div className="flex flex-col">
                    <label className="text-[14px] font-bold text-[#6B7280] uppercase mb-2 tracking-wider">Reviewed By:</label>
                    <input className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-black text-[14px] focus:outline-none cursor-not-allowed" readOnly type="text" value={feedback.reviewedBy || feedback.submittedBy?.name || ''} />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[14px] font-bold text-[#6B7280] uppercase mb-2 tracking-wider">Date:</label>
                    <input className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-black text-[14px] focus:outline-none cursor-not-allowed" readOnly type="text" value={feedback.date ? formatDate(feedback.date) : ''} />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[14px] font-bold text-[#6B7280] uppercase mb-2 tracking-wider">Time:</label>
                    <input className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-black text-[14px] focus:outline-none cursor-not-allowed" readOnly type="text" value="--:--" />
                  </div>
                </div>
              </div>

              {/* Form Content Row-by-Row */}
              <div className="space-y-12 mt-10">
                
                {/* Row 1: Vision of Institution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                  <div className="space-y-3">
                    <h4 className="text-[16px] font-bold text-[#2e6f40] uppercase tracking-wide">Vision of the Institution</h4>
                    <p className="text-black leading-relaxed text-[17px]">
                      To become a globally prominent institution in engineering and management, offering value-based holistic education that fosters research, innovation and sustainable development.
                    </p>
                  </div>
                  <div>
                    {renderAssessmentCard(assessments[0])}
                  </div>
                </div>

                {/* Row 2: Mission of Institution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                  <div className="space-y-4">
                    <h4 className="text-[16px] font-bold text-[#2e6f40] uppercase tracking-wide">Mission of the Institution</h4>
                    <ul className="space-y-4 text-[17px] text-black leading-relaxed">
                      <li className="flex items-start">
                        <span className="mr-2 font-medium">1.</span>
                        <span>To impart value-based quality education through modern pedagogy and state-of-the-art infrastructure.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2 font-medium">2.</span>
                        <span>To enhance learning and managerial skills through cutting-edge laboratories and industry collaboration.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2 font-medium">3.</span>
                        <span>To promote research and innovation through collaboration, social responsibility and commitment to sustainable development.</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    {renderAssessmentCard(assessments[1])}
                  </div>
                </div>

                {/* Row 3: Vision of Department */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                  <div className="space-y-3">
                    <h4 className="text-[16px] font-bold text-[#2e6f40] uppercase tracking-wide">Vision of the Department</h4>
                    <p className="text-black leading-relaxed text-[17px]">
                      To produce globally competent learners and innovators in Computer Science and Engineering, committed to ethical values and sustainable development.
                    </p>
                  </div>
                  <div>
                    {renderAssessmentCard(assessments[2])}
                  </div>
                </div>

                {/* Row 4: Mission of Department */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                  <div className="space-y-4">
                    <h4 className="text-[16px] font-bold text-[#2e6f40] uppercase tracking-wide">Mission of the Department</h4>
                    <div className="grid grid-cols-1 gap-4 text-[17px] text-black">
                      <p><span className="font-bold text-black mr-2">DM1:</span> To provide student-centric education</p>
                      <p><span className="font-bold text-black mr-2">DM2:</span> To impart quality technical education</p>
                      <p><span className="font-bold text-black mr-2">DM3:</span> To meet global industry demand</p>
                      <p><span className="font-bold text-black mr-2">DM4:</span> To promote interdisciplinary innovation</p>
                    </div>
                  </div>
                  <div>
                    {renderAssessmentCard(assessments[3])}
                  </div>
                </div>

                {/* Row 5: PEOs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
                  <div className="space-y-5">
                    <h4 className="text-[16px] font-bold text-[#2e6f40] uppercase tracking-wide mb-2">Program Educational Objectives (PEOs)</h4>
                    <div className="bg-slate-50 p-5 rounded-lg">
                      <h5 className="font-bold text-black text-[17px] mb-2">PEO1:</h5>
                      <p className="text-[17px] text-black leading-relaxed">Graduates will integrate engineering fundamentals and computing to devise innovative solutions and effectively resolve complex problems.</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-lg">
                      <h5 className="font-bold text-black text-[17px] mb-2">PEO2:</h5>
                      <p className="text-[17px] text-black leading-relaxed">Graduates will drive sustainable and ethical solutions by engaging in lifelong learning and adapting to technological advancements.</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-lg">
                      <h5 className="font-bold text-black text-[17px] mb-2">PEO3:</h5>
                      <p className="text-[17px] text-black leading-relaxed">Graduates will enhance their careers through continuous learning, innovation, and research to meet the evolving needs of the industry.</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      {renderAssessmentCard(assessments[4])}
                    </div>
                    
                    {/* Digital Signature */}
                    <div className="space-y-3 mt-6 flex-1 flex flex-col justify-end">
                      <h4 className="text-[16px] font-bold text-[#2e6f40] uppercase tracking-wide">Digital Signature (Upload E-Sign):</h4>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50/50 flex-1 min-h-[160px]">
                        {signatureId && !imageError ? (
                          <img
                            src={`${API_BASE}/api/feedback/image/${signatureId}`}
                            alt="Digital signature"
                            className="max-h-24 object-contain"
                            onError={() => setImageError(true)}
                          />
                        ) : (
                          <div className="text-center text-slate-400 flex flex-col items-center">
                            <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">cloud_upload</span>
                            <span className="text-sm font-medium text-black">Signature unavailable</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Row - Download Button at right end inside card */}
              <div className="flex justify-end pt-6 mt-10" data-html2canvas-ignore="true">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="bg-[#2e6f40] hover:bg-[#1e4b2a] text-white font-bold py-3 px-10 rounded-xl transition-all shadow-md active:scale-[0.98] tracking-wider text-[14px] uppercase"
                >
                  Download
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin_Feedback_Form;
