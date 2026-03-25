import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTokenAuth } from '../../context/tokenAuthContext/tokenAuthContext';
import styles from './Al_TokenHandler.module.css';

export default function Al_TokenHandler() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { loginWithToken, isTokenLoggedIn, tokenSession } = useTokenAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [alreadyUsed, setAlreadyUsed] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // Check if this token was already used in this session
    if (tokenSession?.token === token && tokenSession?.isUsed) {
      setAlreadyUsed(true);
      setTokenInfo({
        recipientEmail: tokenSession.recipientEmail,
        mail: tokenSession.mail,
        mailTitle: tokenSession.mail?.title
      });
      setLoading(false);
      return;
    }

    // If already logged in with this token, skip validation
    if (isTokenLoggedIn && tokenSession?.token === token) {
      setTokenInfo({
        recipientEmail: tokenSession.recipientEmail,
        mail: tokenSession.mail,
        mailTitle: tokenSession.mail?.title
      });
      setLoading(false);
      return;
    }

    if (token) {
      validateToken();
    } else {
      setError('No token provided in URL');
      setLoading(false);
    }
  }, [token, isTokenLoggedIn, tokenSession]);

  const validateToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${apiUrl}/api/tokens/validate/${token}`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.tokenInfo) {
        const info = response.data.tokenInfo;
        setTokenInfo(info);

        // Login with token - this keeps the user "logged in" for this session
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

        setLoading(false);
      } else {
        setError('Invalid token response from server');
        setLoading(false);
      }
    } catch (error) {
      console.error('Token validation error:', error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.code === 'ECONNABORTED') {
        setError('Request timed out. Please check your connection and try again.');
      } else if (error.response?.status === 404) {
        setError('Invalid, expired, or already used invitation link');
      } else if (error.response?.status === 429) {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Unable to validate invitation link. Please try again later.');
      }
      setLoading(false);
    }
  };

  const handleAccept = () => {
    navigate(`/mail/token/${token}/accept`);
  };

  const handleReject = () => {
    navigate(`/mail/token/${token}/reject`);
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <main className={styles.mainContent}>
          <div className={styles.loadingCard}>
            <div className={styles.spinner}></div>
            <h2 className={styles.loadingTitle}>Validating Invitation</h2>
            <p className={styles.loadingText}>
              Please wait while we verify your invitation link...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Token was already used - show success message
  if (alreadyUsed) {
    return (
      <div className={styles.pageContainer}>
        <main className={styles.mainContent}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>✅</div>
            <h2 className={styles.successTitle}>Response Already Submitted</h2>
            <p className={styles.successMessage}>
              You have already responded to this invitation. Thank you for your response!
            </p>
            <p className={styles.emailInfo}>
              Responded as: <strong>{tokenInfo?.recipientEmail}</strong>
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className={styles.homeButton}
            >
              Go to Home Page
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <main className={styles.mainContent}>
          <div className={styles.errorCard}>
            <div className={styles.errorIcon}>❌</div>
            <h2 className={styles.errorTitle}>Invalid Invitation Link</h2>
            <p className={styles.errorMessage}>{error}</p>
            <div className={styles.errorActions}>
              <p className={styles.helpText}>
                If you believe this is an error, please contact the alumni office or ask for a new invitation link.
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className={styles.homeButton}
              >
                Go to Home Page
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Token is valid and user is logged in - show action options
  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainContent}>
        <div className={styles.actionCard}>
          <div className={styles.loggedInBadge}>
            <span className="material-symbols-outlined">verified_user</span>
            Verified
          </div>
          <h2 className={styles.actionTitle}>Invitation Response</h2>
          {tokenInfo?.mailTitle && (
            <p className={styles.mailTitle}>{tokenInfo.mailTitle}</p>
          )}
          <p className={styles.emailInfo}>
            Logged in as: <strong>{tokenInfo?.recipientEmail}</strong>
          </p>
          <p className={styles.actionText}>
            Please choose your response to this invitation:
          </p>
          <div className={styles.buttonContainer}>
            <button onClick={handleAccept} className={styles.acceptButton}>
              Accept Invitation
            </button>
            <button onClick={handleReject} className={styles.rejectButton}>
              Decline Invitation
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
