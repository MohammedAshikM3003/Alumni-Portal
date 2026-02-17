import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ForgotPassword.module.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Details, 2: Verify, 3: Security

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('OTP requested for:', email);
    // Navigate to OTP verification page
    navigate('/send-otp');
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
              Enter your registered email to begin the verification process.
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

            <button type="submit" className={styles.submitButton}>
              <span>Send OTP</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>
        </div>

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
      </main>
    </div>
  );
}
