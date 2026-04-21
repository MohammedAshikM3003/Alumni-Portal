import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './AD_View_Job_and_Reference.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from '../Coordinator/Components/BackButton/Back';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const Admin_View_Job_and_Reference = ({ onLogout }) => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobReference, setJobReference] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getBorderClassByStatus = (status) => {
    switch (status) {
      case 'approved':
        return styles.borderGreen;
      case 'rejected':
        return styles.borderRed;
      default:
        return styles.borderGrey;
    }
  };

  useEffect(() => {
    const fetchJobReference = async () => {
      if (!user?.token) {
        setError('Please login to view job reference');
        setLoading(false);
        return;
      }

      if (!id) {
        setError('Job reference ID not provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/jobs/${id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch job reference');
        }

        const data = await response.json();
        if (data.success && data.jobReference) {
          setJobReference(data.jobReference);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobReference();
  }, [user, id]);

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'job_and_reference'} />
        <main className={styles.mainContent}>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-500">Loading job reference...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !jobReference) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'job_and_reference'} />
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-red-500">{error || 'Job reference not found'}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>

      {/* Sidebar */}
      <Sidebar onLogout={onLogout} currentView={'job_and_reference'} />

      {/* Main Content */}
      <main className={styles.mainContent}>

        {/* Back Button Header */}
        <div className={styles.backBtn}>
          <Back to={'/admin/job_and_reference'} />
        </div>
        <div className={styles.contentWrapper}>
          {/* Form Card */}
          <div className={`${styles.formCard} ${getBorderClassByStatus(jobReference.status)}`}>
            <div className={styles.formHeader}>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={styles.formTitle}>Job Reference Details</h2>
                  <p className={styles.formSubtitle}>Submitted {formatDate(jobReference.createdAt)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${jobReference.status === 'approved' ? 'bg-green-100 text-green-700' : jobReference.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {jobReference.status}
                </span>
              </div>
            </div>

            {/* Alumni Profile Section */}
            <div className={styles.alumniSection}>
              <div className={styles.alumniCard}>
                <div>
                  {jobReference.submittedBy?.profilePhoto && (
                    <img
                      src={jobReference.submittedBy.profilePhoto}
                      alt={jobReference.submittedBy?.name}
                      className={styles.alumniPhoto}
                    />
                  )}
                  {!jobReference.submittedBy?.profilePhoto && (
                    <div className={styles.alumniPhotoPlaceholder}>
                      {jobReference.submittedBy?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
                </div>
                <div className={styles.alumniInfo}>
                  <h3 className={styles.alumniName}>{jobReference.submittedBy?.name || 'Unknown'}</h3>
                  <p className={styles.alumniRole}>{jobReference.submittedBy?.jobRole || 'Not specified'}</p>
                  <a
                    href={`/admin/alumni/${jobReference.submittedBy?._id}`}
                    className={styles.viewAlumniLink}
                  >
                    View Alumni
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.form}>
              <div className={styles.formGrid}>
                {/* Company Name */}
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Company Name</label>
                  <div className={styles.formInput} style={{ backgroundColor: '#f8fafc', border: 'none' }}>
                    {jobReference.companyName}
                  </div>
                </div>

                {/* Role / Position */}
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Role / Position</label>
                  <div className={styles.formInput} style={{ backgroundColor: '#f8fafc', border: 'none' }}>
                    {jobReference.role}
                  </div>
                </div>

                {/* Target Branch */}
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Target Branch / Department</label>
                  <div className={styles.formInput} style={{ backgroundColor: '#f8fafc', border: 'none' }}>
                    {jobReference.targetBranch}
                  </div>
                </div>

                {/* Number of Vacancies */}
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Number of Vacancies</label>
                  <div className={styles.formInput} style={{ backgroundColor: '#f8fafc', border: 'none' }}>
                    {String(jobReference.vacancies).padStart(2, '0')}
                  </div>
                </div>

                {/* Job Location */}
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Job Location</label>
                  <div className={styles.formInput} style={{ backgroundColor: '#f8fafc', border: 'none' }}>
                    {jobReference.location}
                  </div>
                </div>

                {/* Mode of Work */}
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Mode of Work</label>
                  <div className={styles.formInput} style={{ backgroundColor: '#f8fafc', border: 'none', textTransform: 'capitalize' }}>
                    {jobReference.workMode}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
};

export default Admin_View_Job_and_Reference;
