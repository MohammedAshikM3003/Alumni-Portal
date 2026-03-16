import Sidebar from './Components/Sidebar/Sidebar';
import styles from './Al_Feedback.module.css';
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { DateInput, TimeInput } from '../../components/Calendar';
import { getCroppedImg } from './Components/utils/CropImage';
import { blobUrlToFile } from '../../components/gridfs';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

// Defined outside to avoid remounting on parent re-render
const FeedbackCard = ({ title, sectionKey, sections, updateSection }) => (
  <div className={styles.feedbackCard}>
    <h5 className={styles.cardTitle}>{title}</h5>
    <div className={styles.radioGroup}>
      <label className={styles.radioLabel}>
        <input type="radio" name={sectionKey} value="needs_improvement" checked={sections[sectionKey].rating === 'needs_improvement'} onChange={() => updateSection(sectionKey, 'rating', 'needs_improvement')} />
        Needs improvement
      </label>
      <label className={styles.radioLabel}>
        <input type="radio" name={sectionKey} value="satisfied" checked={sections[sectionKey].rating === 'satisfied'} onChange={() => updateSection(sectionKey, 'rating', 'satisfied')} />
        Satisfied
      </label>
      <label className={styles.radioLabel}>
        <input type="radio" name={sectionKey} value="best" checked={sections[sectionKey].rating === 'best'} onChange={() => updateSection(sectionKey, 'rating', 'best')} />
        Best
      </label>
    </div>
    <input 
      type="text"
      className={styles.commentBox} 
      placeholder="Comments/Suggestions"
      value={sections[sectionKey].comment}
      onChange={(e) => updateSection(sectionKey, 'comment', e.target.value)}
    />
  </div>
);

