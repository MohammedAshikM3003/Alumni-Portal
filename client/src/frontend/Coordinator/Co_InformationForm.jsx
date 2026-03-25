import styles from './Co_ViewMail.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Coordinator_ViewMail = ({ onLogout }) => {
    const { user } = useAuth();
    const [mail, setMail] = useState(null);
    const [responses, setResponses] = useState([]);
    const [responseStats, setResponseStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
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
            // Use department-specific endpoint if coordinator has department
            let apiUrl;
            if (user?.department) {
                apiUrl = `${API_BASE_URL}/api/mail/${mailId}/responses/department/${encodeURIComponent(user.department)}`;
                console.log('Fetching department-filtered responses for:', user.department);
            } else {
                // Fallback to general responses endpoint
                apiUrl = `${API_BASE_URL}/api/mail/${mailId}/responses`;
                console.log('No department found, using general responses endpoint');
            }

            const response = await fetch(apiUrl, {
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            if (data.success) {
                setResponses(data.responses || []);
                if (!passedMailData) {
                    setResponseStats(data.stats);
                }
                console.log('Fetched responses:', data.responses);

                // Log department filtering info if available
                if (data.message) {
                    console.log('Department filter:', data.message);
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
                <div className={styles.backButton} onClick={() => window.history.back()}>
                    <span className="material-symbols-outlined">arrow_back</span>
                    <span>Back</span>
                </div>

                <div className={styles.pageHeader}>
                    <h1>Alumni Mail</h1>
                </div>

                {/* Input Section */}
                <section className={styles.inputSection}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="coordinator-email">Coordinator Email</label>
                        <input
                            type="email"
                            id="coordinator-email"
                            className={styles.inputField}
                            value={user?.email || 'Not specified'}
                            readOnly
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="coordinator-department">Department</label>
                        <input
                            type="text"
                            id="coordinator-department"
                            className={styles.inputField}
                            value={user?.department || 'Not specified'}
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
                                {user?.department && (
                                    <div className={styles.departmentBadge}>
                                        {user.department} Department Only
                                    </div>
                                )}
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
                                    {user?.department && (
                                        <div className={styles.departmentBadge}>
                                            {user.department} Department
                                        </div>
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

                                            {response.action === 'accept' && (response.responseData || response.alumniInfo) && (
                                                <div style={{ marginBottom: '20px' }}>
                                                    {/* Personal Information */}
                                                    <div style={{ marginBottom: '15px' }}>
                                                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                                            Personal Information
                                                        </h4>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                                                            {(response.responseData?.fullName || response.alumniInfo?.fullName) && (
                                                                <div style={{ color: '#6b7280' }}>
                                                                    <strong>Full Name:</strong> {response.responseData?.fullName || response.alumniInfo?.fullName}
                                                                </div>
                                                            )}
                                                            {(response.responseData?.personalEmail || response.alumniInfo?.contactInfo?.personalEmail) && (
                                                                <div style={{ color: '#6b7280' }}>
                                                                    <strong>Personal Email:</strong> {response.responseData?.personalEmail || response.alumniInfo?.contactInfo?.personalEmail}
                                                                </div>
                                                            )}
                                                            {(response.responseData?.mobileNo || response.alumniInfo?.contactInfo?.mobile) && (
                                                                <div style={{ color: '#6b7280' }}>
                                                                    <strong>Mobile:</strong> {response.responseData?.mobileNo || response.alumniInfo?.contactInfo?.mobile}
                                                                </div>
                                                            )}
                                                            {(response.responseData?.batchYear || response.alumniInfo?.batch) && (
                                                                <div style={{ color: '#6b7280' }}>
                                                                    <strong>Batch:</strong> {
                                                                        response.responseData?.batchYear ?
                                                                            `${response.responseData.batchYear.startYear}-${response.responseData.batchYear.endYear}` :
                                                                            `${response.alumniInfo?.batch?.startYear}-${response.alumniInfo?.batch?.endYear}`
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Professional Information */}
                                                    {(response.responseData?.designation || response.responseData?.companyName || response.responseData?.officialEmail || response.responseData?.location ||
                                                      response.alumniInfo?.designation || response.alumniInfo?.companyName || response.alumniInfo?.contactInfo?.officialEmail || response.alumniInfo?.contactInfo?.location) && (
                                                        <div style={{ marginBottom: '15px' }}>
                                                            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                                                Professional Information
                                                            </h4>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                                                                {(response.responseData?.designation || response.alumniInfo?.designation) && (
                                                                    <div style={{ color: '#6b7280' }}>
                                                                        <strong>Designation:</strong> {response.responseData?.designation || response.alumniInfo?.designation}
                                                                    </div>
                                                                )}
                                                                {(response.responseData?.companyName || response.alumniInfo?.companyName) && (
                                                                    <div style={{ color: '#6b7280' }}>
                                                                        <strong>Company:</strong> {response.responseData?.companyName || response.alumniInfo?.companyName}
                                                                    </div>
                                                                )}
                                                                {(response.responseData?.officialEmail || response.alumniInfo?.contactInfo?.officialEmail) && (
                                                                    <div style={{ color: '#6b7280' }}>
                                                                        <strong>Official Email:</strong> {response.responseData?.officialEmail || response.alumniInfo?.contactInfo?.officialEmail}
                                                                    </div>
                                                                )}
                                                                {(response.responseData?.location || response.alumniInfo?.contactInfo?.location) && (
                                                                    <div style={{ color: '#6b7280', gridColumn: '1 / -1' }}>
                                                                        <strong>Location:</strong> {response.responseData?.location || response.alumniInfo?.contactInfo?.location}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {response.action === 'reject' && (response.responseData?.rejectionReason || response.rejectionReason) && (
                                                <div style={{ marginBottom: '20px' }}>
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: '#991b1b',
                                                        backgroundColor: '#fee2e2',
                                                        padding: '10px',
                                                        borderRadius: '6px',
                                                        fontStyle: 'italic'
                                                    }}>
                                                        <strong>Reason:</strong> "{response.responseData?.rejectionReason || response.rejectionReason}"
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

export default Coordinator_ViewMail;
