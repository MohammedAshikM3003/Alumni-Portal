import { useState } from 'react';
import { ArrowLeft, Save, X, User, Book } from 'lucide-react';
import styles from './AD_Add_Faculty.module.css';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';

const Admin_Edit_Faculty = ({ onLogout }) => {
  const navigate = useNavigate();

  // Pre-filled with existing faculty data
  const [formData, setFormData] = useState({
    name: 'Dr. Vadin Santhiya G',
    email: 'hod.cse@ksrce.ac.in',
    phone: '+91 98765 43210',
    location: 'Coimbatore, Tamil Nadu',
    dateOfBirth: '1980-05-15',
    gender: 'Female',
    bloodGroup: 'O+',
    address: '123, Faculty Quarters, KSRCE Campus, Tiruchengode - 637215',
    designation: 'HOD & Professor',
    status: 'Active',
    department: 'Computer Science and Engineering',
    staffId: 'FAC-2045',
    dateOfJoining: '2015-08-12'
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.designation) newErrors.designation = 'Designation is required';
    if (!formData.staffId.trim()) newErrors.staffId = 'Staff ID is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      alert('Faculty profile updated successfully!');
      navigate('/admin/department/view_faculty');
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      navigate('/admin/department/view_faculty');
    }
  };

  const handleBack = () => {
    navigate('/admin/department/view_faculty');
  };

  return (
    <div className={styles.dashboardWrapper}>
      <Sidebar onLogout={onLogout} currentView={'department'} />

      <main className={styles.mainContent}>
        <div className={styles.dashboardContent}>

          {/* Page Header */}
          <div className={styles.pageHeader}>
            <button className={styles.backBtn} onClick={handleBack}>
              <ArrowLeft size={16} /> Back to Faculty Profile
            </button>
            <div className={styles.headerContent}>
              <h1 className={styles.pageTitle}>Edit Faculty Profile</h1>
              <p className={styles.pageSubtitle}>Computer Science and Engineering Department</p>
            </div>
          </div>

          {/* Edit Faculty Form */}
          <div className={styles.formCard}>
            <form onSubmit={handleSubmit} className={styles.facultyForm}>

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
                      placeholder="e.g. faculty@ksrce.ac.in"
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

              {/* Form Actions */}
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
                  <X size={20} />
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  <Save size={20} />
                  Update Faculty
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
