import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './SendOtp.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const OTP_LENGTH = 6;

export default function SendOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [resendTimer, setResendTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const email = (location.state as { email?: string } | null)?.email || sessionStorage.getItem('forgotPasswordEmail') || '';

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    // Timer for resend code
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [resendTimer]);

  useEffect(() => {
    // Auto-focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input after state update
    if (value && index < OTP_LENGTH - 1) {
      // Use setTimeout to ensure state has updated before focusing
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    // Prevent focus on inputs if previous ones are not filled
    if (index > 0 && !otp[index - 1]) {
      // Find the first empty input
      const firstEmptyIndex = otp.findIndex(val => val === '');
      if (firstEmptyIndex !== -1 && firstEmptyIndex < index) {
        inputRefs.current[firstEmptyIndex]?.focus();
      }
    }
  };

  const isInputDisabled = (index: number) => {
    // First input is always enabled
    if (index === 0) return false;
    // Other inputs are disabled if the previous one is empty
    return otp[index - 1] === '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, OTP_LENGTH);
    const digits = pastedData.split('').filter(char => /^\d$/.test(char));
    
    const newOtp = [...otp];
    digits.forEach((digit, idx) => {
      if (idx < 4) newOtp[idx] = digit;
    });
    setOtp(newOtp);

    // Focus last filled or next empty input
    const nextIndex = Math.min(digits.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      setError('Enter the complete verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }

      sessionStorage.setItem('forgotPasswordEmail', email);
      navigate('/update-password', { state: { email } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer === 0) {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to resend OTP');
        }

        setResendTimer(30);
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to resend OTP');
      } finally {
        setLoading(false);
      }
    }
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
              
              {/* Step 2: Verify - Active */}
              <div className={styles.stepItem}>
                <div className={`${styles.stepDot} ${styles.stepDotActive}`}>
                  <div className={styles.bloom}></div>
                </div>
                <span className={styles.stepLabelActive}>Verify</span>
              </div>
              
              {/* Step 3: Security - Inactive */}
              <div className={styles.stepItem}>
                <div className={styles.stepDot}></div>
                <span className={styles.stepLabelInactive}>Security</span>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.title}>Verify Email</h2>
            <p className={styles.subtitle}>
              We've sent a 6-digit verification code to {email || 'your registered email address'}.
            </p>
          </div>

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* OTP Input */}
            <div className={styles.otpContainer}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  className={`${styles.otpInput} ${digit ? styles.otpInputFilled : ''}`}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onFocus={() => handleFocus(index)}
                  onPaste={handlePaste}
                  placeholder="•"
                  disabled={isInputDisabled(index) || loading}
                />
              ))}
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            {/* Actions */}
            <div className={styles.actions}>
              <button type="submit" className={styles.submitButton} disabled={loading}>
                <span>{loading ? 'Verifying...' : 'Verify &amp; Continue'}</span>
                <span className="material-symbols-outlined">check_circle</span>
              </button>

              <div className={styles.helperLinks}>
                <button
                  type="button"
                  className={styles.resendButton}
                  onClick={handleResendCode}
                  disabled={resendTimer > 0 || loading}
                >
                  Resend code {resendTimer > 0 && (
                    <span className={styles.timer}>in {resendTimer}s</span>
                  )}
                </button>

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
