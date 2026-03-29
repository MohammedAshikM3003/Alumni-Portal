import React, { useState } from 'react';
import styles from './AD_Alumini_form.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const createClientTraceId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const logClientStep = (traceId, flow, step, details = {}) => {
  console.log(`[RegistrationMailClient:${traceId}][${flow}][Step ${step}]`, details);
};

const logClientBreak = (traceId, flow, step, reason, details = {}) => {
  console.warn(`[RegistrationMailClient:${traceId}][${flow}][BREAK at Step ${step}] ${reason}`, details);
};

const Admin_Alumni_Registration_Form = ({ onLogout }) => {
  const { user } = useAuth();

  // Form state - only email required
  const [formData, setFormData] = useState({
    email: ''
  });

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission - creates token and sends registration email
  const handleSubmit = async () => {
    const clientTraceId = createClientTraceId();
    setIsSubmitting(true);
    setSubmitMessage({ type: '', text: '' });
    logClientStep(clientTraceId, 'send-single-link', 1, {
      email: formData.email,
      hasAuthToken: Boolean(user?.token),
      apiBaseUrl: API_BASE_URL,
    });

    // Validate email
    if (!formData.email) {
      logClientBreak(clientTraceId, 'send-single-link', 2, 'Email missing');
      setSubmitMessage({
        type: 'error',
        text: 'Please enter an email address',
      });
      setIsSubmitting(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      logClientBreak(clientTraceId, 'send-single-link', 3, 'Invalid email format', { email: formData.email });
      setSubmitMessage({
        type: 'error',
        text: 'Please enter a valid email address',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const endpoint = `${API_BASE_URL}/api/registration/send-single-link`;
      logClientStep(clientTraceId, 'send-single-link', 4, {
        endpoint,
        apiBaseUrl: API_BASE_URL,
        email: formData.email,
        hasAuthToken: Boolean(user?.token),
        pageOrigin: window.location.origin,
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          email: formData.email
        }),
      });

      const responseText = await response.text();
      let data = null;

      try {
        logClientStep(clientTraceId, 'send-single-link', 5, { message: 'Parsing response body' });
        data = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        logClientBreak(clientTraceId, 'send-single-link', 5, 'Non-JSON response', {
          status: response.status,
          responseText,
          parseError,
        });
      }

      logClientStep(clientTraceId, 'send-single-link', 6, {
        status: response.status,
        ok: response.ok,
        data,
      });

      if (response.ok) {
        logClientStep(clientTraceId, 'send-single-link', 7, {
          message: 'Success response received',
          serverTraceId: data?.traceId,
          serverStep: data?.step,
        });
        setSubmitMessage({
          type: 'success',
          text: `Registration link sent successfully to ${formData.email}!`,
        });
        // Reset form
        setFormData({ email: '' });
      } else {
        logClientBreak(clientTraceId, 'send-single-link', 7, 'API returned non-OK status', {
          status: response.status,
          data,
          serverTraceId: data?.traceId,
          serverFlow: data?.flow,
          serverStep: data?.step,
        });
        setSubmitMessage({
          type: 'error',
          text: data?.message || 'Failed to send registration link',
        });
      }
    } catch (error) {
      logClientBreak(clientTraceId, 'send-single-link', 8, 'Fetch failed', {
        error,
        message: error?.message,
        stack: error?.stack,
        apiBaseUrl: API_BASE_URL,
      });
      setSubmitMessage({
        type: 'error',
        text: 'Error connecting to server. Please try again.',
      });
    } finally {
      logClientStep(clientTraceId, 'send-single-link', 9, { message: 'handleSubmit finished' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar onLogout={onLogout} />

      <main className={styles.mainContent}>
        <div className={styles.headerContainer}>
          <h1 className={styles.pageTitle}>Send Alumni Registration Link</h1>
          <p className={styles.pageSubtitle}>
            Enter an email address to send a registration link to a new alumni member
          </p>
        </div>

        <div className={styles.formContainer}>
          {/* Email Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Alumni Email</h2>
            </div>

            <div className={styles.sectionContent}>
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    Email Address <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className={styles.input}
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter alumni email address"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div className={styles.submitSection}>
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Registration Link'}
              <span>→</span>
            </button>

            {submitMessage.text && (
              <div
                className={`${styles.submitMessage} ${submitMessage.type === 'success' ? styles.successMessage : styles.errorMessage}`}
              >
                {submitMessage.text}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin_Alumni_Registration_Form;