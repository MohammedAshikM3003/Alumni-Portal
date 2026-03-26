import React, { useState, useRef, useEffect } from 'react';
import styles from './AD_Alumini_form.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { DateInput } from '../../components/Calendar';
import { useAuth } from '../../context/authContext/authContext';
import Cropper from 'react-easy-crop';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper to convert base64 to Blob for upload
const base64ToBlob = (base64) => {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
};

const Admin_Alumini_Form = ({ onLogout }) => {
  const { user } = useAuth();
  const signatureInputRef = useRef(null);

  // Signature states
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [tempSignatureUrl, setTempSignatureUrl] = useState(null);
  const [signatureCrop, setSignatureCrop] = useState({ x: 0, y: 0 });
  const [signatureZoom, setSignatureZoom] = useState(1);
  const [croppedSignaturePixels, setCroppedSignaturePixels] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    registerNumber: '',
    email: '',
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
    signature: null,
  });

  const [qualRows, setQualRows] = useState([
    { id: 1, course: '', institution: '', yearOfPassing: '', percentage: '', boardUniversity: '' },
  ]);
  const [alumniRows, setAlumniRows] = useState([
    { id: 1, name: '', degree: '', batch: '', email: '', phone: '' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

  // Departments state for dynamic dropdowns
  const [departments, setDepartments] = useState([]);

  // Fetch departments for degree and branch dropdowns
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!user?.token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/departments`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

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

    fetchDepartments();
  }, [user?.token]);

  // Get unique streams (degrees) from departments
  const uniqueStreams = [...new Set(departments.map(dept => dept.stream))];

  const endYear = formData.yearFrom ? parseInt(formData.yearFrom) + 4 : '';

  // Handle form field changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle nested object changes
  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  // Handle exam marks change
  const handleExamChange = (exam, value) => {
    setFormData((prev) => ({
      ...prev,
      exams: {
        ...prev.exams,
        [exam]: value,
      },
    }));
  };

  // Handle others exam change
  const handleOthersExamChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      othersExam: {
        ...prev.othersExam,
        [field]: value,
      },
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

  // Qualification rows handlers
  const addQualRow = () => {
    setQualRows([
      ...qualRows,
      { id: Date.now(), course: '', institution: '', yearOfPassing: '', percentage: '', boardUniversity: '' },
    ]);
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

  // Signature handling functions
  const handleSignatureClick = () => {
    signatureInputRef.current?.click();
  };

  const handleSignatureFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempSignatureUrl(event.target.result);
        setShowSignatureModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetSignature = () => {
    setSignatureCrop({ x: 0, y: 0 });
    setSignatureZoom(1);
  };

  const onSignatureCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedSignaturePixels(croppedAreaPixels);
  };

  const getCroppedImg = (imageSrc, pixelCrop) => {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );
        const base64Image = canvas.toDataURL('image/png');
        resolve(base64Image);
      };
      image.onerror = (error) => reject(error);
    });
  };

  const handleSignatureModalUpload = async () => {
    if (tempSignatureUrl && croppedSignaturePixels) {
      try {
        const croppedImageBase64 = await getCroppedImg(tempSignatureUrl, croppedSignaturePixels);

        // Upload to GridFS
        const blob = base64ToBlob(croppedImageBase64);
        const formDataUpload = new FormData();
        formDataUpload.append('image', blob, 'signature.png');
        formDataUpload.append('type', 'signature');

        const uploadResponse = await fetch(`${API_BASE_URL}/api/images/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          body: formDataUpload,
        });

        const uploadData = await uploadResponse.json();

        if (uploadResponse.ok && uploadData.success) {
          // Show image URL for preview, store GridFS ID in form data
          setSignaturePreviewUrl(`${API_BASE_URL}/api/images/${uploadData.imageId}`);
          setFormData(prev => ({ ...prev, signature: uploadData.imageId }));
        } else {
          console.error('Error uploading signature:', uploadData.message);
          alert('Failed to upload signature. Please try again.');
        }
        setShowSignatureModal(false);
      } catch (e) {
        console.error('Error cropping/uploading image:', e);
        alert('Error processing image. Please try again.');
      }
    }
  };

  const handleCloseSignatureModal = () => {
    setShowSignatureModal(false);
    setTempSignatureUrl(null);
    setSignatureCrop({ x: 0, y: 0 });
    setSignatureZoom(1);
  };

  const handleClearSignature = () => {
    setSignaturePreviewUrl(null);
    setFormData(prev => ({ ...prev, signature: null }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitMessage({ type: '', text: '' });

    // Validate required fields
    if (
      !formData.registerNumber ||
      !formData.name ||
      !formData.email ||
      !formData.dob ||
      !formData.yearFrom ||
      !formData.degree ||
      !formData.branch
    ) {
      setSubmitMessage({
        type: 'error',
        text: 'Please fill all required fields (Name, Register Number, Email, DOB, Year, Degree, Branch)',
      });
      setIsSubmitting(false);
      return;
    }

    // Build competitive exams array
    const competitiveExams = [];
    if (formData.hasCompetitiveExams) {
      Object.entries(formData.exams).forEach(([examName, marks]) => {
        if (marks) {
          competitiveExams.push({ examName, marks });
        }
      });
      if (formData.othersExam.name && formData.othersExam.marks) {
        competitiveExams.push({
          examName: formData.othersExam.name,
          marks: formData.othersExam.marks,
        });
      }
    }

    // Build college qualifications array
    const collegeQualifications = qualRows
      .filter((row) => row.course || row.institution)
      .map(({ course, institution, yearOfPassing, percentage, boardUniversity }) => ({
        course,
        institution,
        yearOfPassing,
        percentage,
        boardUniversity,
      }));

    // Build known alumni array
    const knownAlumni = alumniRows
      .filter((row) => row.name || row.email)
      .map(({ name, degree, batch, email, phone }) => ({
        name,
        degree,
        batch,
        email,
        phone,
      }));

    // Build request payload
    const payload = {
      registerNumber: formData.registerNumber,
      name: formData.name,
      fatherName: formData.fatherName,
      email: formData.email,
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
      signature: formData.signature,
    };

    try {
      const token = user?.token;

      // Check if token exists
      if (!token) {
        setSubmitMessage({
          type: 'error',
          text: 'You are not logged in. Please login as admin first.',
        });
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/registration/send-prefilled-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          prefilledData: payload
        }),
      });

      const data = await response.json();

      // Handle authentication errors
      if (response.status === 401) {
        setSubmitMessage({
          type: 'error',
          text: 'Session expired. Please login again.',
        });
        setIsSubmitting(false);
        return;
      }

      if (response.ok && data.success) {
        setSubmitMessage({
          type: 'success',
          text: `Registration link with pre-filled data sent successfully to ${formData.email}!`,
        });
        // Reset form
        setFormData({
          name: '',
          fatherName: '',
          registerNumber: '',
          email: '',
          dob: '',
          yearFrom: '',
          degree: '',
          branch: '',
          presentAddress: { street: '', city: '', pinCode: '', mobile: '' },
          permanentAddress: { street: '', city: '', pinCode: '', mobile: '' },
          hasCompetitiveExams: false,
          exams: { GRE: '', TOEFL: '', UPSC: '', GATE: '', IAS: '' },
          othersExam: { name: '', marks: '' },
          placementType: '',
          designation: '',
          companyAddress: '',
          employmentRemarks: '',
          isEntrepreneur: false,
          entrepreneurDetails: { organizationName: '', natureOfWork: '', annualTurnover: '', numberOfEmployees: '' },
          maritalStatus: '',
          spouseDetails: { name: '', qualification: '', numberOfChildren: '' },
          extraCurricular: '',
          otherInfo: '',
          signature: null,
        });
        setSignaturePreviewUrl(null);
        setQualRows([{ id: 1, course: '', institution: '', yearOfPassing: '', percentage: '', boardUniversity: '' }]);
        setAlumniRows([{ id: 1, name: '', degree: '', batch: '', email: '', phone: '' }]);
      } else {
        setSubmitMessage({
          type: 'error',
          text: data.message || 'Failed to create alumni. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitMessage({
        type: 'error',
        text: 'Network error. Please check your connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageLayout}>
      {/* Sidebar */}
      <Sidebar onLogout={onLogout} currentView={'alumini'} />

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Back Button */}
        <div className={styles.backButton} onClick={() => window.history.back()}>
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back</span>
        </div>

        <div className={styles.formContainer}>
          {/* Submit Message */}
          {submitMessage.text && (
            <div
              className={`${styles.submitMessage} ${submitMessage.type === 'success' ? styles.successMessage : styles.errorMessage}`}
            >
              {submitMessage.text}
            </div>
          )}

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
                <div>
                  <label htmlFor="reg" className={styles.inputLabel}>
                    Register Number *
                  </label>
                  <input
                    type="text"
                    id="reg"
                    className={styles.textInput}
                    placeholder="11-digit Register Number"
                    value={formData.registerNumber}
                    onChange={(e) => handleInputChange('registerNumber', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="email" className={styles.inputLabel}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    className={styles.textInput}
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.gridThreeCol}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Date of Birth *</label>
                  <DateInput
                    theme="admin"
                    className={styles.textInput}
                    value={formData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    yearRange="dob"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Years of Study (From) *</label>
                  <select
                    className={styles.selectInput}
                    value={formData.yearFrom}
                    onChange={(e) => handleInputChange('yearFrom', e.target.value)}
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: 50 }, (_, i) => 2001 + i).map((year) => (
                      <option className={styles.dd} key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>(To)</label>
                  <input
                    type="text"
                    className={styles.selectInput}
                    value={endYear}
                    disabled
                    placeholder="Auto-filled"
                    style={{ cursor: 'not-allowed', backgroundColor: '#f5f5f5' }}
                  />
                </div>
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
                        <option key={dept._id} value={dept.branch}>
                          {dept.branch} ({dept.deptCode})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className={`${styles.gridTwoCol} ${styles.addressSection}`}>
                {/* Permanent Address */}
                <div className={styles.addressBox}>
                  <div className={styles.addressHeader}>
                    <span className="material-symbols-outlined">home</span>
                    <span>Permanent Address</span>
                  </div>
                  <div className={styles.addressFields}>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Street Address"
                      value={formData.permanentAddress.street}
                      onChange={(e) => handleNestedChange('permanentAddress', 'street', e.target.value)}
                    />
                    <div className={styles.gridTwoColSmall}>
                      <input
                        type="text"
                        className={styles.textInput}
                        placeholder="City"
                        value={formData.permanentAddress.city}
                        onChange={(e) => handleNestedChange('permanentAddress', 'city', e.target.value)}
                      />
                      <input
                        type="text"
                        className={styles.textInput}
                        placeholder="PIN Code"
                        value={formData.permanentAddress.pinCode}
                        onChange={(e) => handleNestedChange('permanentAddress', 'pinCode', e.target.value)}
                      />
                    </div>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Mobile Number"
                      value={formData.permanentAddress.mobile}
                      onChange={(e) => handleNestedChange('permanentAddress', 'mobile', e.target.value)}
                    />
                  </div>
                  {/* Copy Address Checkbox */}
                  <div className={styles.copyAddressWrapper}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.sameAsPermanent}
                        onChange={(e) => handleCopyAddress(e.target.checked)}
                      />
                      <span>Copy permanent address to present address</span>
                    </label>
                  </div>
                </div>

                {/* Present Address */}
                <div className={styles.addressBox}>
                  <div className={styles.addressHeader}>
                    <span className="material-symbols-outlined">location_on</span>
                    <span>Present Address</span>
                  </div>
                  <div className={styles.addressFields}>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Street Address"
                      value={formData.presentAddress.street}
                      onChange={(e) => handleNestedChange('presentAddress', 'street', e.target.value)}
                      disabled={formData.sameAsPermanent}
                    />
                    <div className={styles.gridTwoColSmall}>
                      <input
                        type="text"
                        className={styles.textInput}
                        placeholder="City"
                        value={formData.presentAddress.city}
                        onChange={(e) => handleNestedChange('presentAddress', 'city', e.target.value)}
                        disabled={formData.sameAsPermanent}
                      />
                      <input
                        type="text"
                        className={styles.textInput}
                        placeholder="PIN Code"
                        value={formData.presentAddress.pinCode}
                        onChange={(e) => handleNestedChange('presentAddress', 'pinCode', e.target.value)}
                        disabled={formData.sameAsPermanent}
                      />
                    </div>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Mobile Number"
                      value={formData.presentAddress.mobile}
                      onChange={(e) => handleNestedChange('presentAddress', 'mobile', e.target.value)}
                      disabled={formData.sameAsPermanent}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Qualifications & Employment */}
          <section className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Section 2: Qualifications & Employment</h2>
            <div className={styles.formStackLarge}>
              {/* Exams */}
              <div>
                <label className={styles.inputLabel}>Competitive Exams Cleared</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="exam_cleared"
                      className={styles.radioInput}
                      checked={formData.hasCompetitiveExams === true}
                      onChange={() => handleInputChange('hasCompetitiveExams', true)}
                    />
                    <span>Yes</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="exam_cleared"
                      className={styles.radioInput}
                      checked={formData.hasCompetitiveExams === false}
                      onChange={() => handleInputChange('hasCompetitiveExams', false)}
                    />
                    <span>No</span>
                  </label>
                </div>

                {formData.hasCompetitiveExams && (
                  <div className={styles.examsBox}>
                    <p className={styles.examsBoxTitle}>Exams and Marks/Score</p>
                    <div className={styles.examsContainer}>
                      {['GRE', 'TOEFL', 'UPSC', 'GATE', 'IAS'].map((exam) => (
                        <div key={exam} className={styles.examRow}>
                          <label className={styles.examLabel}>{exam}</label>
                          <input
                            type="text"
                            className={styles.examMarksInput}
                            placeholder="Enter mark"
                            value={formData.exams[exam]}
                            onChange={(e) => handleExamChange(exam, e.target.value)}
                          />
                        </div>
                      ))}

                      {/* Others Exam Section */}
                      <div className={styles.examDivider}></div>
                      <div className={styles.examRow}>
                        <label className={styles.examLabel}>Other Exam</label>
                        <div className={styles.othersInputGroup}>
                          <input
                            type="text"
                            className={styles.examMarksInput}
                            placeholder="Exam name"
                            value={formData.othersExam.name}
                            onChange={(e) => handleOthersExamChange('name', e.target.value)}
                          />
                          <input
                            type="text"
                            className={styles.examMarksInput}
                            placeholder="Mark"
                            value={formData.othersExam.marks}
                            onChange={(e) => handleOthersExamChange('marks', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* College Qualifications Table */}
              <div>
                <label className={styles.inputLabel}>College Qualifications</label>
                <div className={styles.tableWrapper}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Institution</th>
                        <th>Year of Passing</th>
                        <th>% of Marks</th>
                        <th>Board / University</th>
                        <th style={{ width: '50px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qualRows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <input
                              type="text"
                              className={styles.tableInput}
                              placeholder="e.g. B.E"
                              value={row.course}
                              onChange={(e) => handleQualRowChange(row.id, 'course', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className={styles.tableInput}
                              placeholder="KSRCE"
                              value={row.institution}
                              onChange={(e) => handleQualRowChange(row.id, 'institution', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className={styles.tableInput}
                              placeholder="2018"
                              value={row.yearOfPassing}
                              onChange={(e) => handleQualRowChange(row.id, 'yearOfPassing', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className={styles.tableInput}
                              placeholder="85%"
                              value={row.percentage}
                              onChange={(e) => handleQualRowChange(row.id, 'percentage', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className={styles.tableInput}
                              placeholder="Anna University"
                              value={row.boardUniversity}
                              onChange={(e) => handleQualRowChange(row.id, 'boardUniversity', e.target.value)}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className={styles.deleteBtn}
                              onClick={() => deleteQualRow(row.id)}
                              title="Delete row"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button type="button" className={styles.addRowBtn} onClick={addQualRow}>
                    + Add Row
                  </button>
                </div>
                <br />
                {/* Employment Details */}
                <div>
                  <p className={styles.subSectionTitle}>Employment Details</p>
                  <div className={styles.gridTwoCol}>
                    <div className={styles.inputGroup}>
                      <label className={styles.labelSmall}>Placement Type</label>
                      <div className={styles.radioGroupWrap}>
                        {['On-campus', 'Off-campus', 'Others', 'To be employed'].map((type) => (
                          <label key={type} className={styles.radioLabel}>
                            <input
                              type="radio"
                              name="placement"
                              className={styles.radioInput}
                              checked={formData.placementType === type}
                              onChange={() => handleInputChange('placementType', type)}
                            />
                            <span>{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.labelSmall}>Designation</label>
                      <input
                        type="text"
                        className={styles.textInput}
                        placeholder="e.g. Software Engineer"
                        value={formData.designation}
                        onChange={(e) => handleInputChange('designation', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.gridTwoColLargeGap}>
                    <div className={styles.inputGroup}>
                      <label className={styles.labelSmall}>Company Address</label>
                      <textarea
                        className={styles.textareaInput}
                        placeholder="Organization name and full address..."
                        rows="3"
                        value={formData.companyAddress}
                        onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                      ></textarea>
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.labelSmall}>Remarks</label>
                      <textarea
                        className={styles.textareaInput}
                        placeholder="Any specific remarks about employment..."
                        rows="3"
                        value={formData.employmentRemarks}
                        onChange={(e) => handleInputChange('employmentRemarks', e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Additional Info */}
          <section className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Section 3: Additional Info</h2>

            <div className={styles.gridTwoCol}>
              {/* Entrepreneur */}
              <div className={styles.formStack}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Have you become an entrepreneur?</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="entrepreneur"
                        className={styles.radioInput}
                        checked={formData.isEntrepreneur === true}
                        onChange={() => handleInputChange('isEntrepreneur', true)}
                      />
                      <span>Yes</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="entrepreneur"
                        className={styles.radioInput}
                        checked={formData.isEntrepreneur === false}
                        onChange={() => handleInputChange('isEntrepreneur', false)}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
                <input
                  type="text"
                  className={styles.textInputSm}
                  placeholder="Name and Address of Organization"
                  value={formData.entrepreneurDetails.organizationName}
                  onChange={(e) => handleNestedChange('entrepreneurDetails', 'organizationName', e.target.value)}
                  disabled={!formData.isEntrepreneur}
                />
                <input
                  type="text"
                  className={styles.textInputSm}
                  placeholder="Nature of work / Product"
                  value={formData.entrepreneurDetails.natureOfWork}
                  onChange={(e) => handleNestedChange('entrepreneurDetails', 'natureOfWork', e.target.value)}
                  disabled={!formData.isEntrepreneur}
                />
                <div className={styles.gridTwoColSmall}>
                  <input
                    type="text"
                    className={styles.textInputSm}
                    placeholder="Annual Turnover"
                    value={formData.entrepreneurDetails.annualTurnover}
                    onChange={(e) => handleNestedChange('entrepreneurDetails', 'annualTurnover', e.target.value)}
                    disabled={!formData.isEntrepreneur}
                  />
                  <input
                    type="text"
                    className={styles.textInputSm}
                    placeholder="No. of Employees"
                    value={formData.entrepreneurDetails.numberOfEmployees}
                    onChange={(e) => handleNestedChange('entrepreneurDetails', 'numberOfEmployees', e.target.value)}
                    disabled={!formData.isEntrepreneur}
                  />
                </div>
              </div>

              {/* Marital Status */}
              <div className={styles.formStack}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Marital Status</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="marital"
                        className={styles.radioInput}
                        checked={formData.maritalStatus === 'Single'}
                        onChange={() => handleInputChange('maritalStatus', 'Single')}
                      />
                      <span>Single</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="marital"
                        className={styles.radioInput}
                        checked={formData.maritalStatus === 'Married'}
                        onChange={() => handleInputChange('maritalStatus', 'Married')}
                      />
                      <span>Married</span>
                    </label>
                  </div>
                </div>
                <input
                  type="text"
                  className={styles.textInputSm}
                  placeholder="Spouse Name"
                  value={formData.spouseDetails.name}
                  onChange={(e) => handleNestedChange('spouseDetails', 'name', e.target.value)}
                  disabled={formData.maritalStatus !== 'Married'}
                />
                <input
                  type="text"
                  className={styles.textInputSm}
                  placeholder="Spouse Qualification"
                  value={formData.spouseDetails.qualification}
                  onChange={(e) => handleNestedChange('spouseDetails', 'qualification', e.target.value)}
                  disabled={formData.maritalStatus !== 'Married'}
                />
                <input
                  type="text"
                  className={styles.textInputSm}
                  placeholder="No. of Children"
                  value={formData.spouseDetails.numberOfChildren}
                  onChange={(e) => handleNestedChange('spouseDetails', 'numberOfChildren', e.target.value)}
                  disabled={formData.maritalStatus !== 'Married'}
                />
              </div>
            </div>

            <div className={styles.textAreaGroup}>
              <label className={styles.inputLabel}>Extra-Curricular Activities</label>
              <textarea
                className={styles.textareaInput}
                placeholder="List your activities and achievements during or after college..."
                rows="4"
                value={formData.extraCurricular}
                onChange={(e) => handleInputChange('extraCurricular', e.target.value)}
              ></textarea>
            </div>

            <div className={styles.textAreaGroup}>
              <label className={styles.inputLabel}>Any Other Relevant Information</label>
              <textarea
                className={styles.textareaInput}
                placeholder="Provide any additional details you would like to share..."
                rows="4"
                value={formData.otherInfo}
                onChange={(e) => handleInputChange('otherInfo', e.target.value)}
              ></textarea>
            </div>

            {/* Signature Upload */}
            <div className={styles.textAreaGroup}>
              <label className={styles.inputLabel}>Upload Signature</label>
              <div className={styles.signatureUploadBox} onClick={handleSignatureClick}>
                {!signaturePreviewUrl ? (
                  <>
                    <span className="material-symbols-outlined" style={{fontSize: '48px', color: '#9CA3AF', marginBottom: 8}}>cloud_upload</span>
                    <p className={styles.uploadText}>Click to upload signature</p>
                    <p className={styles.uploadSubtext}>PNG, JPG up to 2MB</p>
                  </>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}} onClick={e => e.stopPropagation()}>
                    <img src={signaturePreviewUrl} alt="Signature Preview" className={styles.signaturePreview} />
                    <button
                      type="button"
                      className={styles.clearSignatureBtn}
                      onClick={handleClearSignature}
                    >
                      Clear
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={signatureInputRef}
                  style={{ display: 'none' }}
                  onChange={handleSignatureFileChange}
                />
              </div>
            </div>

            {/* Signature Cropper Modal */}
            {showSignatureModal && (
              <div className={styles.modalContainer}>
                <div className={styles.modalCard}>
                  <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Adjust Signature</h2>
                    <button type="button" className={styles.resetBtn} aria-label="Reset Image" onClick={handleResetSignature}>
                      <span className="material-symbols-outlined">refresh</span>
                    </button>
                  </div>
                  <div className={styles.cropperArea}>
                    {tempSignatureUrl && (
                      <Cropper
                        image={tempSignatureUrl}
                        crop={signatureCrop}
                        zoom={signatureZoom}
                        aspect={2 / 1}
                        onCropChange={setSignatureCrop}
                        onCropComplete={onSignatureCropComplete}
                        onZoomChange={setSignatureZoom}
                      />
                    )}
                  </div>
                  <div className={styles.modalFooter}>
                    <button type="button" className={styles.cancelBtn} onClick={handleCloseSignatureModal}>Cancel</button>
                    <button type="button" className={styles.uploadBtn} onClick={handleSignatureModalUpload}>
                      <span className="material-symbols-outlined">send</span>
                      Upload Signature
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Alumni Known Table */}
            <div className={styles.textAreaGroup}>
              <label className={styles.inputLabel}>Alumni Details You Know (Optional)</label>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTableSm}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Degree</th>
                      <th>Batch</th>
                      <th>E-Mail</th>
                      <th>Phone/Mobile No.</th>
                      <th style={{ width: '50px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumniRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="text"
                            className={styles.tableInputSm}
                            placeholder="John Doe"
                            value={row.name}
                            onChange={(e) => handleAlumniRowChange(row.id, 'name', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className={styles.tableInputSm}
                            placeholder="B.E / B.Tech"
                            value={row.degree}
                            onChange={(e) => handleAlumniRowChange(row.id, 'degree', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className={styles.tableInputSm}
                            placeholder="2020"
                            value={row.batch}
                            onChange={(e) => handleAlumniRowChange(row.id, 'batch', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className={styles.tableInputSm}
                            placeholder="john@email.com"
                            value={row.email}
                            onChange={(e) => handleAlumniRowChange(row.id, 'email', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className={styles.tableInputSm}
                            placeholder="9876543210"
                            value={row.phone}
                            onChange={(e) => handleAlumniRowChange(row.id, 'phone', e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => deleteAlumniRow(row.id)}
                            title="Delete row"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" className={styles.addRowBtn} onClick={addAlumniRow}>
                  + Add Row
                </button>
              </div>
            </div>
          </section>

          {/* Submit Action */}
          <div className={styles.submitSection}>
            <button
              className={styles.submitBtn}
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Registration Link'}
              <span className="material-symbols-outlined">{isSubmitting ? 'hourglass_empty' : 'send'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin_Alumini_Form;