const Alumini_Feedback = ({ onLogout }) => {
  const { user } = useAuth();

  const [signatureFile, setSignatureFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tempPreviewUrl, setTempPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [reviewedBy, setReviewedBy] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD format
  });
  const [time, setTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // HH:MM format
  });
  const [sections, setSections] = useState({
    visionIV:  { rating: '', comment: '' },
    missionIM: { rating: '', comment: '' },
    visionDV:  { rating: '', comment: '' },
    missionDM: { rating: '', comment: '' },
    peos:      { rating: '', comment: '' },
  });
  
  // Cropper specific states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Update a feedback section (rating or comment)
  const updateSection = (key, field, value) => {
    setSections(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  // Submit feedback form
  const handleSubmit = async () => {
    if (!reviewedBy || !date || !time) {
      alert('Please fill in all reviewer details.');
      return;
    }
    const incomplete = Object.entries(sections).find(([, v]) => !v.rating);
    if (incomplete) {
      alert('Please select a rating for every section.');
      return;
    }
    if (!previewUrl) {
      alert('Please upload your digital signature.');
      return;
    }

    setSubmitting(true);
    try {
      const signatureFile = await blobUrlToFile(previewUrl);

      const formData = new FormData();
      formData.append('reviewedBy', reviewedBy);
      formData.append('date', date);
      formData.append('time', time);
      formData.append('visionIV', JSON.stringify(sections.visionIV));
      formData.append('missionIM', JSON.stringify(sections.missionIM));
      formData.append('visionDV', JSON.stringify(sections.visionDV));
      formData.append('missionDM', JSON.stringify(sections.missionDM));
      formData.append('peos', JSON.stringify(sections.peos));
      formData.append('signature', signatureFile);

      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');

      alert('Feedback submitted successfully!');
      // Reset form
      setReviewedBy('');
      setDate('');
      setTime('');
      setSections({
        visionIV:  { rating: '', comment: '' },
        missionIM: { rating: '', comment: '' },
        visionDV:  { rating: '', comment: '' },
        missionDM: { rating: '', comment: '' },
        peos:      { rating: '', comment: '' },
      });
      setPreviewUrl(null);
      setSignatureFile(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle file upload from file explorer
  const handleSignUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png, image/jpeg'; 
    
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      
      if (file) {
        if (file.size > 5 * 1024 * 1024) { 
          alert('File size should be less than 5MB');
          return;
        }
        
        setSignatureFile(file);
        
        const reader = new FileReader();
        reader.onload = (event) => {
          setTempPreviewUrl(event.target.result);
          setShowModal(true);
        };
        reader.readAsDataURL(file);
      }
    };
    
    fileInput.click();
  };

  // Handle reset in modal
  const handleResetImage = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle uploading adjusted e-sign using the canvas utility
  const handleModalUpload = async () => {
    if (tempPreviewUrl && croppedAreaPixels) {
      try {
        const croppedImageBase64 = await getCroppedImg(tempPreviewUrl, croppedAreaPixels);
        setPreviewUrl(croppedImageBase64);
        setShowModal(false);
      } catch (e) {
        console.error("Error cropping image:", e);
      }
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setTempPreviewUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  // Block wheel scroll when modal is active
  const handlePageWheel = (e) => {
    if (showModal) {
      e.preventDefault();
    }
  };

  return (
    <div 
      className={styles.pageContainer}
      onWheel={handlePageWheel}
    >

      {/* Sidebar Navigation */}
      <Sidebar onLogout={onLogout} currentView={'feedback'} />


      {/* Main Content Area */}
      <main className={styles.mainContent}>

        {/* Content Wrapper */}
        <div className={styles.contentWrapper}>
          
          {/* SINGLE UNIFIED DOCUMENT CARD */}
          <div className={styles.mainDocumentCard}>
            
            {/* Header Section */}
            <div className={styles.docHeader}>
              <h2>K.S.R. COLLEGE OF ENGINEERING (AUTONOMOUS), TIRUCHENGODE – 637 215</h2>
              <h3>DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING</h3>
              <h4>PROGRAM NAME: B.E. Computer Science and Engineering</h4>
            </div>

            {/* Reviewer Details Section */}
            <div className={styles.reviewerSection}>
              <div className={styles.inputGroup}>
                <label>REVIEWED BY (INDIVIDUAL OR COMMITTEE NAME WITH ADDRESS):</label>
                <input type="text" placeholder="Enter full details..." className={styles.textInput} value={reviewedBy} onChange={(e) => setReviewedBy(e.target.value)} />
              </div>
              <div className={styles.inputGroup}>
                <div className={styles.inputGroup2}>
                  <div className={styles.inputGroupDate}>
                    <label>DATE:</label>
                    <div className={styles.dateInputWrapper}>
                      <DateInput theme="alumni" className={styles.dateInput} value={date} onChange={(e) => setDate(e.target.value)} defaultToToday />
                    </div>
                  </div>
                  <div className={styles.inputGroupTime}>
                    <label>TIME:</label>
                    <div className={styles.TimeInputWrapper}>
                      <TimeInput theme="alumni" className={styles.TimeInput} value={time} onChange={(e) => setTime(e.target.value)} defaultToNow />
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
                  <FeedbackCard title="Section: Vision (IV)" sectionKey="visionIV" sections={sections} updateSection={updateSection} />
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
                  <FeedbackCard title="Section: Mission (IM)" sectionKey="missionIM" sections={sections} updateSection={updateSection} />
                </div>
              </div>

              {/* ROW 3: Vision of Department */}
              <div className={styles.gridRow}>
                <div className={styles.leftCol}>
                  <h5 className={styles.blueHeading}>VISION OF THE DEPARTMENT</h5>
                  <p className={styles.italicText}>To produce globally competent learners and innovators in Computer Science and Engineering, committed to ethical values and sustainable development.</p>
                </div>
                <div className={styles.rightCol}>
                  <FeedbackCard title="Section: Vision (DV)" sectionKey="visionDV" sections={sections} updateSection={updateSection} />
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
                  <FeedbackCard title="Section: Mission (DM)" sectionKey="missionDM" sections={sections} updateSection={updateSection} />
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
                  <FeedbackCard title="Section: Program Educational Objectives (PEOs)" sectionKey="peos" sections={sections} updateSection={updateSection} />
                  
                  {/* Digital Signature */}
                  <div className={styles.signatureSection}>
                    <div className={styles.signatureTitleWrapper}>
                      <h5 className={styles.signatureTitle}>DIGITAL SIGNATURE (UPLOAD E-SIGN):</h5>
                      {previewUrl && (
                        <button 
                          className={styles.clearBtn}
                          onClick={() => {
                            setPreviewUrl(null);
                            setSignatureFile(null);
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className={styles.uploadBox} onClick={!previewUrl ? handleSignUpload : undefined}>
                      {previewUrl ? (
                        <div className={styles.imageContainer}>
                          <img src={previewUrl} alt="Signature Preview" className={styles.signaturePreview} />
                        </div>
                      ) : (
                        <>
                          <span className={`material-symbols-outlined ${styles.uploadIcon}`}>cloud_upload</span>
                          <p className={styles.uploadText}>Click to upload or drag and drop</p>
                          <p className={styles.uploadSubtext}>PNG, JPG (MAX. 800X400PX)</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Feedback Form'}
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* E-Sign Adjustment Modal */}
        {showModal && (
          <div className={styles.modalContainer}>
            <div className={styles.card}>
              
              {/* Header Section */}
              <div className={styles.header}>
                <h2 className={styles.title}>Adjust E-Sign</h2>
                <button 
                  className={styles.resetBtn} 
                  aria-label="Reset Image"
                  onClick={handleResetImage}
                >
                  <span className="material-symbols-outlined">refresh</span>
                </button>
              </div>

              {/* Image Cropper Area using react-easy-crop */}
              <div className={styles.cropperArea} style={{ position: 'relative', width: '100%', height: '300px', backgroundColor: '#333', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
                {tempPreviewUrl && (
                  <Cropper
                    image={tempPreviewUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={2 / 1} // Aspect ratio for wide signatures. Change to 1 for perfect square.
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                )}
              </div>

              {/* Footer Actions */}
              <div className={styles.modalFooter} style={{ display: 'flex', gap: '16px' }}>
                <button 
                  className={styles.cancelBtn}
                  onClick={handleCloseModal}
                  style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFF', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancel
                </button>
                <button 
                  className={styles.uploadBtn}
                  onClick={handleModalUpload}
                  style={{ flex: 2, padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#007BFF', color: '#FFF', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <span className="material-symbols-outlined">send</span>
                  Upload E-Sign
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Alumini_Feedback;