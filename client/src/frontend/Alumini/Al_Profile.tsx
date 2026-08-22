import { useState, useRef, useEffect } from 'react';
import styles from './Al_Profile.module.css';
import './scrollbar.js';

import Cropper from 'react-easy-crop';
import Sidebar from './Components/Sidebar/Sidebar';
import { DateInput } from '../../components/Calendar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper to check if a string is a GridFS ObjectId (24 char hex)
const isGridFSId = (value: string | null | undefined): value is string => {
  return !!(value && typeof value === 'string' && /^[a-f\d]{24}$/i.test(value));
};

// Helper to get image URL from either GridFS ID or base64
const getImageUrl = (value: string | null | undefined) => {
  if (!value) return null;
  if (isGridFSId(value)) {
    return `${API_BASE_URL}/api/images/${value}`;
  }
  // Legacy base64 or data URL
  return value;
};

// Helper to convert base64 to Blob for upload
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

interface Address {
  street: string;
  city: string;
  pinCode: string;
  mobile?: string;
}

interface CompetitiveExam {
  examName: string;
  regNo: string;
  year: string;
  marks: string;
}

interface Qualification {
  course: string;
  institution: string;
  yearOfPassing: string;
  percentage: string;
  boardUniversity: string;
}

interface EntrepreneurDetails {
  organizationName: string;
  natureOfWork: string;
  annualTurnover: string;
  numberOfEmployees: string;
}

interface SpouseDetails {
  name: string;
  qualification: string;
  numberOfChildren: string;
}

interface ProfileData {
  fullName: string;
  fatherSpouseName: string;
  dob: string;
  yearFrom: string;
  yearTo: string;
  degree: string;
  branch: string;
  rollNumber: string;
  presentAddress: string;
  presentCity: string;
  presentPin: string;
  presentMobile: string;
  presentEmail: string;
  permanentAddress: string;
  permanentCity: string;
  permanentPin: string;
  hasCompetitiveExams: boolean;
  competitiveExams: CompetitiveExam[];
  collegeQualifications: Qualification[];
  placementType: string;
  designation: string;
  officeAddress: string;
  remarks: string;
  isEntrepreneur: boolean;
  organizationName: string;
  natureOfWork: string;
  annualTurnover: string;
  numEmployees: string;
  maritalStatus: string;
  spouseName: string;
  spouseQualification: string;
  numChildren: string;
  extraCurricular: string;
  otherInfo: string;
  signature: string | null;
  profilePhoto: string | null;
}

interface ProfileProps {
  onLogout?: () => void;
}

import { getPageCache, setPageCache } from '../../utils/pageCache';

