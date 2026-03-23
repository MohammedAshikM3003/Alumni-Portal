import { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, User, Book, ShieldCheck } from 'lucide-react';
import styles from './AD_Add_Faculty.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const Admin_Add_Faculty = ({ onLogout }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deptCode } = useParams();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

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
    dateOfJoining: today,

    // Security
    userId: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [departmentName, setDepartmentName] = useState('');

  // Fetch department details to get the department name
  useEffect(() => {
    const fetchDepartment = async () => {
      if (!deptCode || !user?.token) return;

      try {
        const response = await fetch(`${API_BASE}/api/departments/code/${deptCode}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.department) {
            setDepartmentName(data.department.branch);
            setFormData(prev => ({ ...prev, department: data.department.deptCode }));
          }
        }
      } catch (error) {
        console.error('Error fetching department:', error);
      }
    };

    fetchDepartment();
  }, [deptCode, user?.token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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
    if (!formData.userId.trim()) newErrors.userId = 'User ID is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.confirmPassword !== formData.password) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.dateOfJoining.trim()) newErrors.dateOfJoining = 'Date of joining is required';

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
      setSubmitError('Please login to add coordinators');
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      // Prepare data for coordinator creation
      const coordinatorData = {
        // User authentication details
        userId: formData.userId.trim(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,

        // Coordinator details
        staffId: formData.staffId.trim(),
        designation: formData.designation,
        department: formData.department,
        roles: ['coordinator'],
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        status: formData.status || 'Active',
        joinDate: formData.dateOfJoining ? new Date(formData.dateOfJoining).toISOString() : new Date().toISOString(),
        personalInfo: {
          dob: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
          gender: formData.gender || null,
          bloodGroup: formData.bloodGroup || null,
          address: formData.address ? formData.address.trim() : null,
        },
        education: [],
        experience: '',
        publications: 0,
        patents: 0,
      };

      console.log('Sending coordinator data:', coordinatorData);

      const response = await fetch(`${API_BASE}/api/coordinators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(coordinatorData),
      });

      const data = await response.json();

      console.log('Response:', response.status, data);

      if (response.ok && data.success) {
        alert('Coordinator added successfully!');
        navigate('/admin/department');
      } else {
        setSubmitError(data.message || 'Failed to create coordinator. Please check all fields and try again.');
      }
    } catch (err) {
      setSubmitError('Error creating coordinator: ' + err.message);
      console.error('Error creating coordinator:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      if (deptCode) {
        navigate(`/admin/department/view_department/${deptCode}`);
      } else {
        navigate('/admin/department');
      }
    }
  };

  const handleBack = () => {
    if (deptCode) {
      navigate(`/admin/department/view_department/${deptCode}`);
    } else {
      navigate('/admin/department');
    }
  };

  return (
    <div className={styles.dashboardWrapper}>
      <Sidebar onLogout={onLogout} currentView={'department'} />

      <main className={styles.mainContent}>
        <div className={styles.dashboardContent}>

          {/* Page Header */}
          <div className={styles.pageHeader}>
            <button className={styles.backBtn} onClick={handleBack}>
              <ArrowLeft size={16} /> Back to Department
            </button>
            <div className={styles.headerContent}>
              <h1 className={styles.pageTitle}>Add New Coordinator</h1>
              <p className={styles.pageSubtitle}>Computer Science and Engineering Department</p>
            </div>
          </div>

          {/* Add Coordinator Form */}
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
                      value={departmentName}
                      className={styles.formInput}
                      readOnly
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

              {/* Security Section */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <ShieldCheck className={styles.sectionIcon} size={20} />
                  <h3>Security</h3>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>User ID *</label>
                    <input
                      type="text"
                      name="userId"
                      value={formData.userId}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.userId ? styles.inputError : ''}`}
                      placeholder="Enter login user ID"
                    />
                    {errors.userId && <span className={styles.errorText}>{errors.userId}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.password ? styles.inputError : ''}`}
                      placeholder="Min. 8 characters"
                    />
                    {errors.password && <span className={styles.errorText}>{errors.password}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.confirmPassword ? styles.inputError : ''}`}
                      placeholder="Re-enter password"
                    />
                    {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
                  </div>
                </div>
              </div>

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
                  disabled={loading}
                >
                  <X size={20} />
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  <Save size={20} />
                  {loading ? 'Saving...' : 'Save Coordinator'}
                </button>
                </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin_Add_Faculty;