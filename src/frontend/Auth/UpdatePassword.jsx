import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UpdatePassword.module.css';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
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

    console.log('Password updated successfully');
    // Navigate to login or success page
    navigate('/login');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.card}>
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
              Create a strong password to protect your alumni account and personal data.
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
              <button type="submit" className={styles.submitButton}>
                <span>Update Password</span>
                <span className="material-symbols-outlined">lock</span>
              </button>

              <div className={styles.backButtonWrapper}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={handleGoBack}
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Go Back
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className={styles.footer}>
          Need help? Contact{' '}
          <a href="#" className={styles.footerLink}>Alumni Support</a>
        </p>
      </main>
    </div>
  );
}
