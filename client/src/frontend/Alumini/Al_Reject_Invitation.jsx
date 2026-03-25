import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/authContext/authContext';
import { useTokenAuth } from '../../context/tokenAuthContext/tokenAuthContext';
import styles from './Al_Reject_Invitation.module.css';

export default function Al_Reject_Invitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { saveUser, isLoggedIn } = useAuth();
  const { loginWithToken, isTokenLoggedIn, tokenSession, markTokenUsed, loading: authLoading } = useTokenAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // If already logged in via regular auth (after successful submission), redirect to dashboard
    if (isLoggedIn) {
      navigate('/alumini/dashboard', { replace: true });
      return;
    }

    // Check if token was already used (but not during submission)
    if (tokenSession?.token === token && tokenSession?.isUsed && !isSubmitting) {
      alert('This invitation link has already been used. Thank you for your response!');
      navigate('/', { replace: true });
      return;
    }

    // Check if user is logged in via token
    if (!isTokenLoggedIn || tokenSession?.token !== token) {
      // Need to validate token first
      validateToken();
      return;
    }
  }, [token, isTokenLoggedIn, tokenSession, authLoading, navigate, isLoggedIn, isSubmitting]);

  const validateToken = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/tokens/validate/${token}`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.tokenInfo) {
        const info = response.data.tokenInfo;

        // Login with token
        loginWithToken({
          token,
          recipientEmail: info.recipientEmail,
          mail: {
            id: info.mailId,
            title: info.mailTitle,
            content: info.mailContent
          },
          expiresAt: info.expiresAt
        });
      } else {
        alert('Invalid invitation link. Please contact the alumni office.');
        navigate('/');
      }
    } catch (error) {
      console.error('Token validation error:', error);

      if (error.response?.status === 404) {
        alert('This invitation link is invalid, expired, or has already been used.');
      } else {
        alert('Unable to validate invitation link. Please try again later.');
      }
      navigate('/');
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post(`${apiUrl}/api/tokens/${token}/submit`, {
        action: 'reject',
        responseData: {
          rejectionReason: rejectionReason.trim() || undefined
        }
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // Mark token as used in session
        markTokenUsed();

        // Log in the user with returned credentials
        if (response.data.user && response.data.token) {
          const userData = {
            ...response.data.user,
            token: response.data.token
          };
          saveUser(userData);
          console.log('✅ User logged in:', response.data.user.email);

          // Show success alert
          alert('Thank you for responding. Your decline has been recorded.');

          // Redirect to alumni dashboard immediately
          window.location.href = '/alumini/dashboard';
        } else {
          setError('Login failed. Please try logging in manually.');
        }
      } else {
        setError(response.data.message || 'Failed to submit rejection');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Rejection submission error:', error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 404) {
        alert('This invitation link has expired or been used already');
        navigate('/', { replace: true });
      } else {
        setError('Unable to submit your response. Please try again later.');
      }
      setIsSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className={styles.pageContainer}>
        <main className={styles.mainContent}>
          <div className={styles.loadingCard}>
            <div className={styles.spinner}></div>
            <p>Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>

          {/* Logged in indicator */}
          <div className={styles.loggedInBar}>
            <span className="material-symbols-outlined">verified_user</span>
            <span>Logged in as: <strong>{tokenSession?.recipientEmail}</strong></span>
          </div>

          {/* Reject Card */}
          <div className={styles.rejectCard}>
            <div className={styles.rejectIcon}>✋</div>
            <h2 className={styles.rejectTitle}>Decline Invitation</h2>

            {tokenSession?.mail && (
              <div className={styles.invitationInfo}>
                <h3 className={styles.mailTitle}>{tokenSession.mail?.title || 'Invitation'}</h3>
                <p className={styles.mailSender}>From: {tokenSession.mail?.senderName || 'Alumni Office'}</p>
              </div>
            )}

            <p className={styles.rejectMessage}>
              We're sorry you can't make it. Would you like to share why you're declining?
            </p>

            {error && (
              <div className={styles.errorMessage}>
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
            )}

            <div className={styles.reasonSection}>
              <label className={styles.reasonLabel}>Reason (Optional)</label>
              <textarea
                className={styles.reasonTextarea}
                placeholder="Please share your reason for declining (optional)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={loading}
                maxLength={500}
              />
              <div className={styles.charCount}>
                {rejectionReason.length}/500
              </div>
            </div>

            <div className={styles.buttonSection}>
              <button
                onClick={handleReject}
                disabled={loading}
                className={styles.confirmButton}
              >
                {loading ? 'Submitting...' : 'Confirm Decline'}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
