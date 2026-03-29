import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext/authContext';
import styles from './AD_Alumni_Registration.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Admin_Alumni_Registration = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { saveUser } = useAuth();

  // Token validation states
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenEmail, setTokenEmail] = useState('');
  const [tokenError, setTokenError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    name: '',
    fatherName: '',
    registerNumber: '',
    dob: '',
    yearFrom: '',
    degree: '',
    branch: '',
    presentAddress: {
      street: '',
      city: '',
      pinCode: '',
      mobile: '',
    },
    permanentAddress: {
      street: '',
      city: '',
      pinCode: '',
      mobile: '',
    },
    sameAsPermanent: false,
    hasCompetitiveExams: false,
    exams: {
      GRE: '',
      TOEFL: '',
      UPSC: '',
      GATE: '',
      IAS: '',
    },
    othersExam: { name: '', marks: '' },
    placementType: '',
    designation: '',
    companyAddress: '',
    employmentRemarks: '',
    isEntrepreneur: false,
    entrepreneurDetails: {
      organizationName: '',
      natureOfWork: '',
      annualTurnover: '',
      numberOfEmployees: '',
    },
    maritalStatus: '',
    spouseDetails: {
      name: '',
      qualification: '',
      numberOfChildren: '',
    },
    extraCurricular: '',
    otherInfo: '',
  });

  const [qualRows, setQualRows] = useState([
    { id: 1, course: '', institution: '', yearOfPassing: '', percentage: '', boardUniversity: '' },
  ]);

  const [alumniRows, setAlumniRows] = useState([
    { id: 1, name: '', degree: '', batch: '', email: '', phone: '' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
  const [departments, setDepartments] = useState([]);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/registration/validate/${token}`);
        const data = await response.json();

        if (data.success) {
          setTokenValid(true);
          setTokenEmail(data.email);

          // Populate form with pre-filled data if available
          if (data.prefilledData) {
            setFormData(prevData => ({
              ...prevData,
              ...data.prefilledData
            }));
          }
        } else {
          setTokenError(data.message || 'Invalid or expired registration link');
        }
      } catch (error) {
        setTokenError('Failed to validate registration link. Please try again.');
        console.error('Token validation error:', error);
      } finally {
        setValidating(false);
      }
    };

    if (token) {
      validateToken();
    } else {
      setTokenError('No registration token provided');
      setValidating(false);
    }
  }, [token]);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/departments/public`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.departments) {
            setDepartments(data.departments);
          }
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    if (tokenValid) {
      fetchDepartments();
    }
  }, [tokenValid]);

  const uniqueStreams = [...new Set(departments.map((dept) => dept.stream))];
  const endYear = formData.yearFrom ? parseInt(formData.yearFrom) + 4 : '';

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  const handleExamChange = (exam, value) => {
    setFormData((prev) => ({
      ...prev,
      exams: { ...prev.exams, [exam]: value },
    }));
  };

  const handleSameAddress = (checked) => {
    setFormData((prev) => ({
      ...prev,
      sameAsPermanent: checked,
      permanentAddress: checked ? { ...prev.presentAddress } : prev.permanentAddress,
    }));
  };

  // Qualification rows handlers
  const addQualRow = () => {
    setQualRows([...qualRows, { id: Date.now(), course: '', institution: '', yearOfPassing: '', percentage: '', boardUniversity: '' }]);
  };

  const deleteQualRow = (id) => {
    if (qualRows.length > 1) {
      setQualRows(qualRows.filter((row) => row.id !== id));
    }
  };

  const handleQualRowChange = (id, field, value) => {
    setQualRows(qualRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  // Alumni rows handlers
  const addAlumniRow = () => {
    setAlumniRows([...alumniRows, { id: Date.now(), name: '', degree: '', batch: '', email: '', phone: '' }]);
  };

  const deleteAlumniRow = (id) => {
    if (alumniRows.length > 1) {
      setAlumniRows(alumniRows.filter((row) => row.id !== id));
    }
  };

  const handleAlumniRowChange = (id, field, value) => {
    setAlumniRows(alumniRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitMessage({ type: '', text: '' });

    // Validate passwords
    if (!formData.password || !formData.confirmPassword) {
      setSubmitMessage({ type: 'error', text: 'Password and Confirm Password are required' });
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setSubmitMessage({ type: 'error', text: 'Passwords do not match' });
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setSubmitMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      setIsSubmitting(false);
      return;
    }

    // Validate required fields
    if (!formData.registerNumber || !formData.name || !formData.dob || !formData.yearFrom || !formData.degree || !formData.branch) {
      setSubmitMessage({
        type: 'error',
        text: 'Please fill all required fields (Name, Register Number, DOB, Year, Degree, Branch)',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Build competitive exams array
      const competitiveExams = [];
      if (formData.hasCompetitiveExams) {
        Object.entries(formData.exams).forEach(([examName, marks]) => {
          if (marks) competitiveExams.push({ examName, marks: parseInt(marks) });
        });
        if (formData.othersExam.name && formData.othersExam.marks) {
          competitiveExams.push({ examName: formData.othersExam.name, marks: parseInt(formData.othersExam.marks) });
        }
      }

      // Build college qualifications
      const collegeQualifications = qualRows
        .filter((row) => row.course || row.institution)
        .map(({ id, ...rest }) => rest);

      // Build known alumni
      const knownAlumni = alumniRows
        .filter((row) => row.name || row.email)
        .map(({ id, ...rest }) => rest);

      const payload = {
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        registerNumber: formData.registerNumber,
        name: formData.name,
        fatherName: formData.fatherName,
        dob: formData.dob,
        yearFrom: parseInt(formData.yearFrom),
        yearTo: endYear,
        degree: formData.degree,
        branch: formData.branch,
        presentAddress: formData.presentAddress,
        permanentAddress: formData.permanentAddress,
        hasCompetitiveExams: formData.hasCompetitiveExams,
        competitiveExams,
        collegeQualifications,
        placementType: formData.placementType,
        designation: formData.designation,
        companyAddress: formData.companyAddress,
        employmentRemarks: formData.employmentRemarks,
        isEntrepreneur: formData.isEntrepreneur,
        entrepreneurDetails: formData.isEntrepreneur ? formData.entrepreneurDetails : undefined,
        maritalStatus: formData.maritalStatus,
        spouseDetails: formData.maritalStatus === 'Married' ? formData.spouseDetails : undefined,
        extraCurricular: formData.extraCurricular,
        otherInfo: formData.otherInfo,
        knownAlumni,
      };

      const response = await fetch(`${API_BASE_URL}/api/registration/submit/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage({
          type: 'success',
          text: 'Registration completed successfully! Redirecting to dashboard...',
        });
        // Auto-login
        saveUser(data.user, data.token);
        setTimeout(() => navigate('/alumini/dashboard'), 1500);
      } else {
        setSubmitMessage({ type: 'error', text: data.message || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      setSubmitMessage({ type: 'error', text: 'Network error. Please check your connection and try again.' });
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (validating) {
    return (
      <div className={styles.pageLayout}>
        <main className={styles.mainContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Validating registration link...</p>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (!tokenValid) {
    return (
      <div className={styles.pageLayout}>
        <main className={styles.mainContent}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>!</div>
            <h2 className={styles.errorTitle}>Invalid Registration Link</h2>
            <p className={styles.errorText}>{tokenError}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageLayout}>
      <main className={styles.mainContent}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.logoContainer}>
            <div className={styles.logoIcon}>
              <span style={{ fontSize: '1.75rem' }}>🎓</span>
            </div>
            <h1 className={styles.pageTitle}>Alumni Registration</h1>
          </div>
          <p className={styles.pageSubtitle}>Complete your registration to join the alumni network</p>
        </div>

        <div className={styles.formContainer}>
          {/* Submit Message */}
          {submitMessage.text && (
            <div className={`${styles.submitMessage} ${submitMessage.type === 'success' ? styles.successMessage : styles.errorMessage}`}>
              {submitMessage.text}
            </div>
          )}

          {/* Section 0: Account Credentials */}
          <section className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Account Credentials</h2>
            <div className={styles.formStack}>
              <div className={styles.gridThreeCol}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Email Address *</label>
                  <input
                    type="email"
                    className={styles.textInput}
                    value={tokenEmail}
                    disabled
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Password *</label>
                  <input
                    type="password"
                    className={styles.textInput}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                  <span className={styles.passwordHint}>Minimum 6 characters</span>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Confirm Password *</label>
                  <input
                    type="password"
                    className={styles.textInput}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 1: Personal Details */}
          <section className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Section 1: Personal Details</h2>
            <div className={styles.formStack}>
              <div className={styles.gridTwoCol}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Full Name *</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    placeholder="e.g. Alexander Pierce"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Father/Guardian Name</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    placeholder="e.g. Robert Pierce"
                    value={formData.fatherName}
                    onChange={(e) => handleInputChange('fatherName', e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.gridTwoCol}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Register Number *</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    placeholder="11-digit Register Number"
                    value={formData.registerNumber}
                    onChange={(e) => handleInputChange('registerNumber', e.target.value)}
                    maxLength={11}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Date of Birth *</label>
                  <input
                    type="date"
                    className={styles.textInput}
                    value={formData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.gridThreeCol}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Years of Study (From) *</label>
                  <select
                    className={styles.selectInput}
                    value={formData.yearFrom}
                    onChange={(e) => handleInputChange('yearFrom', e.target.value)}
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: 50 }, (_, i) => 2001 + i).map((year) => (
                      <option className={styles.dd} key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>(To)</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={endYear}
                    disabled
                    placeholder="Auto-filled"
                  />
                </div>
                <div></div>
              </div>

              <div className={styles.gridTwoCol}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Degree *</label>
                  <select
                    className={styles.selectInput}
                    value={formData.degree}
                    onChange={(e) => handleInputChange('degree', e.target.value)}
                  >
                    <option value="">Select Degree</option>
                    {uniqueStreams.map((stream) => (
                      <option key={stream} value={stream}>{stream}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Course / Branch *</label>
                  <select
                    className={styles.selectInput}
                    value={formData.branch}
                    onChange={(e) => handleInputChange('branch', e.target.value)}
                  >
                    <option value="">Select Course / Branch</option>
                    {departments
                      .filter(dept => !formData.degree || dept.stream === formData.degree)
                      .map((dept) => (
                        <option key={dept._id} value={dept.branch}>{dept.branch}</option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Address */}
          <section className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Section 2: Address Details</h2>
            <div className={styles.formStackLarge}>
              {/* Present Address */}
              <div className={styles.addressBox}>
                <div className={styles.addressHeader}>
                  <span>📍</span>
                  <span>Present Address</span>
                </div>
                <div className={styles.addressFields}>
                  <div className={styles.inputGroup}>
                    <label className={styles.labelSmall}>Street Address</label>
                    <input
                      type="text"
                      className={styles.textInputSm}
                      placeholder="Street Address"
                      value={formData.presentAddress.street}
                      onChange={(e) => handleNestedChange('presentAddress', 'street', e.target.value)}
                    />
                  </div>
                  <div className={styles.gridTwoColSmall}>
                    <div className={styles.inputGroup}>
                      <label className={styles.labelSmall}>City</label>
                      <input
                        type="text"
                        className={styles.textInputSm}
                        placeholder="City"
                        value={formData.presentAddress.city}
                        onChange={(e) => handleNestedChange('presentAddress', 'city', e.target.value)}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.labelSmall}>PIN Code</label>
                      <input
                        type="text"
                        className={styles.textInputSm}
                        placeholder="PIN Code"
                        value={formData.presentAddress.pinCode}
                        onChange={(e) => handleNestedChange('presentAddress', 'pinCode', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.labelSmall}>Mobile Number</label>
                    <input
                      type="tel"
                      className={styles.textInputSm}
                      placeholder="Mobile Number"
                      value={formData.presentAddress.mobile}
                      onChange={(e) => handleNestedChange('presentAddress', 'mobile', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Copy Address Checkbox */}
              <div className={styles.copyAddressWrapper}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.sameAsPermanent}
                    onChange={(e) => handleSameAddress(e.target.checked)}
                  />
                  Permanent address same as present address
                </label>
              </div>

              {/* Permanent Address */}
              {!formData.sameAsPermanent && (
                <div className={styles.addressBox}>
                  <div className={styles.addressHeader}>
                    <span>🏠</span>
                    <span>Permanent Address</span>
                  </div>
                  <div className={styles.addressFields}>
                    <div className={styles.inputGroup}>
                      <label className={styles.labelSmall}>Street Address</label>
                      <input
                        type="text"
                        className={styles.textInputSm}
                        placeholder="Street Address"
                        value={formData.permanentAddress.street}
                        onChange={(e) => handleNestedChange('permanentAddress', 'street', e.target.value)}
                      />
                    </div>
                    <div className={styles.gridTwoColSmall}>
                      <div className={styles.inputGroup}>
                        <label className={styles.labelSmall}>City</label>
                        <input
                          type="text"
                          className={styles.textInputSm}
                          placeholder="City"
                          value={formData.permanentAddress.city}
                          onChange={(e) => handleNestedChange('permanentAddress', 'city', e.target.value)}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.labelSmall}>PIN Code</label>
                        <input
                          type="text"
                          className={styles.textInputSm}
                          placeholder="PIN Code"
                          value={formData.permanentAddress.pinCode}
                          onChange={(e) => handleNestedChange('permanentAddress', 'pinCode', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.labelSmall}>Mobile Number</label>
                      <input
                        type="tel"
                        className={styles.textInputSm}
                        placeholder="Mobile Number"
                        value={formData.permanentAddress.mobile}
                        onChange={(e) => handleNestedChange('permanentAddress', 'mobile', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: College Qualifications */}
          <section className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Section 3: College Qualifications</h2>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Institution</th>
                    <th>Year of Passing</th>
                    <th>Percentage</th>
                    <th>Board/University</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {qualRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input
                          type="text"
                          className={styles.tableInput}
                          value={row.course}
                          onChange={(e) => handleQualRowChange(row.id, 'course', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.tableInput}
                          value={row.institution}
                          onChange={(e) => handleQualRowChange(row.id, 'institution', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.tableInput}
                          value={row.yearOfPassing}
                          onChange={(e) => handleQualRowChange(row.id, 'yearOfPassing', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.tableInput}
                          value={row.percentage}
                          onChange={(e) => handleQualRowChange(row.id, 'percentage', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.tableInput}
                          value={row.boardUniversity}
                          onChange={(e) => handleQualRowChange(row.id, 'boardUniversity', e.target.value)}
                        />
                      </td>
                      <td>
                        {qualRows.length > 1 && (
                          <button className={styles.deleteBtn} onClick={() => deleteQualRow(row.id)}>×</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className={styles.addRowBtn} onClick={addQualRow}>+ Add Row</button>
          </section>

          {/* Section 4: Competitive Exams */}
          <section className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Section 4: Competitive Exams</h2>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  className={styles.radioInput}
                  name="hasCompetitiveExams"
                  checked={formData.hasCompetitiveExams === true}
                  onChange={() => handleInputChange('hasCompetitiveExams', true)}
                />
                <span>Yes</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  className={styles.radioInput}
                  name="hasCompetitiveExams"
                  checked={formData.hasCompetitiveExams === false}
                  onChange={() => handleInputChange('hasCompetitiveExams', false)}
                />
                <span>No</span>
              </label>
            </div>

            {formData.hasCompetitiveExams && (
              <div className={styles.examsBox}>
                <p className={styles.examsBoxTitle}>Enter Marks</p>
                <div className={styles.examsContainer}>
                  {['GRE', 'TOEFL', 'UPSC', 'GATE', 'IAS'].map((exam) => (
                    <div className={styles.examRow} key={exam}>
                      <span className={styles.examLabel}>{exam}</span>
                      <input
                        type="number"
                        className={styles.examMarksInput}
                        placeholder="Marks"
                        value={formData.exams[exam]}
                        onChange={(e) => handleExamChange(exam, e.target.value)}
                      />
                    </div>
                  ))}
                  <div className={styles.examRow}>
                    <input
                      type="text"
                      className={styles.examMarksInput}
                      placeholder="Other Exam"
                      value={formData.othersExam.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, othersExam: { ...prev.othersExam, name: e.target.value } }))}
                    />
                    <input
                      type="number"
                      className={styles.examMarksInput}
                      placeholder="Marks"
                      value={formData.othersExam.marks}
                      onChange={(e) => setFormData(prev => ({ ...prev, othersExam: { ...prev.othersExam, marks: e.target.value } }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Section 5: Employment Details */}
          <section className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Section 5: Employment Details</h2>
            <div className={styles.formStack}>
              <div className={styles.gridTwoCol}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Placement Type</label>
                  <select
                    className={styles.selectInput}
                    value={formData.placementType}
                    onChange={(e) => handleInputChange('placementType', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="On-campus">On-campus</option>
                    <option value="Off-campus">Off-campus</option>
                    <option value="Others">Others</option>
                    <option value="To be employed">To be employed</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Designation</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    placeholder="Current Designation"
                    value={formData.designation}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Company Address</label>
                <textarea
                  className={styles.textareaInput}
                  placeholder="Company Address"
                  value={formData.companyAddress}
                  onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Employment Remarks</label>
                <textarea
                  className={styles.textareaInput}
                  placeholder="Employment Remarks"
                  value={formData.employmentRemarks}
                  onChange={(e) => handleInputChange('employmentRemarks', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section 6: Entrepreneur Details */}
          <section className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Section 6: Entrepreneur Details</h2>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  className={styles.radioInput}
                  name="isEntrepreneur"
                  checked={formData.isEntrepreneur === true}
                  onChange={() => handleInputChange('isEntrepreneur', true)}
                />
                <span>Yes</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  className={styles.radioInput}
                  name="isEntrepreneur"
                  checked={formData.isEntrepreneur === false}
                  onChange={() => handleInputChange('isEntrepreneur', false)}
                />
                <span>No</span>
              </label>
            </div>

            {formData.isEntrepreneur && (
              <div className={styles.formStack} style={{ marginTop: '1.5rem' }}>
                <div className={styles.gridTwoCol}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Organization Name</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Organization Name"
                      value={formData.entrepreneurDetails.organizationName}
                      onChange={(e) => handleNestedChange('entrepreneurDetails', 'organizationName', e.target.value)}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Nature of Work</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Nature of Work"
                      value={formData.entrepreneurDetails.natureOfWork}
                      onChange={(e) => handleNestedChange('entrepreneurDetails', 'natureOfWork', e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.gridTwoCol}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Annual Turnover</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Annual Turnover"
                      value={formData.entrepreneurDetails.annualTurnover}
                      onChange={(e) => handleNestedChange('entrepreneurDetails', 'annualTurnover', e.target.value)}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Number of Employees</label>
                    <input
                      type="number"
                      className={styles.textInput}
                      placeholder="Number of Employees"
                      value={formData.entrepreneurDetails.numberOfEmployees}
                      onChange={(e) => handleNestedChange('entrepreneurDetails', 'numberOfEmployees', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Section 7: Personal Information */}
          <section className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Section 7: Personal Information</h2>
            <div className={styles.formStack}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Marital Status</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      className={styles.radioInput}
                      name="maritalStatus"
                      value="Single"
                      checked={formData.maritalStatus === 'Single'}
                      onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                    />
                    <span>Single</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      className={styles.radioInput}
                      name="maritalStatus"
                      value="Married"
                      checked={formData.maritalStatus === 'Married'}
                      onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                    />
                    <span>Married</span>
                  </label>
                </div>
              </div>

              {formData.maritalStatus === 'Married' && (
                <div className={styles.gridThreeCol}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Spouse Name</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Spouse Name"
                      value={formData.spouseDetails.name}
                      onChange={(e) => handleNestedChange('spouseDetails', 'name', e.target.value)}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Spouse Qualification</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Qualification"
                      value={formData.spouseDetails.qualification}
                      onChange={(e) => handleNestedChange('spouseDetails', 'qualification', e.target.value)}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Number of Children</label>
                    <input
                      type="number"
                      className={styles.textInput}
                      placeholder="Children"
                      value={formData.spouseDetails.numberOfChildren}
                      onChange={(e) => handleNestedChange('spouseDetails', 'numberOfChildren', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 8: Additional Information */}
          <section className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Section 8: Additional Information</h2>
            <div className={styles.formStack}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Extra Curricular Activities</label>
                <textarea
                  className={styles.textareaInput}
                  placeholder="List your extra curricular activities"
                  value={formData.extraCurricular}
                  onChange={(e) => handleInputChange('extraCurricular', e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Other Information</label>
                <textarea
                  className={styles.textareaInput}
                  placeholder="Any other information you would like to share"
                  value={formData.otherInfo}
                  onChange={(e) => handleInputChange('otherInfo', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section 9: Known Alumni */}
          <section className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Section 9: Known Alumni (Optional)</h2>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTableSm}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Degree</th>
                    <th>Batch</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {alumniRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input
                          type="text"
                          className={styles.tableInputSm}
                          value={row.name}
                          onChange={(e) => handleAlumniRowChange(row.id, 'name', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.tableInputSm}
                          value={row.degree}
                          onChange={(e) => handleAlumniRowChange(row.id, 'degree', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.tableInputSm}
                          value={row.batch}
                          onChange={(e) => handleAlumniRowChange(row.id, 'batch', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="email"
                          className={styles.tableInputSm}
                          value={row.email}
                          onChange={(e) => handleAlumniRowChange(row.id, 'email', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="tel"
                          className={styles.tableInputSm}
                          value={row.phone}
                          onChange={(e) => handleAlumniRowChange(row.id, 'phone', e.target.value)}
                        />
                      </td>
                      <td>
                        {alumniRows.length > 1 && (
                          <button className={styles.deleteBtn} onClick={() => deleteAlumniRow(row.id)}>×</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className={styles.addRowBtn} onClick={addAlumniRow}>+ Add Row</button>
          </section>

          {/* Submit Button */}
          <div className={styles.submitSection}>
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Complete Registration'}
              <span>→</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin_Alumni_Registration;
