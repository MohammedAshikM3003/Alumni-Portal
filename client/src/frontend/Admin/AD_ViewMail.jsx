import styles from './AD_ViewMail.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileImage } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Admin_ViewMail = ({ onLogout }) => {
  const [mail, setMail] = useState(null);
  const [responses, setResponses] = useState([]);
  const [responseStats, setResponseStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const mailId = location.state?.mailId;
  const passedMailData = location.state?.mailData;

  useEffect(() => {
    if (passedMailData) {
      setMail(passedMailData);
      setResponseStats(passedMailData.responseStats);
      fetchMailResponses();
    } else if (mailId) {
      fetchMailDetails();
    } else {
      setLoading(false);
    }
  }, [mailId, passedMailData]);

  const fetchMailDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/mail/${mailId}`, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        setMail(data.mail);
        fetchMailResponses();
      }
    } catch (err) {
      console.error('Error fetching mail:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMailResponses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mail/${mailId}/responses`, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        setResponses(data.responses);
        if (!passedMailData) {
          setResponseStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching mail responses:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
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

  const getStatusColor = (status) => {
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

  /**
   * Check if there are any accepted responses
   */
  const hasAcceptedResponses = () => {
    return responses.some(response => response.action === 'accept');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Sidebar onLogout={onLogout} currentView={'mail'} />
        <main className={styles.mainContent}>
          <div className={styles.backButton} onClick={() => window.history.back()}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </div>
          <div className={styles.pageHeader}>
            <h1>Loading...</h1>
          </div>
        </main>
      </div>
    );
  }

  if (!mail) {
    return (
      <div className={styles.container}>
        <Sidebar onLogout={onLogout} currentView={'mail'} />
        <main className={styles.mainContent}>
          <div className={styles.backButton} onClick={() => window.history.back()}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </div>
          <div className={styles.pageHeader}>
            <h1>Mail not found</h1>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Sidebar onLogout={onLogout} currentView={'mail'} />

      <main className={styles.mainContent}>
        <div className={styles.backButton} onClick={() => navigate('/admin/mail')}>
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back</span>
        </div>

        <div className={styles.pageHeader}>
          <h1>Alumni Mail</h1>
        </div>

        {/* Input Section */}
        <section className={styles.inputSection}>
          <div className={styles.inputGroup}>
            <label htmlFor="admin-email">Admin Email</label>
            <input
              type="email"
              id="admin-email"
              className={styles.inputField}
              value={mail.senderEmail}
              readOnly
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="admin-name">Admin Name</label>
            <input
              type="text"
              id="admin-name"
              className={styles.inputField}
              value={mail.senderName}
              readOnly
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="recipients">Recipients</label>
            <input
              type="text"
              id="recipients"
              className={styles.inputField}
              value={`${mail.recipientCount} recipient${mail.recipientCount > 1 ? 's' : ''}`}
              readOnly
            />
          </div>
        </section>

        {/* Event Card Section */}
        <section className={styles.eventSection}>
          <div className={styles.eventCardWrapper}>
            <div className={styles.eventCard}>
              <div className={styles.eventHeader}>
                <h3>{mail.title || 'No Title'}</h3>
              </div>
              <div className={styles.eventMetadata}>
                <div className={styles.metadataBlock}>
                  <span className={styles.metadataLabel}>Date</span>
                  <span className={styles.metadataValue}>{formatDate(mail.createdAt)}</span>
                </div>
                <div className={styles.metadataBlock}>
                  <span className={styles.metadataLabel}>Type</span>
                  <span className={styles.metadataValue}>{mail.isBroadcast ? 'Broadcast' : 'Direct Mail'}</span>
                </div>
              </div>
              <div className={styles.eventDescription}>
                <span className={styles.metadataLabel}>Message</span>
                <p style={{ whiteSpace: 'pre-wrap' }}>{mail.content || 'No message content.'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Individual Responses Section */}
        {responses.length > 0 && (
          <section className={styles.eventSection}>
            <div className={styles.eventCardWrapper}>
              <div className={styles.eventCard}>
                <div className={styles.eventHeader}>
                  <h3>Individual Responses ({responses.length})</h3>
                  {/* Create Flyer Button - only show if there are accepted responses */}
                  {hasAcceptedResponses() && (
                    <button
                      className={styles.createFlyerButton}
                      onClick={() => {
                        // Build recipients array from accepted responses
                        const recipients = responses
                          .filter(r => r.action === 'accept' && r.responseData)
                          .map(r => ({
                            name: r.responseData.fullName || r.recipientEmail,
                            email: r.recipientEmail,
                            profilePhoto: r.profilePhoto || ''
                          }));

                        navigate('/admin/mail/flyer', {
                          state: {
                            mailId,
                            mailData: mail,
                            recipients,
                            recipientEmails: recipients.map(r => r.email),
                            eventName: mail.eventName || '',
                            eventDate: mail.eventDate || '',
                            eventTime: mail.eventTime || '',
                            eventLocation: mail.eventLocation || ''
                          }
                        });
                      }}
                    >
                      <FileImage size={18} />
                      Create Flyer
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '20px' }}>
                  {responses.map((response, index) => (
                    <div key={index} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '20px',
                      backgroundColor: '#ffffff'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                          {response.recipientEmail}
                        </div>
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          backgroundColor: getStatusColor(response.action),
                          color: 'white'
                        }}>
                          {response.action}
                        </div>
                      </div>

                      {response.action === 'accept' && response.responseData && (
                        <div style={{ marginBottom: '20px' }}>
                          {/* Personal Information */}
                          <div style={{ marginBottom: '15px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                              Personal Information
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                              {response.responseData.fullName && (
                                <div style={{ color: '#6b7280' }}>
                                  <strong>Full Name:</strong> {response.responseData.fullName}
                                </div>
                              )}
                              {response.responseData.personalEmail && (
                                <div style={{ color: '#6b7280' }}>
                                  <strong>Personal Email:</strong> {response.responseData.personalEmail}
                                </div>
                              )}
                              {response.responseData.mobileNo && (
                                <div style={{ color: '#6b7280' }}>
                                  <strong>Mobile:</strong> {response.responseData.mobileNo}
                                </div>
                              )}
                              {response.responseData.batchYear && (
                                <div style={{ color: '#6b7280' }}>
                                  <strong>Batch:</strong> {response.responseData.batchYear.startYear}-{response.responseData.batchYear.endYear}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Professional Information */}
                          {(response.responseData.designation || response.responseData.companyName || response.responseData.officialEmail || response.responseData.location) && (
                            <div style={{ marginBottom: '15px' }}>
                              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                Professional Information
                              </h4>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                                {response.responseData.designation && (
                                  <div style={{ color: '#6b7280' }}>
                                    <strong>Designation:</strong> {response.responseData.designation}
                                  </div>
                                )}
                                {response.responseData.companyName && (
                                  <div style={{ color: '#6b7280' }}>
                                    <strong>Company:</strong> {response.responseData.companyName}
                                  </div>
                                )}
                                {response.responseData.officialEmail && (
                                  <div style={{ color: '#6b7280' }}>
                                    <strong>Official Email:</strong> {response.responseData.officialEmail}
                                  </div>
                                )}
                                {response.responseData.location && (
                                  <div style={{ color: '#6b7280', gridColumn: '1 / -1' }}>
                                    <strong>Location:</strong> {response.responseData.location}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Address Information */}
                          {(response.responseData.presentAddress || response.responseData.permanentAddress) && (
                            <div style={{ marginBottom: '15px' }}>
                              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                Address Information
                              </h4>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                {response.responseData.presentAddress && (
                                  <div style={{ marginBottom: '8px' }}>
                                    <strong>Present:</strong> {response.responseData.presentAddress.street}, {response.responseData.presentAddress.city}
                                    {response.responseData.presentAddress.pinCode && ` - ${response.responseData.presentAddress.pinCode}`}
                                  </div>
                                )}
                                {response.responseData.permanentAddress && (
                                  <div>
                                    <strong>Permanent:</strong> {response.responseData.permanentAddress.street}, {response.responseData.permanentAddress.city}
                                    {response.responseData.permanentAddress.pinCode && ` - ${response.responseData.permanentAddress.pinCode}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Educational Qualifications */}
                          {response.responseData.collegeQualifications && response.responseData.collegeQualifications.length > 0 && (
                            <div style={{ marginBottom: '15px' }}>
                              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                Educational Qualifications
                              </h4>
                              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                {response.responseData.collegeQualifications.map((qual, idx) => (
                                  <div key={idx} style={{ marginBottom: '4px' }}>
                                    <strong>{qual.course}</strong> from {qual.institution}
                                    {qual.yearOfPassing && ` (${qual.yearOfPassing})`}
                                    {qual.percentage && ` - ${qual.percentage}%`}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Entrepreneurship Details */}
                          {response.responseData.isEntrepreneur && response.responseData.entrepreneurDetails && (
                            <div style={{ marginBottom: '15px' }}>
                              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                Entrepreneurship Details
                              </h4>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                {response.responseData.entrepreneurDetails.organizationName && (
                                  <div style={{ marginBottom: '4px' }}>
                                    <strong>Organization:</strong> {response.responseData.entrepreneurDetails.organizationName}
                                  </div>
                                )}
                                {response.responseData.entrepreneurDetails.natureOfWork && (
                                  <div style={{ marginBottom: '4px' }}>
                                    <strong>Nature of Work:</strong> {response.responseData.entrepreneurDetails.natureOfWork}
                                  </div>
                                )}
                                {response.responseData.entrepreneurDetails.annualTurnover && (
                                  <div style={{ marginBottom: '4px' }}>
                                    <strong>Annual Turnover:</strong> {response.responseData.entrepreneurDetails.annualTurnover}
                                  </div>
                                )}
                                {response.responseData.entrepreneurDetails.numberOfEmployees && (
                                  <div>
                                    <strong>Employees:</strong> {response.responseData.entrepreneurDetails.numberOfEmployees}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {response.action === 'reject' && response.responseData?.rejectionReason && (
                        <div style={{ marginBottom: '20px' }}>
                          <div style={{
                            fontSize: '12px',
                            color: '#991b1b',
                            backgroundColor: '#fee2e2',
                            padding: '10px',
                            borderRadius: '6px',
                            fontStyle: 'italic'
                          }}>
                            <strong>Reason:</strong> "{response.responseData.rejectionReason}"
                          </div>
                        </div>
                      )}

                      <div style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic', borderTop: '1px solid #f3f4f6', paddingTop: '10px' }}>
                        Submitted: {formatDateTime(response.submittedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Admin_ViewMail;
