import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AD_Job_and_Reference.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';
import { Trash2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL;

interface JobReference {
  _id: string;
  companyName: string;
  role: string;
}

const Admin_Job_and_Reference = ({ onLogout }: { onLogout?: () => void }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobsData, setJobsData] = useState<JobReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchJobReferences = async () => {
      if (!user?.token) {
        setError('Please login to view job references');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/jobs/all`, {
            signal: controller.signal,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch job references');
        }

        const data = await response.json();
        if (data.success && data.jobReferences) {
          setJobsData(data.jobReferences);
        }
      } catch (err: any) {
          if (err.name === 'AbortError') return;
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobReferences();

    return () => controller.abort();
  }, [user]);

  const filteredJobs = jobsData.filter(job =>
    job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_BASE}/api/jobs/all`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job references');
      }

      const data = await response.json();
      if (data.success && data.jobReferences) {
        setJobsData(data.jobReferences);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job reference? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete job reference');
      }

      const data = await response.json();
      if (data.success) {
        setJobsData(jobsData.filter(job => job._id !== jobId));
      } else {
        setError(data.message || 'Failed to delete job reference');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'CO';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className={styles.pageLayout}>
        <Sidebar onLogout={onLogout} currentView={'job_and_reference'} />
        <main className={styles.mainContent}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#64748b' }}>Loading job references...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageLayout}>
        <Sidebar onLogout={onLogout} currentView={'job_and_reference'} />
        <main className={styles.mainContent}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#ef4444' }}>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageLayout}>
      <Sidebar onLogout={onLogout} currentView={'job_and_reference'} />
      <main className={styles.mainContent}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Job & Reference</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>search</span>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    paddingLeft: '2.5rem',
                    paddingRight: '1rem',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem',
                    width: '18rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    fontSize: '0.875rem'
                  }}
                  onFocus={(e: React.FocusEvent<HTMLInputElement>) => (e.target as HTMLInputElement).style.borderColor = '#228B22'}
                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => (e.target as HTMLInputElement).style.borderColor = '#e2e8f0'}
                />
              </div>
              <button className={styles.refreshBtn} onClick={handleRefresh} disabled={refreshing}>
                <span className={`material-symbols-outlined ${refreshing ? styles.refreshIconSpin : ''}`}>refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', paddingBottom: '2rem' }}>
            {filteredJobs.map((job) => (
              <div key={job._id} className={styles.jobCard}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                  {/* Circular Avatar */}
                  <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e40af', fontWeight: 'bold', fontSize: '1.25rem', border: '2px solid #f1f5f9' }}>
                      {getInitials(job.companyName)}
                    </div>
                  </div>

                  {/* Company & Role Info */}
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0.5rem 0 0.25rem 0' }}>{job.companyName}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, margin: 0 }}>{job.role}</p>

                  {/* View Details Button */}
                  <button
                    onClick={() => navigate(`/admin/view_job_and_reference/${job._id}`)}
                    style={{
                      width: '100%',
                      marginTop: '1rem',
                      padding: '0.625rem',
                      background: '#228B22',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget as HTMLButtonElement).style.background = '#1a6b1a'}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget as HTMLButtonElement).style.background = '#228B22'}
                  >
                    View Details
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(job._id)}
                    style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      background: 'white',
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      borderRadius: '0.5rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      (e.currentTarget as HTMLButtonElement).style.background = '#ef4444';
                      (e.currentTarget as HTMLButtonElement).style.color = 'white';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'white';
                      (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
                    }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: 'white', padding: '2.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '0.75rem', display: 'block' }}>work</span>
            <p style={{ color: '#64748b' }}>No job references found.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin_Job_and_Reference;
