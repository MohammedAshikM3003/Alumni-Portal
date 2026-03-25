import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './TokenBasedAcceptForm.module.css';

export default function TokenBasedAcceptForm() {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [isExpanded, setIsExpanded] = useState(false);
  const [startYear, setStartYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    designation: '',
    companyName: '',
    mobileNo: '',
    personalEmail: '',
    officialEmail: '',
    location: '',
    startYear: '',
    endYear: ''
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // Get token info from location state or fetch it
    if (location.state?.tokenInfo) {
      setTokenInfo(location.state.tokenInfo);
      setFormData(prev => ({
        ...prev,
        personalEmail: location.state.recipientEmail || ''
      }));
    } else {
      fetchTokenInfo();
    }
  }, [token]);

  const fetchTokenInfo = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/tokens/info/${token}`);
      if (response.data.success) {
        setTokenInfo(response.data.tokenInfo);
        setFormData(prev => ({
          ...prev,
          personalEmail: response.data.tokenInfo.recipientEmail || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching token info:', error);
      setError('Unable to load invitation details');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate end year for batch
    if (name === 'startYear') {
      const yearValue = value.replace(/\D/g, '');
      if (yearValue.length <= 4) {
        if (yearValue.length === 4) {
          const year = parseInt(yearValue);
          if (year >= 2000 && year <= 2100) {
            setFormData(prev => ({
              ...prev,
              startYear: yearValue,
              endYear: (year + 4).toString()
            }));
          }
        } else {
          setFormData(prev => ({
            ...prev,
            startYear: yearValue,
            endYear: ''
          }));
        }
      }
    }
  };

  const validateForm = () => {
    const required = ['fullName', 'mobileNo', 'personalEmail'];
    const missing = required.filter(field => !formData[field].trim());

    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(', ').replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.personalEmail)) {
      setError('Please enter a valid personal email address');
      return false;
    }

    if (formData.officialEmail && !emailRegex.test(formData.officialEmail)) {
      setError('Please enter a valid official email address');
      return false;
    }

    // Mobile number validation (basic)
    const mobileRegex = /^[\+]?[1-9][\d]{9,15}$/;
    if (!mobileRegex.test(formData.mobileNo.replace(/\D/g, ''))) {
      setError('Please enter a valid mobile number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const responseData = {
        fullName: formData.fullName.trim(),
        designation: formData.designation.trim(),
        companyName: formData.companyName.trim(),
        mobileNo: formData.mobileNo.trim(),
        personalEmail: formData.personalEmail.trim().toLowerCase(),
        officialEmail: formData.officialEmail.trim().toLowerCase(),
        location: formData.location.trim(),
      };

      // Add batch year if provided
      if (formData.startYear && formData.endYear) {
        responseData.batchYear = {
          startYear: parseInt(formData.startYear),
          endYear: parseInt(formData.endYear)
        };
      }

      const response = await axios.post(`${apiUrl}/api/tokens/${token}/submit`, {
        action: 'accept',
        responseData
      }, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSubmitted(true);
        console.log('✅ Form submitted successfully');
      } else {
        setError(response.data.message || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Form submission error:', error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else if (error.response?.status === 404) {
        setError('This invitation link has expired or been used already');
      } else {
        setError('Unable to submit your response. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.pageContainer}>
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <div className={styles.successCard}>
              <div className={styles.successIcon}>✅</div>
              <h2 className={styles.successTitle}>Thank You!</h2>
              <p className={styles.successMessage}>
                Your acceptance has been successfully recorded. Thank you for taking the time to respond to this invitation.
              </p>
              {tokenInfo?.mail?.senderName && (
                <p className={styles.contactInfo}>
                  If you have any questions, please contact {tokenInfo.mail.senderName} at {tokenInfo.mail.senderEmail}
                </p>
              )}
              <button
                onClick={() => window.location.href = '/'}
                className={styles.homeButton}
              >
                Return to Home
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>

          {/* Back Button */}
          <div className={styles.backButton} onClick={() => window.history.back()}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </div>

          {/* Top Email Message Card */}
          {tokenInfo && (
            <div className={styles.emailMessageCard}>
              <div className={styles.emailHeader}>
                <div className={styles.headerLeft}>
                  <span className={`material-symbols-outlined ${styles.mailIcon}`}>mail</span>
                  <span className={styles.badgeAccept}>ACCEPT</span>
                  <span className={styles.sender}>From: {tokenInfo.mail?.senderName || 'Alumni Office'}</span>
                  <span className={styles.divider}>|</span>
                  <span className={styles.subject}>{tokenInfo.mail?.title || 'Invitation'}</span>
                </div>
                <button className={styles.collapseBtn} onClick={() => setIsExpanded(!isExpanded)}>
                  <span className={`material-symbols-outlined ${isExpanded ? styles.iconExpanded : ''}`}>
                    expand_more
                  </span>
                </button>
              </div>
              <div className={styles.emailBody}>
                {isExpanded ? (
                  <p>{tokenInfo.mail?.content || 'You are invited to participate in this event.'}</p>
                ) : (
                  <p>{(tokenInfo.mail?.content || 'You are invited to participate...').substring(0, 100)}...</p>
                )}
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className={styles.formCard}>
            <form className={styles.formContent} onSubmit={handleSubmit}>
              {error && (
                <div className={styles.errorMessage}>
                  <span className="material-symbols-outlined">error</span>
                  {error}
                </div>
              )}

              <div className={styles.inputGrid}>

                {/* Full Name */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    className={styles.inputField}
                    placeholder="e.g. Alexander Pierce"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                {/* Designation */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Designation</label>
                  <input
                    type="text"
                    name="designation"
                    className={styles.inputField}
                    placeholder="e.g. Senior Product Designer"
                    value={formData.designation}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                {/* Company Name */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    className={styles.inputField}
                    placeholder="e.g. Google LLC"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                {/* Mobile No */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Mobile No *</label>
                  <input
                    type="tel"
                    name="mobileNo"
                    className={styles.inputField}
                    placeholder="e.g. +1 (555) 000-0000"
                    value={formData.mobileNo}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                {/* Personal Email */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Personal Email *</label>
                  <input
                    type="email"
                    name="personalEmail"
                    className={styles.inputField}
                    placeholder="e.g. alex@gmail.com"
                    value={formData.personalEmail}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                {/* Official Email */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Official Email</label>
                  <input
                    type="email"
                    name="officialEmail"
                    className={styles.inputField}
                    placeholder="e.g. a.pierce@google.com"
                    value={formData.officialEmail}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                {/* Location */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Location</label>
                  <input
                    type="text"
                    name="location"
                    className={styles.inputField}
                    placeholder="e.g. San Francisco, CA"
                    value={formData.location}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                {/* Batch (Year of Passing) */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Batch (Year of Passing)</label>
                  <div className={styles.batchFieldWrapper}>
                    <input
                      type="text"
                      name="startYear"
                      className={styles.batchInputField}
                      placeholder="Start Year"
                      value={formData.startYear}
                      onChange={handleInputChange}
                      maxLength={4}
                      disabled={loading}
                    />
                    <span className={styles.batchSeparator}>-</span>
                    <input
                      type="text"
                      className={styles.batchInputField}
                      placeholder="End Year"
                      value={formData.endYear}
                      readOnly
                    />
                  </div>
                </div>

              </div>

              {/* Submit Button */}
              <div className={styles.submitContainer}>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Accept Invitation'}
                  <span className="material-symbols-outlined">
                    {loading ? 'hourglass_empty' : 'send'}
                  </span>
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
};