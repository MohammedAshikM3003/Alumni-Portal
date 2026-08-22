import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Lock, Plus, Trash2, Upload, AlertCircle } from 'lucide-react';
import styles from './Co_Alumini_Form.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { DateInput } from '../../components/Calendar';
import { useAuth } from '../../context/authContext/authContext';
import Cropper from 'react-easy-crop';
import { formatBranchName } from '../../utils/formatters';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const base64ToBlob = (base64: string) => {
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

interface CoordinatorAluminiFormProps {
  onLogout?: () => void;
}

const Coordinator_Alumini_Form = ({ onLogout }: CoordinatorAluminiFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Coordinator profile & department
  const [coordinatorDept, setCoordinatorDept] = useState<string>('');
  const [coordinatorData, setCoordinatorData] = useState<any>(null);

  // Signature states
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [tempSignatureUrl, setTempSignatureUrl] = useState<string | null>(null);
  const [signatureCrop, setSignatureCrop] = useState({ x: 0, y: 0 });
  const [signatureZoom, setSignatureZoom] = useState(1);
  const [croppedSignaturePixels, setCroppedSignaturePixels] = useState<any>(null);

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
    } as Record<string, string>,
    othersExam: { name: '', marks: '' },
    placementType: '',
    companyName: '',
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
    signature: null as string | null,
  });

  const [qualRows, setQualRows] = useState([
    { id: 1, course: '', institution: '', yearOfPassing: '', percentage: '', boardUniversity: '' },
  ]);
  const [alumniRows, setAlumniRows] = useState([
    { id: 1, name: '', degree: '', batch: '', email: '', phone: '' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ message: string; fieldId: string }[]>([]);
  const [blinkingField, setBlinkingField] = useState<string | null>(null);

  // Departments state for degree dropdowns
  const [departments, setDepartments] = useState<any[]>([]);

  // Fetch coordinator profile and mapped department
  useEffect(() => {
    const controller = new AbortController();
    const fetchCoordinator = async () => {
      if (!user?.token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/coordinators/profile/me`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const data = await res.json();
        if (data.success && data.data) {
          setCoordinatorData(data.data);
          const dept = data.data.department || '';
          setCoordinatorDept(dept);
          setFormData((prev) => ({ ...prev, branch: dept }));
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching coordinator:', err);
      }
    };

    fetchCoordinator();
    return () => controller.abort();
  }, [user?.token]);

  // Fetch departments for degree dropdown
  useEffect(() => {
    const controller = new AbortController();
    const fetchDepartments = async () => {
      if (!user?.token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/departments`, {
          signal: controller.signal,
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
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error('Error fetching departments:', error);
      }
    };

    fetchDepartments();
    return () => controller.abort();
  }, [user?.token]);

  // Unique degrees/streams for coordinator's department or all streams
  const deptDegrees = departments
    .filter((d: any) => !coordinatorDept || formatBranchName(d.branch).toLowerCase() === formatBranchName(coordinatorDept).toLowerCase())
    .map((d: any) => d.stream);

  const availableStreams = deptDegrees.length > 0 ? [...new Set(deptDegrees)] : [...new Set(departments.map((d: any) => d.stream))];

  // Auto-set degree if only one exists for this department
  useEffect(() => {
    if (availableStreams.length === 1 && !formData.degree) {
      setFormData((prev) => ({ ...prev, degree: availableStreams[0] }));
    }
  }, [availableStreams, formData.degree]);

  const endYear = formData.yearFrom ? parseInt(formData.yearFrom, 10) + 4 : '';

  // Auto-clear specific field error when user types
  useEffect(() => {
    if (errors.length === 0) return;
    const fixedFieldIds = new Set<string>();
    if (formData.name.trim()) fixedFieldIds.add('name');
    if (formData.registerNumber.trim()) fixedFieldIds.add('registerNumber');
    if (formData.email.trim()) fixedFieldIds.add('email');
    if (formData.dob.trim()) fixedFieldIds.add('dob');
    if (formData.yearFrom.trim()) fixedFieldIds.add('yearFrom');
    if (formData.degree.trim()) fixedFieldIds.add('degree');
    if (formData.branch.trim()) fixedFieldIds.add('branch');
    setErrors((prev) => prev.filter((err) => !fixedFieldIds.has(err.fieldId)));
  }, [formData]);

  const getFieldError = (fieldId: string) => {
    return errors.find((err) => err.fieldId === fieldId)?.message;
  };

  const scrollToFieldAndBlink = (fieldId: string) => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        field.focus();
      }, 300);
      setBlinkingField(fieldId);
      setTimeout(() => {
        setBlinkingField(null);
      }, 3000);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const handleExamChange = (exam: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      exams: {
        ...prev.exams,
        [exam]: value,
      },
    }));
  };

  const handleOthersExamChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      othersExam: {
        ...prev.othersExam,
        [field]: value,
      },
    }));
  };

  const handleCopyAddress = (checked: boolean) => {
    setFormData((prev: any) => ({
      ...prev,
      sameAsPermanent: checked,
      presentAddress: checked ? { ...prev.permanentAddress } : prev.presentAddress,
    }));
  };

  // Qualification rows
  const addQualRow = () => {
    setQualRows([
      ...qualRows,
      { id: Date.now(), course: '', institution: '', yearOfPassing: '', percentage: '', boardUniversity: '' },
    ]);
  };

  const deleteQualRow = (id: number) => {
    if (qualRows.length > 1) {
      setQualRows(qualRows.filter((row) => row.id !== id));
    }
  };

  const handleQualRowChange = (id: number, field: string, value: any) => {
    setQualRows(qualRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  // Alumni rows
  const addAlumniRow = () => {
    setAlumniRows([...alumniRows, { id: Date.now(), name: '', degree: '', batch: '', email: '', phone: '' }]);
  };

  const deleteAlumniRow = (id: number) => {
    if (alumniRows.length > 1) {
      setAlumniRows(alumniRows.filter((row) => row.id !== id));
    }
  };

  const handleAlumniRowChange = (id: number, field: string, value: any) => {
    setAlumniRows(alumniRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  // Signature Handling
  const handleSignatureClick = () => {
    signatureInputRef.current?.click();
  };

  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setTempSignatureUrl(reader.result as string);
        setShowSignatureModal(true);
      };
      reader.readAsDataURL(file);
    }
    if (signatureInputRef.current) {
      signatureInputRef.current.value = '';
    }
  };

  const onSignatureCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedSignaturePixels(croppedAreaPixels);
  };

  const createCroppedImage = async (imageSrc: string, crop: any): Promise<string> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    );

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleSaveCroppedSignature = async () => {
    if (tempSignatureUrl && croppedSignaturePixels) {
      try {
        const croppedBase64 = await createCroppedImage(tempSignatureUrl, croppedSignaturePixels);
        const imageBlob = base64ToBlob(croppedBase64);
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageBlob, 'signature.jpg');

        const uploadRes = await fetch(`${API_BASE_URL}/api/images/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
          body: uploadFormData,
        });

        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.imageId) {
          setSignaturePreviewUrl(`${API_BASE_URL}/api/images/${uploadData.imageId}`);
          setFormData((prev) => ({ ...prev, signature: uploadData.imageId }));
        } else {
          alert('Failed to upload signature. Please try again.');
        }
        setShowSignatureModal(false);
      } catch {
        alert('Error processing signature image. Please try again.');
      }
    }
  };

  const handleClearSignature = () => {
    setSignaturePreviewUrl(null);
    setFormData((prev) => ({ ...prev, signature: null }));
  };

  // Form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);

    const validationErrors: { message: string; fieldId: string }[] = [];
    if (!formData.registerNumber.trim()) validationErrors.push({ message: 'Please enter Register Number', fieldId: 'registerNumber' });
    if (!formData.name.trim()) validationErrors.push({ message: 'Please enter Full Name', fieldId: 'name' });
    if (!formData.email.trim()) validationErrors.push({ message: 'Please enter Email Address', fieldId: 'email' });
    if (!formData.dob.trim()) validationErrors.push({ message: 'Please select Date of Birth', fieldId: 'dob' });
    if (!formData.yearFrom.trim()) validationErrors.push({ message: 'Please select Years of Study', fieldId: 'yearFrom' });
    if (!formData.degree.trim()) validationErrors.push({ message: 'Please select Degree', fieldId: 'degree' });

    const effectiveBranch = coordinatorDept || formData.branch;
    if (!effectiveBranch.trim()) validationErrors.push({ message: 'Department / Branch is missing', fieldId: 'branch' });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      const firstError = validationErrors[0].fieldId;
      if (firstError) scrollToFieldAndBlink(firstError);
      return;
    }
    setErrors([]);

    const competitiveExams: Array<{ examName: string; marks: string }> = [];
    if (formData.hasCompetitiveExams) {
      Object.entries(formData.exams).forEach(([examName, marks]) => {
        if (marks) competitiveExams.push({ examName, marks });
      });
      if (formData.othersExam.name && formData.othersExam.marks) {
        competitiveExams.push({
          examName: formData.othersExam.name,
          marks: formData.othersExam.marks,
        });
      }
    }

    const collegeQualifications = qualRows
      .filter((row) => row.course || row.institution)
      .map(({ course, institution, yearOfPassing, percentage, boardUniversity }) => ({
        course,
        institution,
        yearOfPassing,
        percentage,
        boardUniversity,
      }));

    const knownAlumni = alumniRows
      .filter((row) => row.name || row.email)
      .map(({ name, degree, batch, email, phone }) => ({
        name,
        degree,
        batch,
        email,
        phone,
      }));

    const payload = {
      registerNumber: formData.registerNumber,
      name: formData.name,
      fatherName: formData.fatherName,
      email: formData.email,
      dob: formData.dob,
      yearFrom: parseInt(formData.yearFrom, 10),
      yearTo: Number(endYear),
      degree: formData.degree,
      branch: effectiveBranch,
      presentAddress: formData.presentAddress,
      permanentAddress: formData.permanentAddress,
      hasCompetitiveExams: formData.hasCompetitiveExams,
      competitiveExams,
      collegeQualifications,
      placementType: formData.placementType,
      companyName: formData.companyName,
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
      const response = await fetch(`${API_BASE_URL}/api/registration/send-prefilled-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          prefilledData: payload,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Alumni pre-filled registration link sent successfully to ${formData.email} for department ${effectiveBranch}!`);
        navigate('/coordinator/alumni');
      } else {
        alert(data.message || 'Failed to submit alumni registration');
      }
    } catch {
      alert('Network error connecting to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageLayout}>
      <Sidebar onLogout={onLogout} currentView={'alumni'} />

      <main className={styles.mainContent}>
        <div className={styles.backButton} onClick={() => navigate('/coordinator/alumni')}>
          <ArrowLeft size={18} />
          <span>Back to Alumni Directory</span>
        </div>

        <div className={styles.formContainer}>
          {/* Error Summary */}
          {errors.length > 0 && (
            <div className={styles.errorSummaryBox}>
              <h4 className={styles.errorSummaryTitle}>
                <AlertCircle size={18} /> Please correct the following errors before submitting:
              </h4>
              <ul className={styles.errorSummaryList}>
                {errors.map((err, idx) => (
                  <li
                    key={idx}
                    className={styles.errorSummaryItem}
                    onClick={() => scrollToFieldAndBlink(err.fieldId)}
                  >
                    {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 1. PERSONAL DETAILS */}
          <div className={styles.formCard}>
            <h3 className={styles.sectionTitle}>1. Personal Details</h3>

            <div className={styles.gridTwoCol}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Register Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="registerNumber"
                  type="text"
                  className={`${styles.textInput} ${getFieldError('registerNumber') ? styles.inputError : ''} ${blinkingField === 'registerNumber' ? styles.blinkField : ''}`}
                  placeholder="e.g. 731519104001"
                  value={formData.registerNumber}
                  onChange={(e) => handleInputChange('registerNumber', e.target.value)}
                />
                {getFieldError('registerNumber') && <span className={styles.fieldError}>{getFieldError('registerNumber')}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Full Name (Capital letters with initial at the end) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className={`${styles.textInput} ${getFieldError('name') ? styles.inputError : ''} ${blinkingField === 'name' ? styles.blinkField : ''}`}
                  placeholder="e.g. MANOJ KUMAR S"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value.toUpperCase())}
                />
                {getFieldError('name') && <span className={styles.fieldError}>{getFieldError('name')}</span>}
              </div>
            </div>

            <div className={styles.gridTwoCol}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Father's / Guardian's Name</label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g. SENGODAN K"
                  value={formData.fatherName}
                  onChange={(e) => handleInputChange('fatherName', e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className={`${styles.textInput} ${getFieldError('email') ? styles.inputError : ''} ${blinkingField === 'email' ? styles.blinkField : ''}`}
                  placeholder="e.g. alumni@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
                {getFieldError('email') && <span className={styles.fieldError}>{getFieldError('email')}</span>}
              </div>
            </div>

            <div className={styles.gridThreeCol}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Date of Birth <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <DateInput
                  id="dob"
                  value={formData.dob}
                  onChange={(e: any) => handleInputChange('dob', e?.target?.value ?? e)}
                  className={`${styles.textInput} ${getFieldError('dob') ? styles.inputError : ''} ${blinkingField === 'dob' ? styles.blinkField : ''}`}
                  placeholder="Select Date of Birth"
                />
                {getFieldError('dob') && <span className={styles.fieldError}>{getFieldError('dob')}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Years of Study <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    id="yearFrom"
                    className={`${styles.selectInput} ${getFieldError('yearFrom') ? styles.inputError : ''} ${blinkingField === 'yearFrom' ? styles.blinkField : ''}`}
                    value={formData.yearFrom}
                    onChange={(e) => handleInputChange('yearFrom', e.target.value)}
                  >
                    <option value="">Start Year</option>
                    {Array.from({ length: 45 }, (_, i) => 1990 + i).map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontWeight: 700, color: '#64748b' }}>to</span>
                  <input
                    type="text"
                    className={`${styles.textInput} ${styles.lockedInput}`}
                    style={{ width: '90px', textAlign: 'center' }}
                    value={endYear || 'End Year'}
                    readOnly
                  />
                </div>
                {getFieldError('yearFrom') && <span className={styles.fieldError}>{getFieldError('yearFrom')}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Degree <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  id="degree"
                  className={`${styles.selectInput} ${getFieldError('degree') ? styles.inputError : ''} ${blinkingField === 'degree' ? styles.blinkField : ''}`}
                  value={formData.degree}
                  onChange={(e) => handleInputChange('degree', e.target.value)}
                >
                  <option value="">Select Degree</option>
                  {availableStreams.map((stream: string) => (
                    <option key={stream} value={stream}>
                      {stream}
                    </option>
                  ))}
                </select>
                {getFieldError('degree') && <span className={styles.fieldError}>{getFieldError('degree')}</span>}
              </div>
            </div>

            {/* Department Field (Locked to Coordinator Scope) */}
            <div className={styles.gridTwoCol}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Course / Branch</span>
                  <Lock size={13} color="#ff3d00" />
                  <span style={{ color: '#ff3d00', fontSize: '0.7rem' }}>(Locked to Your Department)</span>
                </label>
                <input
                  id="branch"
                  type="text"
                  className={`${styles.textInput} ${styles.lockedInput}`}
                  value={coordinatorDept || formData.branch || 'Loading Department...'}
                  readOnly
                  title="Department is locked to your coordinator role"
                />
              </div>
            </div>
          </div>

          {/* 2. CONTACT & ADDRESS */}
          <div className={styles.formCard}>
            <h3 className={styles.sectionTitle}>2. Address Details</h3>

            <div className={styles.gridTwoColLargeGap}>
              {/* Permanent Address */}
              <div className={styles.formStack}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                  Permanent Address
                </h4>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Street / Door No</label>
                  <textarea
                    className={styles.textareaInput}
                    placeholder="Enter street and door number"
                    value={formData.permanentAddress.street}
                    onChange={(e) => handleNestedChange('permanentAddress', 'street', e.target.value)}
                  />
                </div>

                <div className={styles.gridTwoColSmall}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>City / Town</label>
                    <input
                      type="text"
                      className={styles.textInputSm}
                      placeholder="City"
                      value={formData.permanentAddress.city}
                      onChange={(e) => handleNestedChange('permanentAddress', 'city', e.target.value)}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>PIN Code</label>
                    <input
                      type="text"
                      className={styles.textInputSm}
                      placeholder="6-digit PIN"
                      value={formData.permanentAddress.pinCode}
                      onChange={(e) => handleNestedChange('permanentAddress', 'pinCode', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Mobile Number</label>
                  <input
                    type="text"
                    className={styles.textInputSm}
                    placeholder="10-digit Mobile"
                    value={formData.permanentAddress.mobile}
                    onChange={(e) => handleNestedChange('permanentAddress', 'mobile', e.target.value)}
                  />
                </div>
              </div>

              {/* Present Address */}
              <div className={styles.formStack}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                    Present / Communication Address
                  </h4>
                  <label className={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      className={styles.checkboxInput}
                      checked={formData.sameAsPermanent}
                      onChange={(e) => handleCopyAddress(e.target.checked)}
                    />
                    <span>Same as Permanent</span>
                  </label>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Street / Door No</label>
                  <textarea
                    className={styles.textareaInput}
                    placeholder="Enter present address"
                    disabled={formData.sameAsPermanent}
                    value={formData.presentAddress.street}
                    onChange={(e) => handleNestedChange('presentAddress', 'street', e.target.value)}
                  />
                </div>

                <div className={styles.gridTwoColSmall}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>City / Town</label>
                    <input
                      type="text"
                      className={styles.textInputSm}
                      placeholder="City"
                      disabled={formData.sameAsPermanent}
                      value={formData.presentAddress.city}
                      onChange={(e) => handleNestedChange('presentAddress', 'city', e.target.value)}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>PIN Code</label>
                    <input
                      type="text"
                      className={styles.textInputSm}
                      placeholder="6-digit PIN"
                      disabled={formData.sameAsPermanent}
                      value={formData.presentAddress.pinCode}
                      onChange={(e) => handleNestedChange('presentAddress', 'pinCode', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Mobile Number</label>
                  <input
                    type="text"
                    className={styles.textInputSm}
                    placeholder="10-digit Mobile"
                    disabled={formData.sameAsPermanent}
                    value={formData.presentAddress.mobile}
                    onChange={(e) => handleNestedChange('presentAddress', 'mobile', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. COMPETITIVE EXAMS */}
          <div className={styles.formCard}>
            <h3 className={styles.sectionTitle}>3. Competitive Examinations</h3>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className={styles.inputLabel}>Has the alumnus cleared any competitive examinations?</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="hasCompetitiveExams"
                    className={styles.radioInput}
                    checked={formData.hasCompetitiveExams === true}
                    onChange={() => handleInputChange('hasCompetitiveExams', true)}
                  />
                  <span>Yes</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="hasCompetitiveExams"
                    className={styles.radioInput}
                    checked={formData.hasCompetitiveExams === false}
                    onChange={() => handleInputChange('hasCompetitiveExams', false)}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {formData.hasCompetitiveExams && (
              <div className={styles.examsGrid}>
                {['GATE', 'GRE', 'TOEFL', 'UPSC', 'IAS'].map((exam) => (
                  <div key={exam} className={styles.examField}>
                    <label className={styles.examLabel}>{exam} Score / Year</label>
                    <input
                      type="text"
                      className={styles.textInputSm}
                      placeholder="e.g. 85 percentile / 2021"
                      value={formData.exams[exam] || ''}
                      onChange={(e) => handleExamChange(exam, e.target.value)}
                    />
                  </div>
                ))}
                <div className={styles.examField}>
                  <label className={styles.examLabel}>Other Exam (Name & Score)</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      className={styles.textInputSm}
                      placeholder="Exam Name"
                      value={formData.othersExam.name}
                      onChange={(e) => handleOthersExamChange('name', e.target.value)}
                    />
                    <input
                      type="text"
                      className={styles.textInputSm}
                      placeholder="Score"
                      value={formData.othersExam.marks}
                      onChange={(e) => handleOthersExamChange('marks', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. QUALIFICATIONS */}
          <div className={styles.formCard}>
            <h3 className={styles.sectionTitle}>4. College & Higher Education Qualifications</h3>
            <div className={styles.tableContainer}>
              <table className={styles.dynamicTable}>
                <thead>
                  <tr>
                    <th>Course / Degree</th>
                    <th>Institution / College</th>
                    <th>Year of Passing</th>
                    <th>% / CGPA</th>
                    <th>Board / University</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {qualRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input
                          type="text"
                          className={styles.textInputSm}
                          placeholder="e.g. B.E CSE"
                          value={row.course}
                          onChange={(e) => handleQualRowChange(row.id, 'course', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.textInputSm}
                          placeholder="Institution Name"
                          value={row.institution}
                          onChange={(e) => handleQualRowChange(row.id, 'institution', e.target.value)}
                        />
                      </td>
                      <td style={{ width: '130px' }}>
                        <input
                          type="text"
                          className={styles.textInputSm}
                          placeholder="YYYY"
                          value={row.yearOfPassing}
                          onChange={(e) => handleQualRowChange(row.id, 'yearOfPassing', e.target.value)}
                        />
                      </td>
                      <td style={{ width: '100px' }}>
                        <input
                          type="text"
                          className={styles.textInputSm}
                          placeholder="8.5"
                          value={row.percentage}
                          onChange={(e) => handleQualRowChange(row.id, 'percentage', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.textInputSm}
                          placeholder="Anna University"
                          value={row.boardUniversity}
                          onChange={(e) => handleQualRowChange(row.id, 'boardUniversity', e.target.value)}
                        />
                      </td>
                      <td>
                        {qualRows.length > 1 && (
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => deleteQualRow(row.id)}
                            title="Remove row"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className={styles.addRowBtn} onClick={addQualRow}>
              <Plus size={15} /> Add Qualification Row
            </button>
          </div>

          {/* 5. EMPLOYMENT & CAREER DETAILS */}
          <div className={styles.formCard}>
            <h3 className={styles.sectionTitle}>5. Employment & Career Details</h3>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className={styles.inputLabel}>Placement / Employment Category</label>
              <div className={styles.radioGroupWrap}>
                {['Campus', 'Off-Campus', 'Higher Studies', 'Govt Examinations', 'Entrepreneurship'].map((type) => (
                  <label key={type} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="placementType"
                      className={styles.radioInput}
                      checked={formData.placementType === type}
                      onChange={() => {
                        handleInputChange('placementType', type);
                        handleInputChange('isEntrepreneur', type === 'Entrepreneurship');
                      }}
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.gridTwoCol}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Organization / Company Name</label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g. Zoho Corporation"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Designation / Role</label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g. Senior Software Engineer"
                  value={formData.designation}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
              <label className={styles.inputLabel}>Company / Office Address</label>
              <textarea
                className={styles.textareaInput}
                placeholder="Enter office address"
                value={formData.companyAddress}
                onChange={(e) => handleInputChange('companyAddress', e.target.value)}
              />
            </div>

            {/* Entrepreneur details if checked */}
            {formData.isEntrepreneur && (
              <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>
                  Entrepreneurship Details
                </h4>
                <div className={styles.gridTwoCol}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Organization Name</label>
                    <input
                      type="text"
                      className={styles.textInputSm}
                      placeholder="Organization Name"
                      value={formData.entrepreneurDetails.organizationName}
                      onChange={(e) => handleNestedChange('entrepreneurDetails', 'organizationName', e.target.value)}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Nature of Work</label>
                    <input
                      type="text"
                      className={styles.textInputSm}
                      placeholder="e.g. IT Services / Manufacturing"
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
                      className={styles.textInputSm}
                      placeholder="e.g. 50 Lakhs"
                      value={formData.entrepreneurDetails.annualTurnover}
                      onChange={(e) => handleNestedChange('entrepreneurDetails', 'annualTurnover', e.target.value)}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Number of Employees</label>
                    <input
                      type="text"
                      className={styles.textInputSm}
                      placeholder="e.g. 25"
                      value={formData.entrepreneurDetails.numberOfEmployees}
                      onChange={(e) => handleNestedChange('entrepreneurDetails', 'numberOfEmployees', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. MARITAL & FAMILY STATUS */}
          <div className={styles.formCard}>
            <h3 className={styles.sectionTitle}>6. Marital & Family Details</h3>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className={styles.inputLabel}>Marital Status</label>
              <div className={styles.radioGroup}>
                {['Single', 'Married'].map((st) => (
                  <label key={st} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="maritalStatus"
                      className={styles.radioInput}
                      checked={formData.maritalStatus === st}
                      onChange={() => handleInputChange('maritalStatus', st)}
                    />
                    <span>{st}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.maritalStatus === 'Married' && (
              <div className={styles.gridThreeCol}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Spouse Name</label>
                  <input
                    type="text"
                    className={styles.textInputSm}
                    placeholder="Spouse Name"
                    value={formData.spouseDetails.name}
                    onChange={(e) => handleNestedChange('spouseDetails', 'name', e.target.value)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Spouse Qualification</label>
                  <input
                    type="text"
                    className={styles.textInputSm}
                    placeholder="e.g. M.Sc, B.Tech"
                    value={formData.spouseDetails.qualification}
                    onChange={(e) => handleNestedChange('spouseDetails', 'qualification', e.target.value)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>No. of Children</label>
                  <input
                    type="text"
                    className={styles.textInputSm}
                    placeholder="e.g. 1"
                    value={formData.spouseDetails.numberOfChildren}
                    onChange={(e) => handleNestedChange('spouseDetails', 'numberOfChildren', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 7. KNOWN ALUMNI & REMARKS */}
          <div className={styles.formCard}>
            <h3 className={styles.sectionTitle}>7. Known Alumni & Extra Curricular</h3>

            <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
              <label className={styles.inputLabel}>Extra-Curricular Achievements / Details</label>
              <textarea
                className={styles.textareaInput}
                placeholder="Sports, cultural, leadership roles, NSS/NCC etc."
                value={formData.extraCurricular}
                onChange={(e) => handleInputChange('extraCurricular', e.target.value)}
              />
            </div>

            <h4 style={{ margin: '0 0 0.75rem 0', fontWeight: 700, fontSize: '0.875rem', color: '#475569', textTransform: 'uppercase' }}>
              Details of other Alumni Known to Candidate
            </h4>
            <div className={styles.tableContainer}>
              <table className={styles.dynamicTable}>
                <thead>
                  <tr>
                    <th>Alumni Name</th>
                    <th>Degree / Branch</th>
                    <th>Batch</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {alumniRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input
                          type="text"
                          className={styles.textInputSm}
                          placeholder="Full Name"
                          value={row.name}
                          onChange={(e) => handleAlumniRowChange(row.id, 'name', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.textInputSm}
                          placeholder="e.g. B.E EEE"
                          value={row.degree}
                          onChange={(e) => handleAlumniRowChange(row.id, 'degree', e.target.value)}
                        />
                      </td>
                      <td style={{ width: '120px' }}>
                        <input
                          type="text"
                          className={styles.textInputSm}
                          placeholder="2018-2022"
                          value={row.batch}
                          onChange={(e) => handleAlumniRowChange(row.id, 'batch', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="email"
                          className={styles.textInputSm}
                          placeholder="email@example.com"
                          value={row.email}
                          onChange={(e) => handleAlumniRowChange(row.id, 'email', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.textInputSm}
                          placeholder="Phone"
                          value={row.phone}
                          onChange={(e) => handleAlumniRowChange(row.id, 'phone', e.target.value)}
                        />
                      </td>
                      <td>
                        {alumniRows.length > 1 && (
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => deleteAlumniRow(row.id)}
                            title="Remove row"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className={styles.addRowBtn} onClick={addAlumniRow}>
              <Plus size={15} /> Add Known Alumni Row
            </button>
          </div>

          {/* 8. SIGNATURE */}
          <div className={styles.formCard}>
            <h3 className={styles.sectionTitle}>8. Signature Upload (Optional)</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
              Upload candidate's scanned signature image (JPEG, PNG under 5MB).
            </p>

            <input
              type="file"
              ref={signatureInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleSignatureFileChange}
            />

            {signaturePreviewUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <img src={signaturePreviewUrl} alt="Signature Preview" className={styles.signaturePreview} />
                <button type="button" className={styles.clearSignatureBtn} onClick={handleClearSignature}>
                  Remove Signature
                </button>
              </div>
            ) : (
              <div className={styles.signatureUploadBox} onClick={handleSignatureClick}>
                <Upload size={28} color="#ff3d00" />
                <p className={styles.uploadText}>Click to browse and upload signature</p>
                <p className={styles.uploadSubtext}>PNG, JPG or JPEG (Max 5MB)</p>
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div className={styles.submitBtnContainer}>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.sendingSpinner}></span>
                  <span>Sending Invitation Link...</span>
                </>
              ) : (
                <>
                  <Upload size={18} />
                  <span>Send Pre-Filled Registration Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Signature Crop Modal */}
      {showSignatureModal && tempSignatureUrl && (
        <div className={styles.modalContainer}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Crop Signature</h4>
              <button
                className={styles.resetBtn}
                onClick={() => {
                  setShowSignatureModal(false);
                  setTempSignatureUrl(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className={styles.cropperArea}>
              <Cropper
                image={tempSignatureUrl}
                crop={signatureCrop}
                zoom={signatureZoom}
                aspect={3 / 1}
                onCropChange={setSignatureCrop}
                onZoomChange={setSignatureZoom}
                onCropComplete={onSignatureCropComplete}
              />
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  setShowSignatureModal(false);
                  setTempSignatureUrl(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={handleSaveCroppedSignature}
              >
                Save &amp; Attach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coordinator_Alumini_Form;
