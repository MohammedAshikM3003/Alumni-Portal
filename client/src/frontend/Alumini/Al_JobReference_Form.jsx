import Sidebar from './Components/Sidebar/Sidebar';
import styles from './Al_JobReference_Form.module.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const Alumini_JobReference_Form = ({ onLogout }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    companyName: '',
    role: '',
    targetBranch: '',
    vacancies: '',
    location: '',
    workMode: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.companyName.trim()) {
      setError('Please enter company name');
      return;
    }
    if (!formData.role.trim()) {
      setError('Please enter role/position');
      return;
    }
    if (!formData.targetBranch.trim()) {
      setError('Please enter target branch/department');
      return;
    }
    if (!formData.vacancies || Number(formData.vacancies) < 1) {
      setError('Please enter a valid number of vacancies');
      return;
    }
    if (!formData.location.trim()) {
      setError('Please enter job location');
      return;
    }
    if (!formData.workMode) {
      setError('Please select mode of work');
      return;
    }

    if (!user?.token) {
      setError('Please login again to continue');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit job reference');
      }

      alert('Job reference submitted successfully!');
      navigate('/alumini/jobreference_history');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>

      {/* Sidebar Navigation (Collapsed State) */}
      <Sidebar onLogout={onLogout} currentView="job_reference_history" />

      {/* Main Content Area */}
      <main className={styles.mainContent}>
          {/* Navigation Back */}
          <div className={styles.backButton} onClick={() => window.history.back()}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </div>

        {/* Centered Form Wrapper */}
        <div className={styles.formWrapper}>
          <div className={styles.formCard}>
            
            {/* Card Header */}
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.formTitle}>Submit Job Reference</h2>
                <p className={styles.formSubtitle}>
                  Provide details about the career opportunity you'd like to share with the alumni community.
                </p>
              </div>
            </div>

            {/* Form Fields Container */}
            <form className={styles.formContent} onSubmit={handleSubmit}>
              {error && <div className={styles.errorMessage}>{error}</div>}

              <div className={styles.inputGrid}>

                {/* Field: Company Name */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    className={styles.inputField}
                    placeholder="e.g. Microsoft"
                    value={formData.companyName}
                    onChange={handleChange}
                    maxLength={200}
                  />
                </div>

                {/* Field: Role / Position */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Role / Position</label>
                  <input
                    type="text"
                    name="role"
                    className={styles.inputField}
                    placeholder="e.g. Senior Software Engineer"
                    value={formData.role}
                    onChange={handleChange}
                    maxLength={200}
                  />
                </div>

                {/* Field: Target Branch */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Target Branch / Department</label>
                  <input
                    type="text"
                    name="targetBranch"
                    className={styles.inputField}
                    placeholder="e.g. IT / CSE / EEE"
                    value={formData.targetBranch}
                    onChange={handleChange}
                    maxLength={200}
                  />
                </div>

                {/* Field: Number of Vacancies */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Number of Vacancies</label>
                  <input
                    type="number"
                    name="vacancies"
                    className={styles.inputField}
                    placeholder="e.g. 5"
                    min="1"
                    value={formData.vacancies}
                    onChange={handleChange}
                  />
                </div>

                {/* Field: Location */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Job Location</label>
                  <input
                    type="text"
                    name="location"
                    className={styles.inputField}
                    placeholder="e.g. Salem / Chennai / Banglore"
                    value={formData.location}
                    onChange={handleChange}
                    maxLength={200}
                  />
                </div>

                {/* Field: Job Type */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Mode of Work</label>
                  <select
                    name="workMode"
                    className={styles.inputField}
                    value={formData.workMode}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Select mode of work</option>
                    <option value="offline">Offline</option>
                    <option value="online">Online</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

              </div>

              {/* Submit Button */}
              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                <span className="material-symbols-outlined">send</span>
                {isSubmitting ? 'Submitting...' : 'Submit Job Reference'}
              </button>
            </form>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Alumini_JobReference_Form;