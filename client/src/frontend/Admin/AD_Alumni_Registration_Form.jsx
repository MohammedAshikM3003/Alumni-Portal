import React, { useState } from 'react';
import styles from './AD_Alumini_form.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const AD_Alumni_Registration_Form = ({ onLogout }) => {
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
    setIsSubmitting(true);
    setSubmitMessage({ type: '', text: '' });

    // Validate email
    if (!formData.email) {
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
      setSubmitMessage({
        type: 'error',
        text: 'Please enter a valid email address',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/registration/send-single-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          email: formData.email
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage({
          type: 'success',
          text: `Registration link sent successfully to ${formData.email}!`,
        });
        // Reset form
        setFormData({ email: '' });
      } else {
        setSubmitMessage({
          type: 'error',
          text: data.message || 'Failed to send registration link',
        });
      }
    } catch (error) {
      console.error('Error sending registration link:', error);
      setSubmitMessage({
        type: 'error',
        text: 'Error connecting to server. Please try again.',
      });
    } finally {
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

export default AD_Alumni_Registration_Form;