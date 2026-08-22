import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styles from './AD_View_Job_and_Reference.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from '../Coordinator/Components/BackButton/Back';
import { useAuth } from '../../context/authContext/authContext';
import { Trash2 } from 'lucide-react';
import { formatBranchName } from '../../utils/formatters';

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

interface JobReferenceDetail {
  _id: string;
  status: string;
  createdAt: string;
  companyName: string;
  role: string;
  targetBranch: string;
  vacancies: number;
  location: string;
  workMode: string;
  approvedBy?: any;
  approvedByName?: string;
  rejectedBy?: any;
  rejectedByName?: string;
  submittedBy?: {
    _id: string;
    name: string;
    jobRole?: string;
    profilePhoto?: string;
  };
}

interface CoordinatorItem {
  _id: string;
  name: string;
  department?: string;
  staffId?: string;
  userId?: any;
}

const Admin_View_Job_and_Reference = ({ onLogout }: { onLogout?: () => void }) => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobReference, setJobReference] = useState<JobReferenceDetail | null>(null);
  const [coordinatorsList, setCoordinatorsList] = useState<CoordinatorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getBorderClassByStatus = (status: string | undefined) => {
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
    const controller = new AbortController();
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
        const [jobRes, coordRes] = await Promise.all([
          fetch(`${API_BASE}/api/jobs/${id}`, {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }),
          fetch(`${API_BASE}/api/coordinators/all`, {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }).catch(() => null)
        ]);

        if (!jobRes.ok) {
          throw new Error('Failed to fetch job reference');
        }

        const data = await jobRes.json();
        if (data.success && data.jobReference) {
          setJobReference(data.jobReference);
        }

        if (coordRes && coordRes.ok) {
          const coordData = await coordRes.json();
          if (coordData.success && coordData.coordinators) {
            setCoordinatorsList(coordData.coordinators);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobReference();

    return () => controller.abort();
  }, [user, id]);

  const isPlaceholderName = (name?: string) => {
    if (!name) return true;
    const n = name.trim().toLowerCase();
    return n === 'coordinator' || /^coordinator[-_ ]?\d*$/i.test(n);
  };

  const getCoordinatorName = (job: JobReferenceDetail, type: 'approved' | 'rejected') => {
    const directName = type === 'approved' ? job.approvedByName : job.rejectedByName;
    const directUser = type === 'approved' ? job.approvedBy : job.rejectedBy;

    if (directName && !isPlaceholderName(directName)) {
      return directName;
    }
    if (typeof directUser === 'object' && directUser?.name && !isPlaceholderName(directUser.name)) {
      return directUser.name;
    }
    if (directUser && typeof directUser === 'string') {
      const found = coordinatorsList.find(c => 
        (c._id === directUser || 
        (c.userId as any)?._id === directUser || 
        (c.userId as any) === directUser) &&
        !isPlaceholderName(c.name)
      );
      if (found?.name) return found.name;
    }
    if (job.approvedByName && !isPlaceholderName(job.approvedByName)) {
      return job.approvedByName;
    }

    // Department coordinator lookup
    const branch = (job.targetBranch || '').toLowerCase().trim();
    if (branch && coordinatorsList.length > 0) {
      const direct = coordinatorsList.find(c => {
        const d = (c.department || '').toLowerCase().trim();
        const s = (c.staffId || '').toLowerCase().trim();
        const isValid = !isPlaceholderName(c.name);
        return isValid && ((d && (d === branch || d.includes(branch) || branch.includes(d))) || (s && branch && s.includes(branch)));
      });
      if (direct?.name) return direct.name;

      const keywords: Record<string, string[]> = {
        cse: ['cse', 'computer science', 'cs'],
        it: ['it', 'information technology'],
        ece: ['ece', 'electronics', 'communication'],
        eee: ['eee', 'electrical'],
        mech: ['mech', 'mechanical'],
        civil: ['civil'],
        auto: ['auto', 'automobile'],
        bme: ['bme', 'biomedical'],
        csd: ['csd', 'design'],
        iot: ['iot'],
        cyber: ['cyber', 'security'],
        sfe: ['safety', 'fire', 'sfe'],
        mca: ['mca'],
        mba: ['mba', 'management'],
        'ai/ds': ['ai', 'ds', 'aiml', 'data science']
      };

      for (const [key, kwList] of Object.entries(keywords)) {
        if (key === branch || kwList.some(kw => branch.includes(kw))) {
          const matched = coordinatorsList.find(coord => {
            const d = (coord.department || '').toLowerCase().trim();
            const s = (coord.staffId || '').toLowerCase().trim();
            const isValid = !isPlaceholderName(coord.name);
            return isValid && kwList.some(kw => d.includes(kw) || s.includes(kw));
          });
          if (matched?.name) return matched.name;
        }
      }

      const validCoord = coordinatorsList.find(c => !isPlaceholderName(c.name));
      if (validCoord?.name) return validCoord.name;
    }

    return 'Coordinator';
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this job reference? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/jobs/${id}`, {
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
        alert('Job reference deleted successfully');
        navigate('/admin/job_and_reference');
      } else {
        setError(data.message || 'Failed to delete job reference');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

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
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={styles.formTitle}>Job Reference Details</h2>
                  <p className={styles.formSubtitle}>Submitted {formatDate(jobReference.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-red-500 border border-red-500 rounded-lg font-semibold text-sm hover:bg-red-500 hover:text-white transition-all duration-200"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
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
                  <Link
                    to={`/admin/alumini/${jobReference.submittedBy?._id}`}
                    className={styles.viewAlumniLink}
                  >
                    View Alumni
                  </Link>
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
                    {formatBranchName(jobReference.targetBranch)}
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
