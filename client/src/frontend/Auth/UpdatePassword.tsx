import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './UpdatePassword.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function UpdatePassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const email = (location.state as { email?: string } | null)?.email || sessionStorage.getItem('forgotPasswordEmail') || '';

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  if (!email) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      sessionStorage.removeItem('forgotPasswordEmail');
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.card}>
          {/* Back Button */}
          <button
            type="button"
            className={styles.backButtonTop}
            onClick={handleGoBack}
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </button>

          {/* Progress Stepper */}
          <div className={styles.stepperWrapper}>
            <div className={styles.stepper}>
              <div className={styles.stepperLine}></div>
              
              {/* Step 1: Details - Completed */}
              <div className={styles.stepItem}>
                <div className={`${styles.stepDot} ${styles.stepDotCompleted}`}></div>
                <span className={styles.stepLabelInactive}>Details</span>
              </div>
              
              {/* Step 2: Verify - Completed */}
              <div className={styles.stepItem}>
                <div className={`${styles.stepDot} ${styles.stepDotCompleted}`}></div>
                <span className={styles.stepLabelInactive}>Verify</span>
              </div>
              
              {/* Step 3: Security - Active */}
              <div className={styles.stepItem}>
                <div className={`${styles.stepDot} ${styles.stepDotActive}`}>
                  <div className={styles.bloom}></div>
                </div>
                <span className={styles.stepLabelActive}>Security</span>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.title}>Update Security</h2>
            <p className={styles.subtitle}>
              Create a strong password for {email || 'your alumni account'}.
            </p>
          </div>

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputsContainer}>
              {/* New Password */}
              <div className={styles.inputGroup}>
                <label htmlFor="new-password" className={styles.label}>
                  New Password
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="new-password"
                    className={styles.input}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <span
                    className={`material-symbols-outlined ${styles.toggleIcon}`}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    visibility
                  </span>
                </div>
              </div>

              {/* Confirm Password */}
              <div className={styles.inputGroup}>
                <label htmlFor="confirm-password" className={styles.label}>
                  Confirm Password
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm-password"
                    className={styles.input}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <span
                    className={`material-symbols-outlined ${styles.toggleIcon}`}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    visibility
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button type="submit" className={styles.submitButton} disabled={loading}>
                <span>{loading ? 'Updating...' : 'Update Password'}</span>
                <span className="material-symbols-outlined">lock</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
