import { useState, useEffect, useRef } from 'react';
import { User, Lock, Eye, EyeOff, ChevronDown, ChevronUp, Camera, Building2, Upload, X, ArrowLeft } from 'lucide-react';
import styles from './AD_Profile.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';
import { useAdminContext } from '../../context/adminContext/adminContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Admin_Profile = ({ onLogout }) => {
  // Profile data state
  const [profileData, setProfileData] = useState({
    registerNumber: '',
    name: '',
    username: '',
    email: '',
    mobile: '',
    dateOfBirth: '',
    degree: '',
    branch: '',
    presentAddress: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    permanentAddress: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    designation: '',
    profilePhoto: null,
    instituteDetails: {
      logo: null,
      banner: null
    }
  });

  // Image preview states
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  // Track previous image IDs for deletion of replaced images
  const [previousImages, setPreviousImages] = useState({
    profilePhoto: null,
    logo: null,
    banner: null
  });

  // Pending files - selected but not yet uploaded to GridFS
  const [pendingFiles, setPendingFiles] = useState({
    profilePhoto: null,
    logo: null,
    banner: null
  });

  // File refs
  const profilePhotoRef = useRef(null);
  const logoRef = useRef(null);
  const bannerRef = useRef(null);

  // Upload states
  const [uploading, setUploading] = useState({
    profilePhoto: false,
    logo: false,
    banner: false
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
    resetNew: false,
    resetConfirm: false
  });

  // Password update state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Password reset state
  const [resetData, setResetData] = useState({
    mobile: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [resetStep, setResetStep] = useState('none'); // none, otp, password
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Messages
  const [message, setMessage] = useState({ type: '', text: '' });

  // Same address checkbox
  const [sameAsPresent, setSameAsPresent] = useState(false);

  // Get user from auth context (stored in cookies)
  const { user, loading: authLoading } = useAuth();
  const { fetchAdminBranding } = useAdminContext();

  // Fetch profile data when user is available
  useEffect(() => {
    if (!authLoading && user?.token) {
      fetchProfile();
    } else if (!authLoading && !user?.token) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Check if user is logged in
      if (!user?.token) {
        showMessage('error', 'Please login to access profile');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.status === 401) {
        showMessage('error', 'Session expired. Please login again');
        // Optionally redirect to login
        localStorage.removeItem('user');
        window.location.href = '/admin/login';
        return;
      }

      if (data.success && data.data) {
        const profileData = {
          ...data.data,
          dateOfBirth: data.data.dateOfBirth ? new Date(data.data.dateOfBirth).toISOString().split('T')[0] : '',
          presentAddress: data.data.presentAddress || { street: '', city: '', state: '', pincode: '' },
          permanentAddress: data.data.permanentAddress || { street: '', city: '', state: '', pincode: '' },
          profilePhoto: data.data.profilePhoto || null,
          instituteDetails: data.data.instituteDetails || { logo: null, banner: null, name: '', address: '', mobile: '' }
        };

        setProfileData(profileData);

        // Set image previews if they exist
        if (profileData.profilePhoto) {
          const photoUrl = `${API_BASE_URL}/api/images/${profileData.profilePhoto}`;
          setProfilePhotoPreview(photoUrl);
        }
        if (profileData.instituteDetails?.logo) {
          const logoUrl = `${API_BASE_URL}/api/images/${profileData.instituteDetails.logo}`;
          setLogoPreview(logoUrl);
        }
        if (profileData.instituteDetails?.banner) {
          const bannerUrl = `${API_BASE_URL}/api/images/${profileData.instituteDetails.banner}`;
          setBannerPreview(bannerUrl);
        }

        // Track previous images for deletion of replaced files
        setPreviousImages({
          profilePhoto: profileData.profilePhoto,
          logo: profileData.instituteDetails?.logo,
          banner: profileData.instituteDetails?.banner
        });

        // Check if addresses are the same and set checkbox
        const addressesMatch =
          profileData.presentAddress.street === profileData.permanentAddress.street &&
          profileData.presentAddress.city === profileData.permanentAddress.city &&
          profileData.presentAddress.state === profileData.permanentAddress.state &&
          profileData.presentAddress.pincode === profileData.permanentAddress.pincode &&
          profileData.presentAddress.street !== ''; // Only if present address is not empty

        setSameAsPresent(addressesMatch);

        // Auto-populate mobile for password reset
        if (profileData.mobile) {
          setResetData(prev => ({ ...prev, mobile: profileData.mobile }));
        }
      } else if (data.success && !data.data) {
        // Profile not created yet - this is fine
      } else {
        showMessage('error', data.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showMessage('error', 'Failed to load profile. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleProfileChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData(prev => {
        const newData = {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };

        // If present address is being changed and checkbox is checked, update permanent address too
        if (parent === 'presentAddress' && sameAsPresent) {
          newData.permanentAddress = { ...newData.presentAddress };
        }

        return newData;
      });
    } else {
      setProfileData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      if (!user?.token) {
        showMessage('error', 'Please login to save profile');
        return;
      }

      // Step 0: Upload pending files to GridFS
      let updatedProfileData = { ...profileData };

      if (pendingFiles.profilePhoto) {
        const photoId = await handleImageUpload(pendingFiles.profilePhoto, 'profilePhoto');
        if (photoId) {
          updatedProfileData.profilePhoto = photoId;
        } else {
          showMessage('error', 'Failed to upload profile photo');
          return;
        }
      }

      if (pendingFiles.logo) {
        const logoId = await handleImageUpload(pendingFiles.logo, 'instituteLogo');
        if (logoId) {
          updatedProfileData.instituteDetails = {
            ...updatedProfileData.instituteDetails,
            logo: logoId
          };
        } else {
          showMessage('error', 'Failed to upload logo');
          return;
        }
      }

      if (pendingFiles.banner) {
        const bannerId = await handleImageUpload(pendingFiles.banner, 'instituteBanner');
        if (bannerId) {
          updatedProfileData.instituteDetails = {
            ...updatedProfileData.instituteDetails,
            banner: bannerId
          };
        } else {
          showMessage('error', 'Failed to upload banner');
          return;
        }
      }

      // Clear pending files after upload
      setPendingFiles({ profilePhoto: null, logo: null, banner: null });

      // Update profile data with uploaded image IDs
      setProfileData(updatedProfileData);

      // Step 1: Delete old images that were replaced
      await deleteReplacedImages(updatedProfileData);

      // Step 2: Save profile with new image IDs
      const response = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedProfileData)
      });

      const data = await response.json();

      if (response.status === 401) {
        showMessage('error', 'Session expired. Please login again');
        localStorage.removeItem('user');
        window.location.href = '/admin/login';
        return;
      }

      if (data.success) {
        // Step 3: Update previousImages to reflect newly saved state
        setPreviousImages({
          profilePhoto: updatedProfileData.profilePhoto,
          logo: updatedProfileData.instituteDetails?.logo,
          banner: updatedProfileData.instituteDetails?.banner
        });

        // Step 4: Update global admin context so all components reflect changes instantly
        await fetchAdminBranding(user?.token);

        showMessage('success', 'Profile updated successfully');
        setIsEditing(false);
      } else {
        showMessage('error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/profile/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordData)
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'Password updated successfully');
        setShowUpdatePassword(false);
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showMessage('error', data.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      showMessage('error', 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleSendOtp = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/profile/send-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mobile: resetData.mobile })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'OTP sent successfully');
        setOtpSent(true);
        setResetStep('otp');
      } else {
        showMessage('error', data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      showMessage('error', 'Failed to send OTP');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/profile/verify-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: resetData.otp })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'OTP verified successfully');
        setOtpVerified(true);
        setResetStep('password');
      } else {
        showMessage('error', data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      showMessage('error', 'Failed to verify OTP');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (resetData.newPassword !== resetData.confirmPassword) {
      showMessage('error', 'Passwords do not match');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/profile/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newPassword: resetData.newPassword,
          confirmPassword: resetData.confirmPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'Password reset successfully');
        setShowResetPassword(false);
        setResetData({ mobile: '', otp: '', newPassword: '', confirmPassword: '' });
        setResetStep('none');
        setOtpSent(false);
        setOtpVerified(false);
      } else {
        showMessage('error', data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showMessage('error', 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSameAddressChange = (checked) => {
    setSameAsPresent(checked);
    if (checked) {
      // Copy present address to permanent address
      setProfileData(prev => ({
        ...prev,
        permanentAddress: { ...prev.presentAddress }
      }));
    } else {
      // Clear permanent address
      setProfileData(prev => ({
        ...prev,
        permanentAddress: {
          street: '',
          city: '',
          state: '',
          pincode: ''
        }
      }));
    }
  };

  // Handle image upload
  const handleImageUpload = async (file, type) => {
    if (!file) return null;

    setUploading(prev => ({ ...prev, [type]: true }));

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);

      const response = await fetch(`${API_BASE_URL}/api/images/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        return data.imageId;
      } else {
        showMessage('error', data.message || 'Failed to upload image');
        return null;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showMessage('error', 'Failed to upload image');
      return null;
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  // Delete images that were replaced with new ones
  const deleteReplacedImages = async (newProfileData) => {
    const imagesToDelete = [];

    // Check profilePhoto
    if (previousImages.profilePhoto && previousImages.profilePhoto !== newProfileData.profilePhoto) {
      imagesToDelete.push(previousImages.profilePhoto);
    }

    // Check logo
    if (previousImages.logo && previousImages.logo !== newProfileData.instituteDetails?.logo) {
      imagesToDelete.push(previousImages.logo);
    }

    // Check banner
    if (previousImages.banner && previousImages.banner !== newProfileData.instituteDetails?.banner) {
      imagesToDelete.push(previousImages.banner);
    }

    // Delete each old image
    for (const imageId of imagesToDelete) {
      try {
        await fetch(`${API_BASE_URL}/api/images/${imageId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${user?.token}` }
        });
      } catch (error) {
        console.error(`Error deleting image ${imageId}:`, error);
      }
    }
  };
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store file as pending (will upload on save)
    setPendingFiles(prev => ({ ...prev, profilePhoto: file }));

    // Show preview immediately (base64)
    const reader = new FileReader();
    reader.onload = (e) => setProfilePhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Handle logo change
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store file as pending (will upload on save)
    setPendingFiles(prev => ({ ...prev, logo: file }));

    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Handle banner change
  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store file as pending (will upload on save)
    setPendingFiles(prev => ({ ...prev, banner: file }));

    const reader = new FileReader();
    reader.onload = (e) => setBannerPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Remove image
  const handleRemoveImage = (type) => {
    // First, clear any pending file for this type
    setPendingFiles(prev => ({ ...prev, [type]: null }));

    // Then clear the preview and state
    if (type === 'profilePhoto') {
      setProfilePhotoPreview(null);
      setProfileData(prev => ({ ...prev, profilePhoto: null }));
      if (profilePhotoRef.current) profilePhotoRef.current.value = '';
    } else if (type === 'logo') {
      setLogoPreview(null);
      setProfileData(prev => ({
        ...prev,
        instituteDetails: { ...prev.instituteDetails, logo: null }
      }));
      if (logoRef.current) logoRef.current.value = '';
    } else if (type === 'banner') {
      setBannerPreview(null);
      setProfileData(prev => ({
        ...prev,
        instituteDetails: { ...prev.instituteDetails, banner: null }
      }));
      if (bannerRef.current) bannerRef.current.value = '';
    }
  };

  // Handle institute details change
  const handleInstituteChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      instituteDetails: {
        ...prev.instituteDetails,
        [field]: value
      }
    }));
  };

  if (loading || authLoading) {
    return (
      <div className={styles.pageLayout}>
        <Sidebar onLogout={onLogout} currentView={'profile'} />
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <div className={styles.loadingText}>Loading profile...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageLayout}>
      <Sidebar onLogout={onLogout} currentView={'profile'} />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>

          <header className={styles.pageHeader}>
            <h2 className={styles.pageTitle}>Admin Profile</h2>
            <p className={styles.pageSubtitle}>Manage your personal and institutional information</p>
          </header>

          {/* Message */}
          {message.text && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          <div className={styles.formContainer}>

            {/* Personal Information */}
            <section className={styles.cardContainer}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleGroup}>
                  <User className={styles.primaryText} size={20} />
                  <h3 className={styles.cardTitle}>Personal Information</h3>
                </div>
                {!isEditing && (
                  <button
                    className={styles.editBtn}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
              <div className={styles.cardBody}>
                {/* Profile Photo Section */}
                <div className={styles.profilePhotoSection}>
                  <div className={styles.profilePhotoWrapper}>
                    {profilePhotoPreview ? (
                      <img
                        src={profilePhotoPreview}
                        alt="Profile"
                        className={styles.profilePhoto}
                      />
                    ) : (
                      <div className={styles.profilePhotoPlaceholder}>
                        <User size={48} />
                      </div>
                    )}
                    {isEditing && (
                      <div className={styles.profilePhotoOverlay}>
                        <button
                          type="button"
                          className={styles.photoUploadBtn}
                          onClick={() => profilePhotoRef.current?.click()}
                          disabled={uploading.profilePhoto}
                        >
                          {uploading.profilePhoto ? (
                            <span className={styles.spinner} />
                          ) : (
                            <Camera size={20} />
                          )}
                        </button>
                        {profilePhotoPreview && (
                          <button
                            type="button"
                            className={styles.photoRemoveBtn}
                            onClick={() => handleRemoveImage('profilePhoto')}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    )}
                    <input
                      ref={profilePhotoRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                  <div className={styles.profilePhotoInfo}>
                    <span className={styles.profilePhotoLabel}>Profile Photo</span>
                    <span className={styles.profilePhotoHint}>
                      {isEditing ? 'Click the camera icon to upload' : 'Enable edit mode to change'}
                    </span>
                  </div>
                </div>

                <div className={styles.inputGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Register Number</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={profileData.registerNumber}
                      onChange={(e) => handleProfileChange('registerNumber', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter register number"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Full Name</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={profileData.name}
                      onChange={(e) => handleProfileChange('name', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter full name"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Username</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={profileData.username}
                      onChange={(e) => handleProfileChange('username', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter username"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Email</label>
                    <input
                      type="email"
                      className={styles.inputField}
                      value={profileData.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter email"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Mobile Number</label>
                    <input
                      type="tel"
                      className={styles.inputField}
                      value={profileData.mobile}
                      onChange={(e) => handleProfileChange('mobile', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter mobile number"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Date of Birth</label>
                    <input
                      type="date"
                      className={styles.inputField}
                      value={profileData.dateOfBirth}
                      onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </section>


            {/* Address Information */}
            <section className={styles.cardContainer}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleGroup}>
                  <span className={`material-symbols-outlined ${styles.primaryText}`}>location_on</span>
                  <h3 className={styles.cardTitle}>Address Information</h3>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.addressSection}>
                  <h4 className={styles.addressTitle}>Present Address</h4>
                  <div className={styles.inputGrid}>
                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                      <label className={styles.inputLabel}>Street</label>
                      <input
                        type="text"
                        className={styles.inputField}
                        value={profileData.presentAddress.street}
                        onChange={(e) => handleProfileChange('presentAddress.street', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter street address"
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>City</label>
                      <input
                        type="text"
                        className={styles.inputField}
                        value={profileData.presentAddress.city}
                        onChange={(e) => handleProfileChange('presentAddress.city', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter city"
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>State</label>
                      <input
                        type="text"
                        className={styles.inputField}
                        value={profileData.presentAddress.state}
                        onChange={(e) => handleProfileChange('presentAddress.state', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter state"
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Pincode</label>
                      <input
                        type="text"
                        className={styles.inputField}
                        value={profileData.presentAddress.pincode}
                        onChange={(e) => handleProfileChange('presentAddress.pincode', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter pincode"
                      />
                    </div>
                  </div>
                </div>

                {/* Same Address Checkbox */}
                <div className={styles.checkboxSection}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={sameAsPresent}
                      onChange={(e) => handleSameAddressChange(e.target.checked)}
                      disabled={!isEditing}
                    />
                    <span className={styles.checkboxText}>
                      Permanent address is same as present address
                    </span>
                  </label>
                </div>

                <div className={styles.addressSection}>
                  <h4 className={styles.addressTitle}>Permanent Address</h4>
                  <div className={styles.inputGrid}>
                    <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                      <label className={styles.inputLabel}>Street</label>
                      <input
                        type="text"
                        className={styles.inputField}
                        value={profileData.permanentAddress.street}
                        onChange={(e) => handleProfileChange('permanentAddress.street', e.target.value)}
                        disabled={!isEditing || sameAsPresent}
                        placeholder="Enter street address"
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>City</label>
                      <input
                        type="text"
                        className={styles.inputField}
                        value={profileData.permanentAddress.city}
                        onChange={(e) => handleProfileChange('permanentAddress.city', e.target.value)}
                        disabled={!isEditing || sameAsPresent}
                        placeholder="Enter city"
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>State</label>
                      <input
                        type="text"
                        className={styles.inputField}
                        value={profileData.permanentAddress.state}
                        onChange={(e) => handleProfileChange('permanentAddress.state', e.target.value)}
                        disabled={!isEditing || sameAsPresent}
                        placeholder="Enter state"
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Pincode</label>
                      <input
                        type="text"
                        className={styles.inputField}
                        value={profileData.permanentAddress.pincode}
                        onChange={(e) => handleProfileChange('permanentAddress.pincode', e.target.value)}
                        disabled={!isEditing || sameAsPresent}
                        placeholder="Enter pincode"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Institute Details */}
            <section className={styles.cardContainer}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleGroup}>
                  <Building2 className={styles.primaryText} size={20} />
                  <h3 className={styles.cardTitle}>Institute Details</h3>
                </div>
              </div>
              <div className={styles.cardBody} style={{ paddingBottom: '1.5rem' }}>
                {/* Logo and Banner Upload Section */}
                <div className={styles.instituteImagesSection}>
                  {/* Logo Upload */}
                  <div className={styles.instituteImageWrapper}>
                    <label className={styles.inputLabel}>Institute Logo</label>
                    <div className={styles.logoUploadArea}>
                      {logoPreview ? (
                        <div className={styles.logoPreviewContainer}>
                          <img src={logoPreview} alt="Institute Logo" className={styles.logoPreview} />
                          {isEditing && (
                            <button
                              type="button"
                              className={styles.removeImageBtn}
                              onClick={() => handleRemoveImage('logo')}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`${styles.uploadPlaceholder} ${!isEditing ? styles.disabled : ''}`}
                          onClick={() => isEditing && logoRef.current?.click()}
                        >
                          {uploading.logo ? (
                            <span className={styles.spinner} />
                          ) : (
                            <>
                              <Upload size={24} />
                              <span>Upload Logo</span>
                            </>
                          )}
                        </div>
                      )}
                      {isEditing && logoPreview && (
                        <button
                          type="button"
                          className={styles.changeImageBtn}
                          onClick={() => logoRef.current?.click()}
                          disabled={uploading.logo}
                        >
                          Change Logo
                        </button>
                      )}
                      <input
                        ref={logoRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Banner Upload */}
                  <div className={styles.instituteImageWrapper}>
                    <label className={styles.inputLabel}>Institute Banner</label>
                    <div className={styles.bannerUploadArea}>
                      {bannerPreview ? (
                        <div className={styles.bannerPreviewContainer}>
                          <img src={bannerPreview} alt="Institute Banner" className={styles.bannerPreview} />
                          {isEditing && (
                            <button
                              type="button"
                              className={styles.removeImageBtn}
                              onClick={() => handleRemoveImage('banner')}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`${styles.uploadPlaceholder} ${styles.bannerPlaceholder} ${!isEditing ? styles.disabled : ''}`}
                          onClick={() => isEditing && bannerRef.current?.click()}
                        >
                          {uploading.banner ? (
                            <span className={styles.spinner} />
                          ) : (
                            <>
                              <Upload size={24} />
                              <span>Upload Banner</span>
                            </>
                          )}
                        </div>
                      )}
                      {isEditing && bannerPreview && (
                        <button
                          type="button"
                          className={styles.changeImageBtn}
                          onClick={() => bannerRef.current?.click()}
                          disabled={uploading.banner}
                        >
                          Change Banner
                        </button>
                      )}
                      <input
                        ref={bannerRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Save Profile Button */}
              {isEditing && (
                <div className={styles.actionRow}>
                  <button
                    className={styles.discardBtn}
                    onClick={() => {
                      setIsEditing(false);
                      fetchProfile(); // Reset to original data
                    }}
                  >
                    Discard
                  </button>
                  <button
                    className={styles.saveBtn}
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              )}
            </section>

            {/* Password Management */}
            <section className={styles.cardContainer}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleGroup}>
                  <Lock className={styles.primaryText} size={20} />
                  <h3 className={styles.cardTitle}>Password Management</h3>
                </div>
              </div>
              <div className={styles.cardBody}>

                {/* Update Password Section */}
                <div className={styles.passwordSection}>
                  <button
                    className={styles.primary}
                    onClick={() => {
                      setShowUpdatePassword(true);
                      if (showResetPassword) setShowResetPassword(false);
                    }}
                  >
                    Update Password
                  </button>

                  {showUpdatePassword && (
                    <div className={styles.passwordForm}>
                      <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={() => {
                          setShowUpdatePassword(false);
                          setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        title="Close"
                      >
                        <X size={18} />
                      </button>

                      <h4 className={styles.passwordFormTitle}>Update Password</h4>

                      <div className={styles.passwordFormGrid}>
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Current Password</label>
                          <div className={styles.passwordWrapper}>
                            <input
                              type={showPasswords.old ? 'text' : 'password'}
                              className={styles.inputField}
                              value={passwordData.oldPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                              placeholder="Enter current password"
                            />
                            <button
                              type="button"
                              className={styles.passwordToggle}
                              onClick={() => togglePasswordVisibility('old')}
                            >
                              {showPasswords.old ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>New Password</label>
                          <div className={styles.passwordWrapper}>
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              className={styles.inputField}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                              placeholder="Enter new password"
                            />
                            <button
                              type="button"
                              className={styles.passwordToggle}
                              onClick={() => togglePasswordVisibility('new')}
                            >
                              {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Confirm Password</label>
                          <div className={styles.passwordWrapper}>
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              className={styles.inputField}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              placeholder="Confirm new password"
                            />
                            <button
                              type="button"
                              className={styles.passwordToggle}
                              onClick={() => togglePasswordVisibility('confirm')}
                            >
                              {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        className={styles.primary}
                        onClick={handleUpdatePassword}
                        disabled={saving || !passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      >
                        {saving ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Reset Password Section */}
                <div className={styles.passwordSection}>
                  {!showResetPassword ? (
                    <button
                      className={styles.primary}
                      onClick={() => {
                        setShowResetPassword(true);
                        if (showUpdatePassword) setShowUpdatePassword(false);
                      }}
                    >
                      Reset Password
                    </button>
                  ) : (
                    <div className={styles.passwordForm}>
                      <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={() => {
                          setShowResetPassword(false);
                          setResetStep('none');
                          setResetData(prev => ({ ...prev, otp: '', newPassword: '', confirmPassword: '' }));
                          setOtpSent(false);
                          setOtpVerified(false);
                        }}
                        title="Close"
                      >
                        <X size={18} />
                      </button>

                      <h4 className={styles.passwordFormTitle}>Reset Password</h4>

                      {/* Step Indicator */}
                      <div className={styles.stepIndicator}>
                        <div
                          className={`${styles.stepDot} ${otpSent ? styles.completed : styles.active}`}
                          onClick={() => setResetStep('none')}
                          style={{ cursor: 'pointer' }}
                          title="Send OTP"
                        >
                          {otpSent ? '✓' : '1'}
                        </div>
                        <div className={`${styles.stepConnector} ${otpSent ? styles.active : ''}`}></div>
                        <div
                          className={`${styles.stepDot} ${otpVerified ? styles.completed : ''} ${resetStep === 'otp' ? styles.active : ''}`}
                          onClick={() => otpSent && setResetStep('otp')}
                          style={{ cursor: otpSent ? 'pointer' : 'not-allowed', opacity: otpSent ? 1 : 0.6 }}
                          title={!otpSent ? 'Complete Step 1 first' : 'Verify OTP'}
                        >
                          {otpVerified ? '✓' : '2'}
                        </div>
                        <div className={`${styles.stepConnector} ${otpVerified ? styles.active : ''}`}></div>
                        <div
                          className={`${styles.stepDot} ${resetStep === 'password' ? styles.active : ''}`}
                          onClick={() => otpVerified && setResetStep('password')}
                          style={{ cursor: otpVerified ? 'pointer' : 'not-allowed', opacity: otpVerified ? 1 : 0.6 }}
                          title={!otpVerified ? 'Complete Step 2 first' : 'Set New Password'}
                        >
                          3
                        </div>
                      </div>

                      {/* OTP Sending Step */}
                      {resetStep === 'none' && (
                        <div className={styles.resetButtonGroup}>
                          <div style={{ width: '100%' }}>
                            <div className={styles.noteBox}>
                              <p>📱 <strong>Note:</strong> On clicking "Send OTP", a one-time password will be sent to your registered mobile number.</p>
                            </div>
                            <button
                              className={styles.primary}
                              onClick={handleSendOtp}
                              disabled={saving || otpSent}
                            >
                              {saving ? 'Sending...' : 'Send OTP'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* OTP Verification Step */}
                      {resetStep === 'otp' && (
                        <>

                          <div className={styles.otpStep}>
                            <div className={styles.otpInputGroup}>
                              <label className={styles.inputLabel}>Enter OTP</label>
                              <input
                                type="text"
                                className={styles.inputField}
                                value={resetData.otp}
                                onChange={(e) => setResetData(prev => ({ ...prev, otp: e.target.value }))}
                                placeholder="Enter 6-digit OTP"
                                maxLength={6}
                                disabled={otpVerified}
                              />
                            </div>
                            <button
                              className={`${styles.primary} ${styles.otpVerifyBtn}`}
                              onClick={handleVerifyOtp}
                              disabled={saving || !resetData.otp || otpVerified}
                            >
                              {saving ? 'Verifying...' : 'Verify OTP'}
                            </button>
                          </div>
                        </>
                      )}

                      {/* New Password Step */}
                      {resetStep === 'password' && (
                        <>

                          <div className={styles.passwordFormGrid}>
                            <div className={styles.inputGroup}>
                              <label className={styles.inputLabel}>New Password</label>
                              <div className={styles.passwordWrapper}>
                                <input
                                  type={showPasswords.resetNew ? 'text' : 'password'}
                                  className={styles.inputField}
                                  value={resetData.newPassword}
                                  onChange={(e) => setResetData(prev => ({ ...prev, newPassword: e.target.value }))}
                                  placeholder="Enter new password"
                                />
                                <button
                                  type="button"
                                  className={styles.passwordToggle}
                                  onClick={() => togglePasswordVisibility('resetNew')}
                                >
                                  {showPasswords.resetNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                            </div>

                            <div className={styles.inputGroup}>
                              <label className={styles.inputLabel}>Confirm Password</label>
                              <div className={styles.passwordWrapper}>
                                <input
                                  type={showPasswords.resetConfirm ? 'text' : 'password'}
                                  className={styles.inputField}
                                  value={resetData.confirmPassword}
                                  onChange={(e) => setResetData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                  placeholder="Confirm new password"
                                />
                                <button
                                  type="button"
                                  className={styles.passwordToggle}
                                  onClick={() => togglePasswordVisibility('resetConfirm')}
                                >
                                  {showPasswords.resetConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                            </div>
                          </div>

                          <button
                            className={styles.primary}
                            onClick={handleResetPassword}
                            disabled={saving || !resetData.newPassword || !resetData.confirmPassword}
                          >
                            {saving ? 'Resetting...' : 'Reset Password'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin_Profile;