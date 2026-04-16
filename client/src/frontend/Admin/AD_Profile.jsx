import { useState, useEffect, useRef } from 'react';
import { User, Lock, Eye, EyeOff, ChevronDown, ChevronUp, Camera, Building2, Upload, X } from 'lucide-react';
import styles from './AD_Profile.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

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
      banner: null,
      name: '',
      address: '',
      mobile: ''
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
  const [resetStep, setResetStep] = useState('mobile'); // mobile, otp, password
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Messages
  const [message, setMessage] = useState({ type: '', text: '' });

  // Same address checkbox
  const [sameAsPresent, setSameAsPresent] = useState(false);

  // Get user from auth context (stored in cookies)
  const { user, loading: authLoading } = useAuth();

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

      // Step 1: Delete old images that were replaced
      await deleteReplacedImages();

      // Step 2: Save profile with new image IDs
      const response = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
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
          profilePhoto: profileData.profilePhoto,
          logo: profileData.instituteDetails?.logo,
          banner: profileData.instituteDetails?.banner
        });

        showMessage('success', 'Profile updated successfully');
        setIsEditing(false);

        // Reload page after 1 second to refresh all data and images
        setTimeout(() => {
          window.location.reload();
        }, 1000);
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
        body: JSON.stringify({ otp: resetData.otp })
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
        setResetStep('mobile');
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
  const deleteReplacedImages = async () => {
    const imagesToDelete = [];

    // Check profilePhoto
    if (previousImages.profilePhoto && previousImages.profilePhoto !== profileData.profilePhoto) {
      imagesToDelete.push(previousImages.profilePhoto);
    }

    // Check logo
    if (previousImages.logo && previousImages.logo !== profileData.instituteDetails?.logo) {
      imagesToDelete.push(previousImages.logo);
    }

    // Check banner
    if (previousImages.banner && previousImages.banner !== profileData.instituteDetails?.banner) {
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
  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setProfilePhotoPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload and get ID
    const imageId = await handleImageUpload(file, 'profilePhoto');
    if (imageId) {
      setProfileData(prev => ({ ...prev, profilePhoto: imageId }));
      showMessage('success', 'Profile photo uploaded');
    }
  };

  // Handle logo change
  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target.result);
    reader.readAsDataURL(file);

    const imageId = await handleImageUpload(file, 'instituteLogo');
    if (imageId) {
      setProfileData(prev => ({
        ...prev,
        instituteDetails: { ...prev.instituteDetails, logo: imageId }
      }));
      showMessage('success', 'Logo uploaded');
    }
  };

  // Handle banner change
  const handleBannerChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setBannerPreview(e.target.result);
    reader.readAsDataURL(file);

    const imageId = await handleImageUpload(file, 'instituteBanner');
    if (imageId) {
      setProfileData(prev => ({
        ...prev,
        instituteDetails: { ...prev.instituteDetails, banner: imageId }
      }));
      showMessage('success', 'Banner uploaded');
    }
  };

  // Remove image
  const handleRemoveImage = async (type) => {
    let imageId = null;

    if (type === 'profilePhoto') {
      imageId = profileData.profilePhoto;
    } else if (type === 'logo') {
      imageId = profileData.instituteDetails?.logo;
    } else if (type === 'banner') {
      imageId = profileData.instituteDetails?.banner;
    }

    // Delete from GridFS if exists
    if (imageId) {
      try {
        await fetch(`${API_BASE_URL}/api/images/${imageId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${user?.token}` }
        });
      } catch (error) {
        console.error(`Error deleting image:`, error);
      }
    }

    // Then clear from state
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
                <button
                  className={styles.editBtn}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
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
              <div className={styles.cardBody}>
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

                {/* Institute Text Fields */}
                <div className={styles.inputGrid}>
                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label className={styles.inputLabel}>Institute Name</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={profileData.instituteDetails?.name || ''}
                      onChange={(e) => handleInstituteChange('name', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter institute name"
                    />
                  </div>

                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label className={styles.inputLabel}>Institute Address</label>
                    <textarea
                      className={`${styles.inputField} ${styles.textArea}`}
                      value={profileData.instituteDetails?.address || ''}
                      onChange={(e) => handleInstituteChange('address', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter institute address"
                      rows={3}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Institute Mobile</label>
                    <input
                      type="tel"
                      className={styles.inputField}
                      value={profileData.instituteDetails?.mobile || ''}
                      onChange={(e) => handleInstituteChange('mobile', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter institute mobile number"
                    />
                  </div>
                </div>
              </div>
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

                {/* Update Password Dropdown */}
                <div className={styles.passwordSection}>
                  <button
                    className={styles.dropdownButton}
                    onClick={() => {
                      setShowUpdatePassword(!showUpdatePassword);
                      if (showResetPassword) setShowResetPassword(false);
                    }}
                  >
                    <span>Update Password</span>
                    {showUpdatePassword ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {showUpdatePassword && (
                    <div className={styles.passwordForm}>
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
                        <label className={styles.inputLabel}>Confirm New Password</label>
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

                      <button
                        className={styles.primary}
                        onClick={handleUpdatePassword}
                        disabled={saving}
                      >
                        {saving ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Reset Password Dropdown */}
                <div className={styles.passwordSection}>
                  <button
                    className={styles.dropdownButton}
                    onClick={() => {
                      setShowResetPassword(!showResetPassword);
                      if (showUpdatePassword) setShowUpdatePassword(false);
                    }}
                  >
                    <span>Reset Password</span>
                    {showResetPassword ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {showResetPassword && (
                    <div className={styles.passwordForm}>

                      {/* Mobile Input Step */}
                      {resetStep === 'mobile' && (
                        <div className={styles.resetStep}>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Mobile Number</label>
                            <input
                              type="tel"
                              className={styles.inputField}
                              value={resetData.mobile}
                              onChange={(e) => setResetData(prev => ({ ...prev, mobile: e.target.value }))}
                              placeholder="Enter registered mobile number"
                            />
                          </div>
                          <button
                            className={styles.primary}
                            onClick={handleSendOtp}
                            disabled={saving || !resetData.mobile}
                          >
                            {saving ? 'Sending...' : 'Send OTP'}
                          </button>
                        </div>
                      )}

                      {/* OTP Verification Step */}
                      {resetStep === 'otp' && (
                        <div className={styles.resetStep}>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Enter OTP</label>
                            <input
                              type="text"
                              className={styles.inputField}
                              value={resetData.otp}
                              onChange={(e) => setResetData(prev => ({ ...prev, otp: e.target.value }))}
                              placeholder="Enter 6-digit OTP"
                              maxLength={6}
                            />
                          </div>
                          <button
                            className={styles.primary}
                            onClick={handleVerifyOtp}
                            disabled={saving || !resetData.otp}
                          >
                            {saving ? 'Verifying...' : 'Verify OTP'}
                          </button>
                        </div>
                      )}

                      {/* New Password Step */}
                      {resetStep === 'password' && (
                        <div className={styles.resetStep}>
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
                            <label className={styles.inputLabel}>Confirm New Password</label>
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

                          <button
                            className={styles.primary}
                            onClick={handleResetPassword}
                            disabled={saving || !resetData.newPassword || !resetData.confirmPassword}
                          >
                            {saving ? 'Resetting...' : 'Reset Password'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

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

          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin_Profile;