import Sidebar from './Components/Sidebar/Sidebar';
import styles from './Al_JobReference_Form.module.css';
import './scrollbar.js';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

interface JobFormData {
  companyName: string;
  role: string;
  targetBranch: string;
  vacancies: string;
  location: string;
  workMode: string;
  applicationLink: string;
}

interface AluminiJobReferenceFormProps {
  onLogout?: () => void;
}

const Alumini_JobReference_Form = ({ onLogout }: AluminiJobReferenceFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [roles, setRoles] = useState<string[]>(['']);
  const [formData, setFormData] = useState<JobFormData>({
    companyName: '',
    role: '',
    targetBranch: '',
    vacancies: '',
    location: '',
    workMode: '',
    applicationLink: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleAddRole = () => {
    setRoles(prev => [...prev, '']);
    setError('');
  };

  const handleRoleChange = (index: number, value: string) => {
    setRoles(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
    setError('');
  };

  const handleRemoveRole = (index: number) => {
    setRoles(prev => prev.filter((_, i) => i !== index));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.companyName.trim()) {
      setError('Please enter company name');
      return;
    }
    const combinedRoles = roles.map(r => r.trim()).filter(Boolean).join(', ');
    if (!combinedRoles) {
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
      const payload = {
        ...formData,
        role: combinedRoles,
      };

      const response = await fetch(`${API_BASE}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit job reference');
      }

      alert('Job reference submitted successfully!');
      navigate('/alumini/jobreference_history');
    } catch (err: any) {
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
        {/* Centered Form Wrapper */}
        <div className={styles.formWrapper}>
          {/* Navigation Back */}
          <div className={styles.backButton} onClick={() => window.history.back()}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </div>
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
                  <div className={styles.rolesContainer}>
                    {roles.map((roleVal, index) => (
                      <div key={index} className={styles.roleInputRow}>
                        <input
                          type="text"
                          className={styles.inputField}
                          placeholder={index === 0 ? "e.g. Senior Software Engineer" : `e.g. Role / Position ${index + 1}`}
                          value={roleVal}
                          onChange={(e) => handleRoleChange(index, e.target.value)}
                          maxLength={200}
                        />
                        {index === 0 ? (
                          <button
                            type="button"
                            className={styles.addRoleBtn}
                            onClick={handleAddRole}
                            title="Add another role field"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                            Add Role
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.removeRoleBtn}
                            onClick={() => handleRemoveRole(index)}
                            title="Remove this role field"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
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

                {/* Field: Application Link */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Application Link</label>
                  <input
                    type="url"
                    name="applicationLink"
                    className={styles.inputField}
                    placeholder="e.g. https://careers.company.com/job/123"
                    value={formData.applicationLink}
                    onChange={handleChange}
                  />
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