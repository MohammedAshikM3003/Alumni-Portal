import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SendOtp.module.css';

export default function SendOtp() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Timer for resend code
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    // Auto-focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input after state update
    if (value && index < 3) {
      // Use setTimeout to ensure state has updated before focusing
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index) => {
    // Prevent focus on inputs if previous ones are not filled
    if (index > 0 && !otp[index - 1]) {
      // Find the first empty input
      const firstEmptyIndex = otp.findIndex(val => val === '');
      if (firstEmptyIndex !== -1 && firstEmptyIndex < index) {
        inputRefs.current[firstEmptyIndex]?.focus();
      }
    }
  };

  const isInputDisabled = (index) => {
    // First input is always enabled
    if (index === 0) return false;
    // Other inputs are disabled if the previous one is empty
    return otp[index - 1] === '';
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    const digits = pastedData.split('').filter(char => /^\d$/.test(char));
    
    const newOtp = [...otp];
    digits.forEach((digit, idx) => {
      if (idx < 4) newOtp[idx] = digit;
    });
    setOtp(newOtp);

    // Focus last filled or next empty input
    const nextIndex = Math.min(digits.length, 3);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length === 4) {
      console.log('OTP submitted:', otpCode);
      // Navigate to update password step
      navigate('/update-password');
    }
  };

  const handleResendCode = () => {
    if (resendTimer === 0) {
      console.log('Resending OTP...');
      setResendTimer(30);
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
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
              We've sent a 4-digit verification code to your registered email address.
            </p>
          </div>

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* OTP Input */}
            <div className={styles.otpContainer}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  className={`${styles.otpInput} ${digit ? styles.otpInputFilled : ''}`}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onFocus={() => handleFocus(index)}
                  onPaste={handlePaste}
                  placeholder="•"
                  disabled={isInputDisabled(index)}
                />
              ))}
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button type="submit" className={styles.submitButton}>
                <span>Verify &amp; Continue</span>
                <span className="material-symbols-outlined">check_circle</span>
              </button>

              <div className={styles.helperLinks}>
                <button
                  type="button"
                  className={styles.resendButton}
                  onClick={handleResendCode}
                  disabled={resendTimer > 0}
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
