import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Al_JobReference_History.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const mapStatus = (status) => {
  switch (status) {
    case 'approved': return 'ACTIVE';
    case 'pending': return 'PENDING';
    case 'rejected': return 'CLOSED';
    default: return 'PENDING';
  }
};

const getIconForRole = (role, index) => {
  const icons = ['work_outline', 'person_search', 'school', 'terminal', 'account_tree', 'support_agent', 'security', 'campaign'];
  const iconClasses = [styles.iconBlue, styles.iconPurple, styles.iconPurpleAlt, styles.iconTeal, styles.iconPink, styles.iconLightBlue, styles.iconGreen, styles.iconOrange];

  return {
    icon: icons[index % icons.length],
    iconClass: iconClasses[index % iconClasses.length]
  };
};

const Alumini_JobReference_History = ({ onLogout }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [jobsData, setJobsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobReferences = async () => {
      if (!user?.token) {
        setError('Please login to view job references');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/jobs/my`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch job references');
        }

        const data = await response.json();

        if (data.success && data.jobReferences) {
          const formattedData = data.jobReferences.map((job, index) => {
            const { icon, iconClass } = getIconForRole(job.role, index);
            return {
              id: job._id,
              title: job.role,
              company: job.companyName,
              date: formatDate(job.createdAt),
              status: mapStatus(job.status),
              icon,
              iconClass,
              targetBranch: job.targetBranch,
              vacancies: job.vacancies,
              location: job.location,
              workMode: job.workMode,
            };
          });

          setJobsData(formattedData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobReferences();
  }, [user]);

  const toggleCardMenu = (id, event) => {
    event.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to remove this job reference?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete job reference');
      }

      // Remove the job from the local state
      setJobsData(prevJobs => prevJobs.filter(job => job.id !== jobId));
      setActiveMenuId(null);
      alert('Job reference removed successfully');
    } catch (err) {
      alert(err.message);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView="job_reference_history" />
        <main className={styles.mainContent}>
          <div className={styles.loadingState}>Loading job references...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView="job_reference_history" />
        <main className={styles.mainContent}>
          <div className={styles.errorState}>{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>

      {/* Sidebar Navigation (Collapsed State as per image) */}
      <Sidebar onLogout={onLogout} currentView="job_reference_history" />

      {/* Main Content Area */}
      <main className={styles.mainContent}>

        {/* Page Header */}
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>Job & Reference History</h1>
          <p className={styles.pageSubtitle}>
            Manage your professional references and job postings.
          </p>
        </header>

        {/* Jobs Grid */}
        <div className={styles.jobsGrid} ref={menuRef}>
          
          {/* Post New Job Card (Dashed Border) */}
          <div className={`${styles.jobCard} ${styles.postNewCard}`} onClick={() => { navigate('/alumini/JobReference_History/JobReference_Form') }} >
            <div className={styles.addIconContainer}>
              <span className="material-symbols-outlined">add</span>
            </div>
            <h3 className={styles.postTitle}>Post Job or Reference</h3>
            <p className={styles.postSubtitle}>Share new opportunities with the network</p>
          </div>

          {/* Render Job Cards */}
          {jobsData.length > 0 ? (
            jobsData.map((job) => (
              <div key={job.id} className={styles.jobCard}>

                {/* Card Header (Icon + Menu) */}
                <div className={styles.cardHeader}>
                  <div className={`${styles.jobIcon} ${job.iconClass}`}>
                    <span className="material-symbols-outlined">{job.icon}</span>
                  </div>

                  <div className={styles.menuContainer}>
                    <button
                      className={`${styles.moreBtn} ${activeMenuId === job.id ? styles.moreBtnActive : ''}`}
                      onClick={(e) => toggleCardMenu(job.id, e)}
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenuId === job.id && (
                      <div className={styles.dropdownMenu}>
                        <button className={styles.dropdownItem} onClick={() => handleDelete(job.id)}>
                          <span className="material-symbols-outlined">delete</span>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body (Title & Company) */}
                <div className={styles.cardBody}>
                  <h3 className={styles.jobTitle}>{job.title}</h3>
                  <p className={styles.companyName}>{job.company}</p>
                </div>

                {/* Card Footer (Status & Date) */}
                <div className={styles.cardFooter}>
                  <span className={`${styles.statusBadge} ${styles[`status${job.status}`]}`}>
                    {job.status}
                  </span>
                  <span className={styles.jobDate}>{job.date}</span>
                </div>

              </div>
            ))
          ) : (
            <div className={styles.emptyStateCard}>
              <p>No job references yet. Post your first opportunity!</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Alumini_JobReference_History;