const Alumini_Profile = ({ onLogout }: ProfileProps) => {
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);

  const cachedProfile = getPageCache<ProfileData>('alumni_profile');
  const [loading, setLoading] = useState(!cachedProfile);
  const [error, setError] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

  const initialProfileData: ProfileData = {
    // Personal Details
    fullName: '',
    fatherSpouseName: '',
    dob: '',
    yearFrom: '',
    yearTo: '',
    degree: '',
    branch: '',
    rollNumber: '',
    // Present Address
    presentAddress: '',
    presentCity: '',
    presentPin: '',
    presentMobile: '',
    presentEmail: '',
    // Permanent Address
    permanentAddress: '',
    permanentCity: '',
    permanentPin: '',
    // Qualifications
    hasCompetitiveExams: false,
    competitiveExams: [],
    collegeQualifications: [],
    // Employment
    placementType: '',
    designation: '',
    officeAddress: '',
    remarks: '',
    // Additional Info
    isEntrepreneur: false,
    organizationName: '',
    natureOfWork: '',
    annualTurnover: '',
    numEmployees: '',
    maritalStatus: '',
    spouseName: '',
    spouseQualification: '',
    numChildren: '',
    extraCurricular: '',
    otherInfo: '',
    signature: null, // Base64 image
    profilePhoto: null, // Base64 image for profile photo
  };

  const activeInitial = cachedProfile || initialProfileData;

  const [editMode, setEditMode] = useState(false);
  const [savedData, setSavedData] = useState<ProfileData>(activeInitial);
  const [formData, setFormData] = useState<ProfileData>(activeInitial);

  // Signature states
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(
    activeInitial.signature ? getImageUrl(activeInitial.signature) : null
  );
  const [showModal, setShowModal] = useState(false);
  const [tempPreviewUrl, setTempPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Profile photo states
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(
    activeInitial.profilePhoto ? getImageUrl(activeInitial.profilePhoto) : null
  );
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [tempPhotoUrl, setTempPhotoUrl] = useState<string | null>(null);
  const [photoCrop, setPhotoCrop] = useState({ x: 0, y: 0 });
  const [photoZoom, setPhotoZoom] = useState(1);
  const [croppedPhotoPixels, setCroppedPhotoPixels] = useState<any>(null);

  // Auto-hide success/error popup after 3 seconds
  useEffect(() => {
    if (saveMessage.text) {
      const timer = setTimeout(() => {
        setSaveMessage({ type: '', text: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage.text]);

  // Map API data to form fields
  const mapApiDataToForm = (alumni: any): ProfileData => {
    const formatDate = (dateStr: string | null | undefined) => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      } catch (e) {
        return '';
      }
    };

    return {
      fullName: alumni.name || '',
      fatherSpouseName: alumni.fatherName || '',
      dob: formatDate(alumni.dob),
      yearFrom: alumni.yearFrom?.toString() || '',
      yearTo: alumni.yearTo?.toString() || '',
      degree: alumni.degree || '',
      branch: alumni.branch || '',
      rollNumber: alumni.registerNumber || '',
      // Present Address
      presentAddress: alumni.presentAddress?.street || '',
      presentCity: alumni.presentAddress?.city || '',
      presentPin: alumni.presentAddress?.pinCode || '',
      presentMobile: alumni.presentAddress?.mobile || '',
      presentEmail: alumni.email || '',
      // Permanent Address
      permanentAddress: alumni.permanentAddress?.street || '',
      permanentCity: alumni.permanentAddress?.city || '',
      permanentPin: alumni.permanentAddress?.pinCode || '',
      // Qualifications
      hasCompetitiveExams: alumni.hasCompetitiveExams || false,
      competitiveExams: alumni.competitiveExams || [],
      collegeQualifications: alumni.collegeQualifications || [],
      // Employment
      placementType: alumni.placementType || '',
      designation: alumni.designation || '',
      officeAddress: alumni.companyAddress || '',
      remarks: alumni.employmentRemarks || '',
      // Additional Info
      isEntrepreneur: alumni.isEntrepreneur || false,
      organizationName: alumni.entrepreneurDetails?.organizationName || '',
      natureOfWork: alumni.entrepreneurDetails?.natureOfWork || '',
      annualTurnover: alumni.entrepreneurDetails?.annualTurnover || '',
      numEmployees: alumni.entrepreneurDetails?.numberOfEmployees || '',
      maritalStatus: alumni.maritalStatus || '',
      spouseName: alumni.spouseDetails?.name || '',
      spouseQualification: alumni.spouseDetails?.qualification || '',
      numChildren: alumni.spouseDetails?.numberOfChildren || '',
      extraCurricular: alumni.extraCurricular || '',
      otherInfo: alumni.otherInfo || '',
      signature: alumni.signature || null,
      profilePhoto: alumni.profilePhoto || null,
    };
  };

  // Fetch profile on mount
  useEffect(() => {
    const controller = new AbortController();
    const fetchProfile = async () => {
      if (authLoading) return;

      if (!user?.token) {
        setError('Please login to view your profile');
        setLoading(false);
        return;
      }

      try {
        setError('');
        if (!cachedProfile) setLoading(true);

        const response = await fetch(`${API_BASE_URL}/api/alumni/me`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const mappedData = mapApiDataToForm(data.alumni);
          setFormData(mappedData);
          setSavedData(mappedData);
          setError('');
          setPageCache('alumni_profile', mappedData);
          // Set preview URLs from loaded data (convert GridFS IDs to URLs)
          if (mappedData.signature) {
            setSignaturePreviewUrl(getImageUrl(mappedData.signature));
          }
          if (mappedData.profilePhoto) {
            setProfilePhotoUrl(getImageUrl(mappedData.profilePhoto));
          }
        } else {
          if (!cachedProfile) setError(data.message || 'Failed to load profile');
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching profile:', err);
        if (!cachedProfile) setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    return () => controller.abort();
  }, [user?.token, authLoading]);

  const handleChange = (field: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleYearFromChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const yearFrom = e.target.value;
    const yearTo = yearFrom ? (parseInt(yearFrom) + 4).toString() : '';
    setFormData(prev => ({ ...prev, yearFrom, yearTo }));
  };

  const handleUploadClick = () => {
    if (!editMode) return;
    fileInputRef.current?.click();
  };

  const handleProfilePhotoClick = () => {
    if (!editMode) return;
    profilePhotoInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTempPreviewUrl(event.target.result as string);
          setShowModal(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTempPhotoUrl(event.target.result as string);
          setShowPhotoModal(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetImage = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const onPhotoCropComplete = (croppedArea: any, croppedPhotoPixels: any) => {
    setCroppedPhotoPixels(croppedPhotoPixels);
  };

  const getCroppedImg = (imageSrc: string, pixelCrop: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
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

  const handleModalUpload = async () => {
    if (tempPreviewUrl && croppedAreaPixels && user?.token) {
      try {
        const croppedImageBase64 = await getCroppedImg(tempPreviewUrl, croppedAreaPixels);

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
          // Store GridFS ID in form data, but show image URL for preview
          setSignaturePreviewUrl(`${API_BASE_URL}/api/images/${uploadData.imageId}`);
          setFormData(prev => ({ ...prev, signature: uploadData.imageId }));
        } else {
          console.error('Error uploading signature:', uploadData.message);
          alert('Failed to upload signature. Please try again.');
        }
        setShowModal(false);
      } catch (e) {
        console.error('Error cropping/uploading image:', e);
        alert('Error processing image. Please try again.');
      }
    }
  };

  const handlePhotoModalUpload = async () => {
    if (tempPhotoUrl && croppedPhotoPixels && user?.token) {
      try {
        const croppedImageBase64 = await getCroppedImg(tempPhotoUrl, croppedPhotoPixels);

        // Upload to GridFS
        const blob = base64ToBlob(croppedImageBase64);
        const formDataUpload = new FormData();
        formDataUpload.append('image', blob, 'profilePhoto.png');
        formDataUpload.append('type', 'profilePhoto');

        const uploadResponse = await fetch(`${API_BASE_URL}/api/images/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          body: formDataUpload,
        });

        const uploadData = await uploadResponse.json();

        if (uploadResponse.ok && uploadData.success) {
          // Store GridFS ID in form data, but show image URL for preview
          setProfilePhotoUrl(`${API_BASE_URL}/api/images/${uploadData.imageId}`);
          setFormData(prev => ({ ...prev, profilePhoto: uploadData.imageId }));
        } else {
          console.error('Error uploading profile photo:', uploadData.message);
          alert('Failed to upload profile photo. Please try again.');
        }
        setShowPhotoModal(false);
      } catch (e) {
        console.error('Error cropping/uploading image:', e);
        alert('Error processing image. Please try again.');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTempPreviewUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleClosePhotoModal = () => {
    setShowPhotoModal(false);
    setTempPhotoUrl(null);
    setPhotoCrop({ x: 0, y: 0 });
    setPhotoZoom(1);
  };

  const handleResetPhoto = () => {
    setPhotoCrop({ x: 0, y: 0 });
    setPhotoZoom(1);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMode || !user?.token) return;

    setIsSaving(true);
    setSaveMessage({ type: '', text: '' });

    // Build payload matching backend schema
    const payload = {
      presentAddress: {
        street: formData.presentAddress,
        city: formData.presentCity,
        pinCode: formData.presentPin,
        mobile: formData.presentMobile,
      },
      permanentAddress: {
        street: formData.permanentAddress,
        city: formData.permanentCity,
        pinCode: formData.permanentPin,
      },
      hasCompetitiveExams: formData.hasCompetitiveExams,
      competitiveExams: formData.competitiveExams,
      collegeQualifications: formData.collegeQualifications,
      placementType: formData.placementType,
      designation: formData.designation,
      companyAddress: formData.officeAddress,
      employmentRemarks: formData.remarks,
      isEntrepreneur: formData.isEntrepreneur,
      entrepreneurDetails: {
        organizationName: formData.organizationName,
        natureOfWork: formData.natureOfWork,
        annualTurnover: formData.annualTurnover,
        numberOfEmployees: formData.numEmployees,
      },
      maritalStatus: formData.maritalStatus,
      spouseDetails: {
        name: formData.spouseName,
        qualification: formData.spouseQualification,
        numberOfChildren: formData.numChildren,
      },
      extraCurricular: formData.extraCurricular,
      otherInfo: formData.otherInfo,
      signature: formData.signature,
      profilePhoto: formData.profilePhoto,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/alumni/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Update form with the response data to show any server-side changes
        const mappedData = mapApiDataToForm(data.alumni);
        setFormData(mappedData);
        setSavedData(mappedData);
        // Update preview URLs (convert GridFS IDs to URLs)
        if (mappedData.signature) {
          setSignaturePreviewUrl(getImageUrl(mappedData.signature));
        }
        if (mappedData.profilePhoto) {
          setProfilePhotoUrl(getImageUrl(mappedData.profilePhoto));
        }
        setEditMode(false);
      } else {
        setSaveMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setSaveMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setFormData(savedData);
    // Restore preview URLs to saved data (convert GridFS IDs to URLs)
    setSignaturePreviewUrl(savedData.signature ? getImageUrl(savedData.signature) : null);
    setProfilePhotoUrl(savedData.profilePhoto ? getImageUrl(savedData.profilePhoto) : null);
    setEditMode(false);
  };

  return (
    <div className={styles.pageContainer}>
      <Sidebar onLogout={onLogout} currentView={'profile'} />

      <main className={styles.mainContent}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <p>Loading profile...</p>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', padding: '2rem' }}>
            <div style={{
              maxWidth: '500px',
              textAlign: 'center',
              padding: '2rem',
              backgroundColor: '#fff5f5',
              border: '1px solid #fca5a5',
              borderRadius: '0.5rem',
              color: '#d32f2f'
            }}>
              <p style={{ margin: 0, marginBottom: '0.5rem', fontWeight: 500 }}>
                <span style={{ marginRight: '0.5rem' }}>ℹ️</span>
                {error}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <section className={styles.profileHeader}>
              <div className={styles.avatarContainer}>
                <div className={styles.avatarWrapper}>
                  <img
                    src={profilePhotoUrl || 'https://i.pravatar.cc/150?img=11'}
                    alt={formData.fullName}
                    className={styles.avatarImage}
                  />
                </div>
                {editMode && (
                  <button
                    type="button"
                    className={styles.avatarEditBtn}
                    onClick={handleProfilePhotoClick}
                    title="Change Profile Photo"
                  >
                    <span className="material-symbols-outlined">photo_camera</span>
                  </button>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={profilePhotoInputRef}
                  style={{ display: 'none' }}
                  onChange={handleProfilePhotoChange}
                />
              </div>
              <h2 className={styles.userName}>{formData.fullName}</h2>
              <p className={styles.userClass}>Batch of {formData.yearFrom} - {formData.yearTo}</p>
            </section>

            {/* Profile Photo Cropper Modal */}
            {showPhotoModal && (
              <div className={styles.modalContainer}>
                <div className={styles.card}>
                  <div className={styles.header}>
                    <h2 className={styles.title}>Adjust Profile Photo</h2>
                    <button type="button" className={styles.resetBtn} aria-label="Reset Image" onClick={handleResetPhoto}>
                      <span className="material-symbols-outlined">refresh</span>
                    </button>
                  </div>
                  <div className={styles.cropperArea} style={{ position: 'relative', width: '100%', height: '300px', backgroundColor: '#333', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
                    {tempPhotoUrl && (
                      <Cropper
                        image={tempPhotoUrl}
                        crop={photoCrop}
                        zoom={photoZoom}
                        aspect={1}
                        onCropChange={setPhotoCrop}
                        onCropComplete={onPhotoCropComplete}
                        onZoomChange={setPhotoZoom}
                        cropShape="round"
                      />
                    )}
                  </div>
                  <div className={styles.modalFooter} style={{ display: 'flex', gap: '16px' }}>
                    <button type="button" className={styles.cancelBtn} onClick={handleClosePhotoModal} style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFF', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                    <button type="button" className={styles.uploadBtn} onClick={handlePhotoModalUpload} style={{ flex: 2, padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#007BFF', color: '#FFF', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined">check</span>
                      Save Photo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Message */}
            {saveMessage.text && (
              <div style={{
                padding: '12px 16px',
                marginBottom: '16px',
                borderRadius: '8px',
                backgroundColor: saveMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: saveMessage.type === 'success' ? '#166534' : '#991b1b',
              }}>
                {saveMessage.text}
              </div>
            )}

            {/* Comprehensive Form */}
            <form className={styles.formWrapper} onSubmit={handleSubmit}>

              {/* Section 1: Personal Details */}
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Section 1: Personal Details</h3>
                <div className={styles.gridTwo}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Full Name</label>
                    <input 
                  type="text" 
                  value={formData.fullName} 
                  onChange={handleChange('fullName')}
                  className={styles.input} 
                  readOnly={!editMode}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Father / Spouse Name</label>
                <input 
                  type="text" 
                  value={formData.fatherSpouseName} 
                  onChange={handleChange('fatherSpouseName')}
                  className={styles.input} 
                  readOnly={!editMode}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Date of Birth</label>
                <DateInput
                  theme="alumni"
                  value={formData.dob} 
                  onChange={(e: any) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                  className={styles.input} 
                  readOnly={!editMode}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Years of Study</label>
                <div className={styles.yearRange}>
                  {editMode ? (
                    <select
                      value={formData.yearFrom}
                      onChange={handleYearFromChange}
                      className={styles.input}
                      style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                    >
                      <option value="">Select Year</option>
                      {Array.from({ length: 50 }, (_, i) => 2001 + i).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value={formData.yearFrom} className={styles.input} readOnly />
                  )}
                  <span className={styles.yearSeparator}>to</span>
                  <input type="text" value={formData.yearTo} className={styles.input} readOnly />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Course / Branch</label>
                <input
                  type="text"
                  value={`${formData.degree} - ${formData.branch}`}
                  className={styles.input}
                  readOnly
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Roll Number</label>
                <input
                  type="text"
                  value={formData.rollNumber}
                  className={styles.input}
                  readOnly
                />
              </div>
            </div>

            {/* Present Address */}
            <div className={styles.addressSection}>
              <h4 className={styles.subsectionTitle}>Present Address</h4>
              <div className={styles.gridThree}>
                <div className={styles.formGroup}>
                  <label className={styles.labelSmall}>Street Address</label>
                  <input 
                    type="text" 
                    value={formData.presentAddress} 
                    onChange={handleChange('presentAddress')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.labelSmall}>City</label>
                  <input 
                    type="text" 
                    value={formData.presentCity} 
                    onChange={handleChange('presentCity')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.labelSmall}>PIN Code</label>
                  <input 
                    type="text" 
                    value={formData.presentPin} 
                    onChange={handleChange('presentPin')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.labelSmall}>Mobile Number</label>
                  <input 
                    type="tel" 
                    value={formData.presentMobile} 
                    onChange={handleChange('presentMobile')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.spanTwo}`}>
                  <label className={styles.labelSmall}>Email Address</label>
                  <input 
                    type="email" 
                    value={formData.presentEmail} 
                    onChange={handleChange('presentEmail')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
              </div>
            </div>

            {/* Permanent Address */}
            <div className={styles.addressSection}>
              <h4 className={styles.subsectionTitle}>Permanent Address</h4>
              <div className={styles.gridFour}>
                <div className={`${styles.formGroup} ${styles.spanTwo}`}>
                  <label className={styles.labelSmall}>Street Address</label>
                  <input 
                    type="text" 
                    value={formData.permanentAddress} 
                    onChange={handleChange('permanentAddress')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.labelSmall}>City</label>
                  <input 
                    type="text" 
                    value={formData.permanentCity} 
                    onChange={handleChange('permanentCity')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.labelSmall}>PIN Code</label>
                  <input 
                    type="text" 
                    value={formData.permanentPin} 
                    onChange={handleChange('permanentPin')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
              </div>
            </div>

            {/* Signature Upload */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Upload Signature</label>
              <div className={styles.uploadBox} onClick={handleUploadClick} style={{ cursor: editMode ? 'pointer' : 'default', opacity: editMode ? 1 : 0.6 }}>
                {!signaturePreviewUrl ? (
                  <span className="material-icons-outlined" style={{fontSize: '48px', color: '#9CA3AF', marginBottom: 8}}>cloud_upload</span>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}} onClick={e => e.stopPropagation()}>
                    <img src={signaturePreviewUrl} alt="Signature Preview" className={styles.signaturePreview} style={{maxWidth: 220, maxHeight: 60, border: '1.5px solid #CBD5E1', borderRadius: 8, marginBottom: 8, background: '#fff'}} />
                    {editMode && (
                      <button
                        type="button"
                        className={styles.clearBtn}
                        onClick={() => {
                          setSignaturePreviewUrl(null);
                          setFormData(prev => ({ ...prev, signature: null }));
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
                {editMode && (
                  <>
                    <p className={styles.uploadText} style={{marginTop: 8}}>Click to upload signature or drag and drop</p>
                    <p className={styles.uploadSubtext}>PNG, JPG up to 2MB</p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
              {showModal && (
                <div className={styles.modalContainer}>
                  <div className={styles.card}>
                    <div className={styles.header}>
                      <h2 className={styles.title}>Adjust E-Sign</h2>
                      <button type="button" className={styles.resetBtn} aria-label="Reset Image" onClick={handleResetImage}>
                        <span className="material-symbols-outlined">refresh</span>
                      </button>
                    </div>
                    <div className={styles.cropperArea} style={{ position: 'relative', width: '100%', height: '300px', backgroundColor: '#333', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
                      {tempPreviewUrl && (
                        <Cropper
                          image={tempPreviewUrl}
                          crop={crop}
                          zoom={zoom}
                          aspect={2 / 1}
                          onCropChange={setCrop}
                          onCropComplete={onCropComplete}
                          onZoomChange={setZoom}
                        />
                      )}
                    </div>
                    <div className={styles.modalFooter} style={{ display: 'flex', gap: '16px' }}>
                      <button type="button" className={styles.cancelBtn} onClick={handleCloseModal} style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFF', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                      <button type="button" className={styles.uploadBtn} onClick={handleModalUpload} style={{ flex: 2, padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#007BFF', color: '#FFF', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined">send</span>
                        Upload E-Sign
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Qualifications & Employment */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Section 2: Qualifications &amp; Employment</h3>

            {/* Competitive Exams */}
            <div className={styles.gridFour}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Competitive Exams Cleared?</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="exams_cleared"
                      className={styles.radioInput}
                      checked={formData.hasCompetitiveExams === true}
                      onChange={() => setFormData(prev => ({ ...prev, hasCompetitiveExams: true }))}
                      disabled={!editMode}
                    />
                    <span>Yes</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="exams_cleared"
                      className={styles.radioInput}
                      checked={formData.hasCompetitiveExams === false}
                      onChange={() => setFormData(prev => ({ ...prev, hasCompetitiveExams: false }))}
                      disabled={!editMode}
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>
              {formData.competitiveExams?.map((exam, index) => (
                <div key={index} className={styles.formGroup}>
                  <label className={styles.labelSmall}>{exam.examName}</label>
                  <input
                    type="text"
                    value={exam.marks || ''}
                    className={styles.input}
                    readOnly
                  />
                </div>
              ))}
            </div>

            {/* Qualifications Table */}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Institution</th>
                    <th>Year of Passing</th>
                    <th>% of Marks</th>
                    <th>Board / University</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.collegeQualifications?.length > 0 ? (
                    formData.collegeQualifications.map((qual, index) => (
                      <tr key={index}>
                        <td><input type="text" value={qual.course || ''} className={styles.tableInput} readOnly /></td>
                        <td><input type="text" value={qual.institution || ''} className={styles.tableInput} readOnly /></td>
                        <td><input type="text" value={qual.yearOfPassing || ''} className={styles.tableInput} readOnly /></td>
                        <td><input type="text" value={qual.percentage || ''} className={styles.tableInput} readOnly /></td>
                        <td><input type="text" value={qual.boardUniversity || ''} className={styles.tableInput} readOnly /></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#6b7280' }}>No qualifications added</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Employment Details */}
            <div className={styles.employmentSection}>
              <h4 className={styles.subsectionTitle}>Employment Details</h4>
              <div className={styles.gridTwo}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Placement Type</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="placement"
                        className={styles.radioInput}
                        checked={formData.placementType === 'On-campus'}
                        onChange={() => setFormData(prev => ({ ...prev, placementType: 'On-campus' }))}
                        disabled={!editMode}
                      />
                      <span>On Campus</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="placement"
                        className={styles.radioInput}
                        checked={formData.placementType === 'Off-campus'}
                        onChange={() => setFormData(prev => ({ ...prev, placementType: 'Off-campus' }))}
                        disabled={!editMode}
                      />
                      <span>Off Campus</span>
                    </label>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={handleChange('designation')}
                    className={styles.input}
                    readOnly={!editMode}
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.spanTwo}`}>
                  <label className={styles.label}>Current Office Address</label>
                  <input
                    type="text"
                    value={formData.officeAddress}
                    onChange={handleChange('officeAddress')}
                    className={styles.input}
                    readOnly={!editMode}
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.spanTwo}`}>
                  <label className={styles.label}>Remarks</label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={handleChange('remarks')}
                    className={styles.input}
                    readOnly={!editMode}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Additional Info */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Section 3: Additional Info</h3>
            <div className={styles.gridTwo}>
              {/* Left Column */}
              <div className={styles.column}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Have you become an entrepreneur?</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="entrepreneur"
                        className={styles.radioInput}
                        checked={formData.isEntrepreneur === true}
                        onChange={() => setFormData(prev => ({ ...prev, isEntrepreneur: true }))}
                        disabled={!editMode}
                      />
                      <span>Yes</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="entrepreneur"
                        className={styles.radioInput}
                        checked={formData.isEntrepreneur === false}
                        onChange={() => setFormData(prev => ({ ...prev, isEntrepreneur: false }))}
                        disabled={!editMode}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Name and Address of Organization</label>
                  <textarea 
                    rows={2} 
                    value={formData.organizationName} 
                    onChange={handleChange('organizationName')}
                    className={styles.textarea}
                    readOnly={!editMode}
                  ></textarea>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nature of Work / Product</label>
                  <input 
                    type="text" 
                    value={formData.natureOfWork} 
                    onChange={handleChange('natureOfWork')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={styles.gridTwoNested}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Annual Turnover</label>
                    <input 
                      type="text" 
                      value={formData.annualTurnover} 
                      onChange={handleChange('annualTurnover')}
                      className={styles.input} 
                      readOnly={!editMode}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>No. of Employees</label>
                    <input 
                      type="number" 
                      value={formData.numEmployees} 
                      onChange={handleChange('numEmployees')}
                      className={styles.input} 
                      readOnly={!editMode}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className={styles.column}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Marital Status</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="marital"
                        className={styles.radioInput}
                        checked={formData.maritalStatus === 'Single'}
                        onChange={() => setFormData(prev => ({ ...prev, maritalStatus: 'Single' }))}
                        disabled={!editMode}
                      />
                      <span>Single</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="marital"
                        className={styles.radioInput}
                        checked={formData.maritalStatus === 'Married'}
                        onChange={() => setFormData(prev => ({ ...prev, maritalStatus: 'Married' }))}
                        disabled={!editMode}
                      />
                      <span>Married</span>
                    </label>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Spouse Name</label>
                  <input
                    type="text"
                    value={formData.spouseName}
                    onChange={handleChange('spouseName')}
                    className={styles.input}
                    readOnly={!editMode}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Spouse Qualification</label>
                  <input
                    type="text"
                    value={formData.spouseQualification}
                    onChange={handleChange('spouseQualification')}
                    className={styles.input}
                    readOnly={!editMode}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>No. of Children</label>
                  <input
                    type="text"
                    value={formData.numChildren}
                    onChange={handleChange('numChildren')}
                    className={styles.input}
                    readOnly={!editMode}
                  />
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Role/Contribution to Alumnus (Activities like seminars/placements/funds/awards etc.)</label>
              <textarea
                rows={4}
                value={formData.extraCurricular}
                onChange={handleChange('extraCurricular')}
                placeholder="Mention your contributions..."
                className={styles.textarea}
                readOnly={!editMode}
              ></textarea>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Any Other Relevant Information</label>
              <textarea
                rows={3}
                value={formData.otherInfo}
                onChange={handleChange('otherInfo')}
                className={styles.textarea}
                readOnly={!editMode}
              ></textarea>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            {!editMode ? (
              <button
                type="button"
                className={styles.editBtn}
                onClick={handleStartEdit}
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.cancelEditBtn}
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </form>
          </>
        )}
      </main>
    </div>
  );
};

export default Alumini_Profile;