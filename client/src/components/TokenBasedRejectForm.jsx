import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function TokenBasedRejectForm() {
  const { token } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (location.state?.tokenInfo) {
      setTokenInfo(location.state.tokenInfo);
    } else {
      fetchTokenInfo();
    }
  }, [token]);

  const fetchTokenInfo = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/tokens/info/${token}`);
      if (response.data.success) {
        setTokenInfo(response.data.tokenInfo);
      }
    } catch (error) {
      console.error('Error fetching token info:', error);
      setError('Unable to load invitation details');
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${apiUrl}/api/tokens/${token}/reject`, {
        rejectionReason: rejectionReason.trim() || undefined
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSubmitted(true);
      } else {
        setError(response.data.message || 'Failed to submit rejection');
      }
    } catch (error) {
      console.error('Rejection submission error:', error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 404) {
        setError('This invitation link has expired or been used already');
      } else {
        setError('Unable to submit your response. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.successTitle}>Response Recorded</h2>
          <p style={styles.successMessage}>
            Thank you for responding. Your decline has been recorded.
          </p>
          {tokenInfo?.mail?.senderName && (
            <p style={styles.contactInfo}>
              If you have any questions or change your mind, please contact {tokenInfo.mail.senderName} at {tokenInfo.mail.senderEmail}
            </p>
          )}
          <button
            onClick={() => window.location.href = '/'}
            style={styles.homeButton}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.rejectCard}>
        <div style={styles.backButton} onClick={() => window.history.back()}>
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back</span>
        </div>

        <div style={styles.rejectIcon}>✋</div>
        <h2 style={styles.rejectTitle}>Decline Invitation</h2>

        {tokenInfo && (
          <div style={styles.invitationInfo}>
            <h3 style={styles.mailTitle}>{tokenInfo.mail?.title || 'Invitation'}</h3>
            <p style={styles.mailSender}>From: {tokenInfo.mail?.senderName || 'Alumni Office'}</p>
          </div>
        )}

        <p style={styles.rejectMessage}>
          We're sorry you can't make it. Would you like to share why you're declining?
        </p>

        {error && (
          <div style={styles.errorMessage}>
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        <div style={styles.reasonSection}>
          <label style={styles.reasonLabel}>Reason (Optional)</label>
          <textarea
            style={styles.reasonTextarea}
            placeholder="Please share your reason for declining (optional)..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            disabled={loading}
            maxLength={500}
          />
          <div style={styles.charCount}>
            {rejectionReason.length}/500
          </div>
        </div>

        <div style={styles.buttonSection}>
          <button
            onClick={handleReject}
            disabled={loading}
            style={styles.confirmButton}
          >
            {loading ? 'Submitting...' : 'Confirm Decline'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#f7f9fc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  rejectCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e9f2',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center'
  },
  successCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #d1fae5',
    borderRadius: '12px',
    padding: '48px 32px',
    textAlign: 'center',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '24px',
    justifyContent: 'flex-start',
    transition: 'color 0.2s'
  },
  rejectIcon: {
    fontSize: '48px',
    marginBottom: '20px',
    display: 'block'
  },
  successIcon: {
    fontSize: '64px',
    marginBottom: '24px',
    display: 'block'
  },
  rejectTitle: {
    margin: '0 0 24px 0',
    fontSize: '24px',
    color: '#dc2626',
    fontWeight: '600'
  },
  successTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#16a34a',
    margin: '0 0 16px 0'
  },
  invitationInfo: {
    backgroundColor: '#f9fafb',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
    textAlign: 'left'
  },
  mailTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827'
  },
  mailSender: {
    margin: '0',
    fontSize: '14px',
    color: '#6b7280'
  },
  rejectMessage: {
    fontSize: '16px',
    color: '#374151',
    lineHeight: '1.5',
    marginBottom: '24px'
  },
  successMessage: {
    fontSize: '16px',
    color: '#374151',
    lineHeight: '1.6',
    margin: '16px 0 24px 0'
  },
  contactInfo: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '16px 0 32px 0',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  errorMessage: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  reasonSection: {
    marginBottom: '32px',
    textAlign: 'left'
  },
  reasonLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px'
  },
  reasonTextarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#111827',
    resize: 'vertical',
    minHeight: '100px',
    fontFamily: 'Arial, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  },
  charCount: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: '4px'
  },
  buttonSection: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  confirmButton: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    minWidth: '160px'
  },
  homeButton: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    textDecoration: 'none',
    display: 'inline-block'
  }
};