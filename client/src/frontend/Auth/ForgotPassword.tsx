import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ForgotPassword.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Details, 2: Verify, 3: Security
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Email address is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      sessionStorage.setItem('forgotPasswordEmail', trimmedEmail);
      navigate('/send-otp', { state: { email: trimmedEmail } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, label: 'Details' },
    { id: 2, label: 'Verify' },
    { id: 3, label: 'Security' }
  ];

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.card}>
          {/* Progress Stepper */}
          <div className={styles.stepperWrapper}>
            <div className={styles.stepper}>
              <div className={styles.stepperLine}></div>
              {steps.map((step) => (
                <div key={step.id} className={styles.stepItem}>
                  <div 
                    className={`${styles.stepDot} ${
                      step.id === currentStep ? styles.stepDotActive : ''
                    } ${step.id < currentStep ? styles.stepDotCompleted : ''}`}
                  >
                    {step.id === currentStep && <div className={styles.bloom}></div>}
                  </div>
                  <span 
                    className={`${styles.stepLabel} ${
                      step.id === currentStep ? styles.stepLabelActive : ''
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.title}>Alumni Access</h1>
            <p className={styles.subtitle}>
              Enter your registered email to receive a verification code.
            </p>
          </div>

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <div className={styles.inputWrapper}>
                <span className="material-symbols-outlined">mail</span>
                <input
                  type="email"
                  id="email"
                  className={styles.input}
                  placeholder="alumni@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Help Section */}
            <div className={styles.helpSection}>
              <div className={styles.helpCard}>
                <div className={styles.helpIcon}>
                  <span className="material-symbols-outlined">info</span>
                </div>
                <div className={styles.helpContent}>
                  <h3>What happens next?</h3>
                  <ul className={styles.helpList}>
                    <li>
                      <span className={styles.stepNumber}>1</span>
                      <span>We'll send a verification code to your registered email</span>
                    </li>
                    <li>
                      <span className={styles.stepNumber}>2</span>
                      <span>Enter the 6-digit code to verify your identity</span>
                    </li>
                    <li>
                      <span className={styles.stepNumber}>3</span>
                      <span>Create a new secure password for your account</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <button type="submit" className={styles.submitButton} disabled={loading}>
              <span>{loading ? 'Sending...' : 'Send OTP'}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>

          {/* Footer Link */}
          <div className={styles.footer}>
            <p className={styles.footerText}>
              Already have an account?{' '}
              <button 
                type="button"
                onClick={() => navigate('/login')} 
                className={styles.footerLink}
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
