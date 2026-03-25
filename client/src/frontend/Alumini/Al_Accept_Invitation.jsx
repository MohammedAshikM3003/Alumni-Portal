import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/authContext/authContext';
import { useTokenAuth } from '../../context/tokenAuthContext/tokenAuthContext';
import styles from './Al_Accept_Invitation.module.css';

export default function Al_Accept_Invitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { saveUser, isLoggedIn } = useAuth();
  const { loginWithToken, isTokenLoggedIn, tokenSession, markTokenUsed, loading: authLoading } = useTokenAuth();

  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    // Existing fields (keep for compatibility)
    fullName: '',
    designation: '',
    companyName: '',
    mobileNo: '',
    personalEmail: '',
    officialEmail: '',
    location: '',
    startYear: '',
    endYear: '',

    // New address fields
    presentAddress: { street: '', city: '', pinCode: '', mobile: '' },
    permanentAddress: { street: '', city: '', pinCode: '', mobile: '' },
    sameAsPermanent: false,

    // Entrepreneurship
    isEntrepreneur: false,
    entrepreneurDetails: {
      organizationName: '',
      natureOfWork: '',
      annualTurnover: '',
      numberOfEmployees: ''
    }
  });

  // Separate state for dynamic qualifications table
  const [qualifications, setQualifications] = useState([
    { id: 1, course: '', institution: '', yearOfPassing: '', percentage: '', boardUniversity: '' }
  ]);

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // If already logged in via regular auth (after successful submission), redirect to dashboard
    if (isLoggedIn) {
      navigate('/alumini/dashboard', { replace: true });
      return;
    }

    // Check if token was already used (but not during submission)
    if (tokenSession?.token === token && tokenSession?.isUsed && !isSubmitting) {
      alert('This invitation link has already been used. Thank you for your response!');
      navigate('/', { replace: true });
      return;
    }

    // Check if user is logged in via token
    if (!isTokenLoggedIn || tokenSession?.token !== token) {
      // Need to validate token first
      validateToken();
      return;
    }

    // Pre-fill email from token session
    if (tokenSession?.recipientEmail) {
      setFormData(prev => ({
        ...prev,
        personalEmail: tokenSession.recipientEmail
      }));
    }
  }, [token, isTokenLoggedIn, tokenSession, authLoading, navigate, isLoggedIn, isSubmitting]);

  const validateToken = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/tokens/validate/${token}`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.tokenInfo) {
        const info = response.data.tokenInfo;

        // Login with token
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

        // Pre-fill email
        setFormData(prev => ({
          ...prev,
          personalEmail: info.recipientEmail
        }));
      } else {
        alert('Invalid invitation link. Please contact the alumni office.');
        navigate('/');
      }
    } catch (error) {
      console.error('Token validation error:', error);

      if (error.response?.status === 404) {
        alert('This invitation link is invalid, expired, or has already been used.');
      } else {
        alert('Unable to validate invitation link. Please try again later.');
      }
      navigate('/');
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

  // Address change handler
  const handleAddressChange = (addressType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [addressType]: { ...prev[addressType], [field]: value }
    }));
  };

  // Copy permanent address to present address
  const handleCopyAddress = (checked) => {
    setFormData(prev => ({
      ...prev,
      sameAsPermanent: checked,
      presentAddress: checked ? { ...prev.permanentAddress } : prev.presentAddress
    }));
  };

  // Entrepreneurship change handler
  const handleEntrepreneurChange = (isEntrepreneur) => {
    setFormData(prev => ({
      ...prev,
      isEntrepreneur,
      entrepreneurDetails: isEntrepreneur
        ? prev.entrepreneurDetails
        : { organizationName: '', natureOfWork: '', annualTurnover: '', numberOfEmployees: '' }
    }));
  };

  // Nested object change handler for entrepreneurship details
  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  // Qualification table handlers
  const addQualificationRow = () => {
    setQualifications(prev => [
      ...prev,
      { id: Date.now(), course: '', institution: '', yearOfPassing: '', percentage: '', boardUniversity: '' }
    ]);
  };

  const deleteQualificationRow = (id) => {
    if (qualifications.length > 1) {
      setQualifications(prev => prev.filter(row => row.id !== id));
    }
  };

  const handleQualificationChange = (id, field, value) => {
    setQualifications(prev =>
      prev.map(row => row.id === id ? { ...row, [field]: value } : row)
    );
  };

  const validateForm = () => {
    const errors = [];

    // Required field validation
    const required = ['fullName', 'mobileNo', 'personalEmail'];
    const missing = required.filter(field => !formData[field].trim());

    if (missing.length > 0) {
      errors.push(`Please fill in: ${missing.join(', ').replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.personalEmail && !emailRegex.test(formData.personalEmail)) {
      errors.push('Please enter a valid personal email address');
    }

    if (formData.officialEmail && !emailRegex.test(formData.officialEmail)) {
      errors.push('Please enter a valid official email address');
    }

    // Mobile number validation
    const mobileRegex = /^[\+]?[1-9][\d]{9,15}$/;
    if (!mobileRegex.test(formData.mobileNo.replace(/\D/g, ''))) {
      errors.push('Please enter a valid mobile number');
    }

    // Address validation - at least one complete address required
    const hasCompletePresentAddress =
      formData.presentAddress.street.trim() &&
      formData.presentAddress.city.trim();

    const hasCompletePermanentAddress =
      formData.permanentAddress.street.trim() &&
      formData.permanentAddress.city.trim();

    if (!hasCompletePresentAddress && !hasCompletePermanentAddress) {
      errors.push('Please provide at least one complete address (street and city are required)');
    }

    // Qualification validation - at least one qualification with basic info
    const hasCompleteQualification = qualifications.some(q =>
      q.course.trim() && q.institution.trim() && q.yearOfPassing.trim()
    );

    if (!hasCompleteQualification) {
      errors.push('Please provide at least one qualification with course, institution, and year of passing');
    }

    // Entrepreneurship validation
    if (formData.isEntrepreneur) {
      const requiredEntrepreneurFields = ['organizationName', 'natureOfWork'];
      const missingEntrepreneurFields = requiredEntrepreneurFields.filter(
        field => !formData.entrepreneurDetails[field].trim()
      );

      if (missingEntrepreneurFields.length > 0) {
        errors.push('Please provide organization name and nature of work for entrepreneurship details');
      }
    }

    // Set first error as display error
    if (errors.length > 0) {
      setError(errors[0]);
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setIsSubmitting(true);
    setError(null);

    try {
      const responseData = {
        // Backward compatibility fields (for current backend)
        fullName: formData.fullName.trim(),
        designation: formData.designation.trim(),
        companyName: formData.companyName.trim(),
        mobileNo: formData.mobileNo.trim(),
        personalEmail: formData.personalEmail.trim().toLowerCase(),
        officialEmail: formData.officialEmail.trim().toLowerCase(),
        location: formData.location.trim(),

        // New Alumni model fields
        name: formData.fullName.trim(),
        presentAddress: {
          street: formData.presentAddress.street.trim(),
          city: formData.presentAddress.city.trim(),
          pinCode: formData.presentAddress.pinCode.trim(),
          mobile: formData.presentAddress.mobile.trim()
        },
        permanentAddress: {
          street: formData.permanentAddress.street.trim(),
          city: formData.permanentAddress.city.trim(),
          pinCode: formData.permanentAddress.pinCode.trim(),
          mobile: formData.permanentAddress.mobile.trim()
        },

        // Educational qualifications - filter out empty entries
        collegeQualifications: qualifications.filter(q =>
          q.course.trim() || q.institution.trim() || q.yearOfPassing.trim() ||
          q.percentage.trim() || q.boardUniversity.trim()
        ).map(q => ({
          course: q.course.trim(),
          institution: q.institution.trim(),
          yearOfPassing: q.yearOfPassing.trim(),
          percentage: q.percentage.trim(),
          boardUniversity: q.boardUniversity.trim()
        })),

        // Entrepreneurship details
        isEntrepreneur: formData.isEntrepreneur,
        entrepreneurDetails: formData.isEntrepreneur ? {
          organizationName: formData.entrepreneurDetails.organizationName.trim(),
          natureOfWork: formData.entrepreneurDetails.natureOfWork.trim(),
          annualTurnover: formData.entrepreneurDetails.annualTurnover.trim(),
          numberOfEmployees: formData.entrepreneurDetails.numberOfEmployees.trim()
        } : undefined
      };

      // Add batch year if provided (backward compatibility)
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
        // Mark token as used in session
        markTokenUsed();

        // Log in the user with returned credentials
        if (response.data.user && response.data.token) {
          const userData = {
            ...response.data.user,
            token: response.data.token
          };
          saveUser(userData);
          console.log('✅ User logged in:', response.data.user.email);

          // Show success alert
          alert('Thank you! Your acceptance has been successfully recorded.');

          // Redirect to alumni dashboard immediately
          window.location.href = '/alumini/dashboard';
        } else {
          setError('Login failed. Please try logging in manually.');
        }
      } else {
        setError(response.data.message || 'Failed to submit response');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Form submission error:', error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else if (error.response?.status === 404) {
        alert('This invitation link has expired or been used already');
        navigate('/', { replace: true });
      } else {
        setError('Unable to submit your response. Please try again later.');
      }
      setIsSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className={styles.pageContainer}>
        <main className={styles.mainContent} style={{ marginLeft: 0 }}>
          <div className={styles.contentWrapper}>
            <div className={styles.loadingCard}>
              <div className={styles.spinner}></div>
              <p>Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Main Content Area - No Sidebar */}
      <main className={styles.mainContent} style={{ marginLeft: 0 }}>
        <div className={styles.contentWrapper}>

          {/* Logged in indicator */}
          <div className={styles.loggedInBar}>
            <span className="material-symbols-outlined">verified_user</span>
            <span>Logged in as: <strong>{tokenSession?.recipientEmail}</strong></span>
          </div>

          {/* Top Email Message Card */}
          {tokenSession?.mail && (
            <div className={styles.emailMessageCard}>
              <div className={styles.emailHeader}>
                <div className={styles.headerLeft}>
                  <span className={`material-symbols-outlined ${styles.mailIcon}`}>mail</span>
                  <span className={styles.badgeAccept}>ACCEPT</span>
                  <span className={styles.sender}>From: {tokenSession.mail?.senderName || 'Alumni Office'}</span>
                  <span className={styles.divider}>|</span>
                  <span className={styles.subject}>{tokenSession.mail?.title || 'Invitation'}</span>
                </div>
                <button className={styles.collapseBtn} onClick={() => setIsExpanded(!isExpanded)}>
                  <span className={`material-symbols-outlined ${isExpanded ? styles.iconExpanded : ''}`}>
                    expand_more
                  </span>
                </button>
              </div>
              <div className={styles.emailBody}>
                {isExpanded ? (
                  <p>{tokenSession.mail?.content || 'You are invited to participate in this event.'}</p>
                ) : (
                  <p>{(tokenSession.mail?.content || 'You are invited to participate...').substring(0, 100)}...</p>
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

              <div className={styles.formContent}>
                {/* Personal Information Section */}
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <span className={`material-symbols-outlined ${styles.sectionIcon}`}>person</span>
                    <h3>Personal Information</h3>
                  </div>
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
                </div>

                {/* Address Information Section */}
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <span className={`material-symbols-outlined ${styles.sectionIcon}`}>home</span>
                    <h3>Address Information</h3>
                  </div>

                  <div className={styles.addressGrid}>
                    {/* Permanent Address */}
                    <div className={styles.addressCard}>
                      <h4 className={styles.addressCardTitle}>Permanent Address</h4>
                      <div className={styles.addressInputs}>
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Street Address</label>
                          <input
                            type="text"
                            className={styles.inputField}
                            placeholder="Enter street address"
                            value={formData.permanentAddress.street}
                            onChange={(e) => handleAddressChange('permanentAddress', 'street', e.target.value)}
                            disabled={loading}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>City</label>
                          <input
                            type="text"
                            className={styles.inputField}
                            placeholder="Enter city"
                            value={formData.permanentAddress.city}
                            onChange={(e) => handleAddressChange('permanentAddress', 'city', e.target.value)}
                            disabled={loading}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>PIN Code</label>
                          <input
                            type="text"
                            className={styles.inputField}
                            placeholder="Enter PIN code"
                            value={formData.permanentAddress.pinCode}
                            onChange={(e) => handleAddressChange('permanentAddress', 'pinCode', e.target.value)}
                            disabled={loading}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Mobile</label>
                          <input
                            type="tel"
                            className={styles.inputField}
                            placeholder="Enter mobile number"
                            value={formData.permanentAddress.mobile}
                            onChange={(e) => handleAddressChange('permanentAddress', 'mobile', e.target.value)}
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Present Address */}
                    <div className={styles.addressCard}>
                      <h4 className={styles.addressCardTitle}>Present Address</h4>
                      <div className={styles.addressInputs}>
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Street Address</label>
                          <input
                            type="text"
                            className={styles.inputField}
                            placeholder="Enter street address"
                            value={formData.presentAddress.street}
                            onChange={(e) => handleAddressChange('presentAddress', 'street', e.target.value)}
                            disabled={loading || formData.sameAsPermanent}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>City</label>
                          <input
                            type="text"
                            className={styles.inputField}
                            placeholder="Enter city"
                            value={formData.presentAddress.city}
                            onChange={(e) => handleAddressChange('presentAddress', 'city', e.target.value)}
                            disabled={loading || formData.sameAsPermanent}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>PIN Code</label>
                          <input
                            type="text"
                            className={styles.inputField}
                            placeholder="Enter PIN code"
                            value={formData.presentAddress.pinCode}
                            onChange={(e) => handleAddressChange('presentAddress', 'pinCode', e.target.value)}
                            disabled={loading || formData.sameAsPermanent}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Mobile</label>
                          <input
                            type="tel"
                            className={styles.inputField}
                            placeholder="Enter mobile number"
                            value={formData.presentAddress.mobile}
                            onChange={(e) => handleAddressChange('presentAddress', 'mobile', e.target.value)}
                            disabled={loading || formData.sameAsPermanent}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Copy Address Checkbox */}
                  <div className={styles.copyAddressWrapper}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.sameAsPermanent}
                        onChange={(e) => handleCopyAddress(e.target.checked)}
                        disabled={loading}
                      />
                      <span>Copy permanent address to present address</span>
                    </label>
                  </div>
                </div>

                {/* Educational Qualifications Section */}
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <span className={`material-symbols-outlined ${styles.sectionIcon}`}>school</span>
                    <h3>Educational Qualifications</h3>
                  </div>

                  <div className={styles.tableContainer}>
                    <table className={styles.qualificationTable}>
                      <thead>
                        <tr className={styles.tableHeader}>
                          <th>Course</th>
                          <th>Institution</th>
                          <th>Year of Passing</th>
                          <th>Percentage</th>
                          <th>Board/University</th>
                          <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {qualifications.map((row, index) => (
                          <tr key={row.id}>
                            <td>
                              <input
                                type="text"
                                className={styles.tableInput}
                                placeholder="Enter course"
                                value={row.course}
                                onChange={(e) => handleQualificationChange(row.id, 'course', e.target.value)}
                                disabled={loading}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className={styles.tableInput}
                                placeholder="Enter institution"
                                value={row.institution}
                                onChange={(e) => handleQualificationChange(row.id, 'institution', e.target.value)}
                                disabled={loading}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className={styles.tableInput}
                                placeholder="YYYY"
                                value={row.yearOfPassing}
                                onChange={(e) => handleQualificationChange(row.id, 'yearOfPassing', e.target.value)}
                                disabled={loading}
                                maxLength={4}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className={styles.tableInput}
                                placeholder="Enter %"
                                value={row.percentage}
                                onChange={(e) => handleQualificationChange(row.id, 'percentage', e.target.value)}
                                disabled={loading}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className={styles.tableInput}
                                placeholder="Enter board/university"
                                value={row.boardUniversity}
                                onChange={(e) => handleQualificationChange(row.id, 'boardUniversity', e.target.value)}
                                disabled={loading}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className={styles.deleteBtn}
                                onClick={() => deleteQualificationRow(row.id)}
                                disabled={loading || qualifications.length === 1}
                                title="Delete row"
                              >
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className={styles.tableActions}>
                      <button
                        type="button"
                        className={styles.addRowBtn}
                        onClick={addQualificationRow}
                        disabled={loading}
                      >
                        <span className="material-symbols-outlined">add</span>
                        Add Qualification
                      </button>
                    </div>
                  </div>
                </div>

                {/* Professional Information Section */}
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <span className={`material-symbols-outlined ${styles.sectionIcon}`}>work</span>
                    <h3>Professional Information</h3>
                  </div>
                  <div className={styles.inputGrid}>
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
                  </div>
                </div>

                {/* Entrepreneurship Section */}
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <span className={`material-symbols-outlined ${styles.sectionIcon}`}>business</span>
                    <h3>Entrepreneurship Details</h3>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Are you an entrepreneur?</label>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioOption}>
                        <input
                          type="radio"
                          name="entrepreneur"
                          className={styles.radioInput}
                          checked={formData.isEntrepreneur === true}
                          onChange={() => handleEntrepreneurChange(true)}
                          disabled={loading}
                        />
                        <span>Yes</span>
                      </label>
                      <label className={styles.radioOption}>
                        <input
                          type="radio"
                          name="entrepreneur"
                          className={styles.radioInput}
                          checked={formData.isEntrepreneur === false}
                          onChange={() => handleEntrepreneurChange(false)}
                          disabled={loading}
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  {formData.isEntrepreneur && (
                    <div className={styles.entrepreneurFields}>
                      <div className={styles.inputGrid}>
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Organization Name</label>
                          <input
                            type="text"
                            className={styles.inputField}
                            placeholder="Name and address of organization"
                            value={formData.entrepreneurDetails.organizationName}
                            onChange={(e) => handleNestedChange('entrepreneurDetails', 'organizationName', e.target.value)}
                            disabled={loading}
                          />
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Nature of Work</label>
                          <input
                            type="text"
                            className={styles.inputField}
                            placeholder="Nature of work / Product"
                            value={formData.entrepreneurDetails.natureOfWork}
                            onChange={(e) => handleNestedChange('entrepreneurDetails', 'natureOfWork', e.target.value)}
                            disabled={loading}
                          />
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Annual Turnover</label>
                          <input
                            type="text"
                            className={styles.inputField}
                            placeholder="e.g. ₹10 Lakhs"
                            value={formData.entrepreneurDetails.annualTurnover}
                            onChange={(e) => handleNestedChange('entrepreneurDetails', 'annualTurnover', e.target.value)}
                            disabled={loading}
                          />
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Number of Employees</label>
                          <input
                            type="text"
                            className={styles.inputField}
                            placeholder="e.g. 25"
                            value={formData.entrepreneurDetails.numberOfEmployees}
                            onChange={(e) => handleNestedChange('entrepreneurDetails', 'numberOfEmployees', e.target.value)}
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>
                  )}
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
}
