import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Al_ViewMail.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface AluminiViewMailProps {
  onLogout?: () => void;
}

const Alumini_ViewMail = ({ onLogout }: AluminiViewMailProps) => {
  const [mailData, setMailData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [acceptFormData, setAcceptFormData] = useState({
    fullName: '',
    designation: '',
    companyName: '',
    mobileNo: '',
    personalEmail: '',
    officialEmail: '',
    location: ''
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const mailId = location.state?.mailId;
  const passedMailData = location.state?.mailData;

  useEffect(() => {
    const controller = new AbortController();

    if (passedMailData) {
      setMailData(passedMailData);
      setLoading(false);
    } else if (mailId) {
      fetchMailDetails(controller.signal);
    } else {
      setLoading(false);
    }

    return () => controller.abort();
  }, [mailId, passedMailData]);

  const fetchMailDetails = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/mail/${mailId}`, {
        headers: { 'Content-Type': 'application/json' },
        signal,
      });

      const data = await response.json();
      if (data.success) {
        setMailData(data.mail);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Error fetching mail:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const deriveSenderLabel = (name: string | undefined) => {
    if (!name) return '';
    const n = name.toLowerCase();
    if (n.includes('career')) return 'Career Cell';
    if (n.includes('admin')) return 'Admin';
    if (n.includes('office')) return 'Alumni Office';
    return '';
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'accept':
        return '#22c55e'; // Green
      case 'reject':
        return '#ef4444'; // Red
      case 'pending':
      default:
        return '#6b7280'; // Grey
    }
  };

  const handleAccept = async () => {
    if (!user?.token || !mailData?._id) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mail/${mailData._id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          status: 'accept',
          responseData: acceptFormData,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setMailData({ ...mailData, responseStatus: 'accept', responseData: acceptFormData, submittedAt: new Date() });
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!user?.token || !mailData?._id) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mail/${mailData._id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          status: 'reject',
          responseData: { rejectionReason },
        }),
      });
      const data = await response.json();
      if (data.success) {
        setMailData({ ...mailData, responseStatus: 'reject', responseData: { rejectionReason }, submittedAt: new Date() });
        setShowDeclineForm(false);
        setRejectionReason('');
      }
    } catch (err) {
      console.error('Error declining invitation:', err);
    } finally {
      setSubmitting(false);
    }
  };

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

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF3D00] mb-4"></div>
                <p className="text-slate-500">Loading mail details...</p>
              </div>
            ) : mailData ? (
              <div className={styles.mailCard}>
                {/* Card Header Meta */}
                <div className={styles.cardHeader}>
                  <div className={styles.headerLeft}>
                    <div className={styles.iconBox}>
                      <span className="material-symbols-outlined">corporate_fare</span>
                    </div>
                    <div className={styles.senderInfo}>
                      <h2>{mailData.senderName}</h2>
                      <p>{mailData.isBroadcast ? (mailData.senderLabel || deriveSenderLabel(mailData.senderName) || 'Official Communication') : 'Official Communication'}</p>
                    </div>
                  </div>
                  <div className={styles.headerRight}>
                    <p>{formatDate(mailData.createdAt)}</p>
                  </div>
                </div>

                {/* Mail Body and PDF Container */}
                <div className={styles.contentWithPdf}>
                  {/* Mail Subject & Body */}
                  <div className={styles.mailBody}>
                    <h3 className={styles.mailSubject}>
                      {mailData.title || 'No Subject'}
                    </h3>
                    <div className={styles.mailContent}>
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {mailData.content}
                      </div>
                      <br />
                      <p>
                        Best regards,<br />
                        <span className={styles.signature}>{mailData.senderName}</span>
                      </p>
                    </div>
                  </div>

                  {/* PDF Preview Section - Right Side (Placeholder for now) */}
                  <div className={styles.pdfSection}>
                    <div className={styles.pdfHeader}>
                      <div className={styles.pdfInfo}>
                        <span className="material-symbols-outlined">description</span>
                        <div>
                          <p className={styles.pdfTitle}>Attachment.pdf</p>
                          <p className={styles.pdfSize}>No attachment available</p>
                        </div>
                      </div>
                    </div>
                    <div className={styles.pdfPreview}>
                      <div className={styles.pdfPlaceholder}>
                        <span className="material-symbols-outlined">picture_as_pdf</span>
                        <p>No PDF Attachment</p>
                        <span className={styles.pdfText}>No files attached</span>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Mail Stats */}
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' }}>Mail Information</h4>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <p><strong>Sender Email:</strong> {mailData.senderEmail}</p>
                    <p><strong>Recipients:</strong> {mailData.recipientCount} recipient{mailData.recipientCount > 1 ? 's' : ''}</p>
                    <p><strong>Type:</strong> {mailData.isBroadcast ? 'Broadcast Mail' : 'Direct Mail'}</p>
                    <p><strong>Sent:</strong> {formatDate(mailData.createdAt)}</p>
                    <p><strong>Status:</strong>
                      <span style={{
                        marginLeft: '5px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        backgroundColor: getStatusColor(mailData.responseStatus),
                        color: 'white'
                      }}>
                        {mailData.responseStatus || 'pending'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Action Buttons - Only show if pending */}
                {(!mailData.responseStatus || mailData.responseStatus === 'pending') && (
                  <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {!showDeclineForm ? (
                      <>
                        <button
                          onClick={() => setShowDeclineForm(true)}
                          disabled={submitting}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                        >
                          Decline Invitation
                        </button>
                        <button
                          onClick={handleAccept}
                          disabled={submitting}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#22c55e'}
                        >
                          {submitting ? 'Submitting...' : 'Accept Invitation'}
                        </button>
                      </>
                    ) : (
                      <div style={{ width: '100%', backgroundColor: '#fef2f2', padding: '15px', borderRadius: '8px', border: '1px solid #ef4444' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>
                          Decline Invitation
                        </h4>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Please provide a reason for declining..."
                          style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '10px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            marginBottom: '10px'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => {
                              setShowDeclineForm(false);
                              setRejectionReason('');
                            }}
                            disabled={submitting}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: submitting ? 'not-allowed' : 'pointer',
                              fontSize: '13px'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDecline}
                            disabled={submitting || !rejectionReason.trim()}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: (submitting || !rejectionReason.trim()) ? 'not-allowed' : 'pointer',
                              fontSize: '13px',
                              opacity: !rejectionReason.trim() ? 0.5 : 1
                            }}
                          >
                            {submitting ? 'Submitting...' : 'Submit Decline'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Response Details Section */}
                {mailData.responseStatus === 'accept' && mailData.responseData && (
                  <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f9f0', borderRadius: '8px', border: '1px solid #22c55e' }}>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '600', color: '#22c55e' }}>
                      ✅ Accepted - Your Response
                    </h4>
                    <div style={{ fontSize: '12px', color: '#166534' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        {mailData.responseData.fullName && (
                          <p><strong>Full Name:</strong> {mailData.responseData.fullName}</p>
                        )}
                        {mailData.responseData.designation && (
                          <p><strong>Designation:</strong> {mailData.responseData.designation}</p>
                        )}
                        {mailData.responseData.companyName && (
                          <p><strong>Company:</strong> {mailData.responseData.companyName}</p>
                        )}
                        {mailData.responseData.mobileNo && (
                          <p><strong>Mobile:</strong> {mailData.responseData.mobileNo}</p>
                        )}
                        {mailData.responseData.personalEmail && (
                          <p><strong>Personal Email:</strong> {mailData.responseData.personalEmail}</p>
                        )}
                        {mailData.responseData.officialEmail && (
                          <p><strong>Official Email:</strong> {mailData.responseData.officialEmail}</p>
                        )}
                        {mailData.responseData.location && (
                          <p><strong>Location:</strong> {mailData.responseData.location}</p>
                        )}
                      </div>
                      {mailData.submittedAt && (
                        <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
                          <strong>Submitted:</strong> {formatDate(mailData.submittedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {mailData.responseStatus === 'reject' && mailData.responseData && (
                  <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #ef4444' }}>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>
                      ❌ Declined - Your Response
                    </h4>
                    <div style={{ fontSize: '12px', color: '#991b1b' }}>
                      {mailData.responseData.rejectionReason ? (
                        <div>
                          <p><strong>Reason:</strong></p>
                          <p style={{
                            marginTop: '5px',
                            padding: '8px',
                            backgroundColor: '#fee2e2',
                            borderRadius: '4px',
                            fontStyle: 'italic'
                          }}>
                            "{mailData.responseData.rejectionReason}"
                          </p>
                        </div>
                      ) : (
                        <p style={{ fontStyle: 'italic' }}>No reason provided</p>
                      )}
                      {mailData.submittedAt && (
                        <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
                          <strong>Submitted:</strong> {formatDate(mailData.submittedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">mail</span>
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No Mail Selected</h3>
                <p className="text-slate-500">Please select a mail from the mail history to view details.</p>
              </div>
            )}
          </div>
        </div>
      </main>

    </div>
  );
};

export default Alumini_ViewMail;
