import { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, User, Book, ShieldCheck } from 'lucide-react';
import styles from './AD_Add_Faculty.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const Admin_Edit_Faculty = ({ onLogout }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    location: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: '',

    // Professional Information
    designation: '',
    status: 'Active',
    department: '',
    staffId: '',
    dateOfJoining: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch coordinator details on mount
  useEffect(() => {
    const fetchCoordinator = async () => {
      if (!id || !user?.token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/coordinators/${id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch coordinator details');
        }

        const data = await response.json();

        if (data.success && data.coordinator) {
          const coord = data.coordinator;
          setFormData({
            name: coord.name || '',
            email: coord.email || '',
            phone: coord.phone || '',
            location: coord.location || '',
            dateOfBirth: coord.personalInfo?.dob ? coord.personalInfo.dob.split('T')[0] : '',
            gender: coord.personalInfo?.gender || '',
            bloodGroup: coord.personalInfo?.bloodGroup || '',
            address: coord.personalInfo?.address || '',
            designation: coord.designation || '',
            status: coord.status || 'Active',
            department: coord.department || '',
            staffId: coord.staffId || '',
            dateOfJoining: coord.joinDate ? coord.joinDate.split('T')[0] : '',
          });
        } else {
          setSubmitError('Coordinator not found');
        }
      } catch (err) {
        console.error('Error fetching coordinator:', err);
        setSubmitError(err.message || 'Error loading coordinator data');
      } finally {
        setLoading(false);
      }
    };

    fetchCoordinator();
  }, [id, user?.token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Clear success message when editing
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.designation) newErrors.designation = 'Designation is required';
    if (!formData.staffId.trim()) newErrors.staffId = 'Staff ID is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!user?.token) {
      setSubmitError('Please login to update coordinator');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSuccessMessage('');

    try {
      // Prepare data for coordinator update
      const coordinatorData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        designation: formData.designation,
        status: formData.status,
        department: formData.department,
        staffId: formData.staffId,
        joinDate: formData.dateOfJoining ? new Date(formData.dateOfJoining).toISOString() : new Date().toISOString(),
        personalInfo: {
          dob: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
          gender: formData.gender || null,
          bloodGroup: formData.bloodGroup || null,
          address: formData.address || null,
        },
      };

      const response = await fetch(`${API_BASE}/api/coordinators/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(coordinatorData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Coordinator updated successfully!');
        setTimeout(() => {
          navigate(`/admin/department/view_faculty/${id}`);
        }, 1500);
      } else {
        setSubmitError(data.message || 'Failed to update coordinator');
      }
    } catch (err) {
      setSubmitError('Error updating coordinator');
      console.error('Error updating coordinator:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      navigate(`/admin/department/view_faculty/${id}`);
    }
  };

  const handleBack = () => {
    navigate(`/admin/department/view_faculty/${id}`);
  };

  if (loading) {
    return (
      <div className={styles.dashboardWrapper}>
        <Sidebar onLogout={onLogout} currentView={'department'} />
        <main className={styles.mainContent}>
          <div className={styles.dashboardContent}>
            <p>Loading coordinator details...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.dashboardWrapper}>
      <Sidebar onLogout={onLogout} currentView={'department'} />

      <main className={styles.mainContent}>
        <div className={styles.dashboardContent}>

          {/* Page Header */}
          <div className={styles.pageHeader}>
            <button className={styles.backBtn} onClick={handleBack}>
              <ArrowLeft size={16} /> Back to Coordinator Profile
            </button>
            <div className={styles.headerContent}>
              <h1 className={styles.pageTitle}>Edit Coordinator Profile</h1>
              <p className={styles.pageSubtitle}>{formData.designation || 'Coordinator'}</p>
            </div>
          </div>

          {/* Edit Coordinator Form */}
          <div className={styles.formCard}>
            <form onSubmit={handleSubmit} className={styles.coordinatorForm}>

              {/* Personal Information Section */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <User className={styles.sectionIcon} size={20} />
                  <h3>Personal Information</h3>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.name ? styles.inputError : ''}`}
                      placeholder="Enter full name"
                    />
                    {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.email ? styles.inputError : ''}`}
                      placeholder="e.g. coordinator@ksrce.ac.in"
                    />
                    {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.phone ? styles.inputError : ''}`}
                      placeholder="+91 98765 43210"
                    />
                    {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Location *</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.location ? styles.inputError : ''}`}
                      placeholder="e.g. Coimbatore, Tamil Nadu"
                    />
                    {errors.location && <span className={styles.errorText}>{errors.location}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className={styles.formInput}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Blood Group</label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleInputChange}
                      className={styles.formInput}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={styles.formTextarea}
                      placeholder="Enter residential address"
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information Section */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <Book className={styles.sectionIcon} size={20} />
                  <h3>Professional Information</h3>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Designation *</label>
                    <select
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.designation ? styles.inputError : ''}`}
                    >
                      <option value="">Select Designation</option>
                      <option value="HOD & Professor">HOD & Professor</option>
                      <option value="Professor">Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Lab Administrator">Lab Administrator</option>
                    </select>
                    {errors.designation && <span className={styles.errorText}>{errors.designation}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className={styles.formInput}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="Department"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Staff ID *</label>
                    <input
                      type="text"
                      name="staffId"
                      value={formData.staffId}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.staffId ? styles.inputError : ''}`}
                      placeholder="Enter unique staff ID"
                    />
                    {errors.staffId && <span className={styles.errorText}>{errors.staffId}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Date of Joining</label>
                    <input
                      type="date"
                      name="dateOfJoining"
                      value={formData.dateOfJoining}
                      onChange={handleInputChange}
                      className={styles.formInput}
                    />
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className={styles.successMessage}>
                  ✓ {successMessage}
                </div>
              )}

              {/* Error Display */}
              {submitError && (
                <div className={styles.errorMessage}>
                  {submitError}
                </div>
              )}

              {/* Form Actions */}
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  <X size={20} />
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  <Save size={20} />
                  {submitting ? 'Updating...' : 'Update Coordinator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin_Edit_Faculty;
