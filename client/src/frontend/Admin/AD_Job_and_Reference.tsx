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
  targetBranch?: string;
  status?: string;
  workMode?: string;
  vacancies?: number;
  createdAt?: string;
}

interface DepartmentItem {
  _id: string;
  branch: string;
  deptCode: string;
}

const Admin_Job_and_Reference = ({ onLogout }: { onLogout?: () => void }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobsData, setJobsData] = useState<JobReference[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedWorkMode, setSelectedWorkMode] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      if (!user?.token) {
        setError('Please login to view job references');
        setLoading(false);
        return;
      }

      try {
        const [jobsRes, deptRes] = await Promise.all([
          fetch(`${API_BASE}/api/jobs/all`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          fetch(`${API_BASE}/api/departments`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          })
        ]);

        if (!jobsRes.ok) throw new Error('Failed to fetch job references');

        const jobsJson = await jobsRes.json();
        if (jobsJson.success && jobsJson.jobReferences) {
          setJobsData(jobsJson.jobReferences);
        }

        if (deptRes.ok) {
          const deptJson = await deptRes.json();
          if (deptJson.success && deptJson.departments) {
            setDepartments(deptJson.departments);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_BASE}/api/jobs/all`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.jobReferences) setJobsData(data.jobReferences);
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

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDept('');
    setSelectedStatus('');
    setSelectedWorkMode('');
    setSortBy('newest');
  };

  // Metrics & Chart Calculations
  const totalJobsCount = jobsData.length;
  const approvedCount = jobsData.filter(j => j.status === 'approved').length;
  const pendingCount = jobsData.filter(j => j.status === 'pending').length;
  const rejectedCount = jobsData.filter(j => j.status === 'rejected').length;

  const approvedPct = totalJobsCount > 0 ? (approvedCount / totalJobsCount) * 100 : 0;
  const pendingPct = totalJobsCount > 0 ? (pendingCount / totalJobsCount) * 100 : 0;
  const rejectedPct = totalJobsCount > 0 ? (rejectedCount / totalJobsCount) * 100 : 0;

  const deptCounts: Record<string, number> = {};
  jobsData.forEach(j => {
    const dept = j.targetBranch?.trim();
    if (dept) deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });
  const sortedDepts = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);
  const topDept = sortedDepts[0] ? sortedDepts[0][0] : 'N/A';

  const offlineCount = jobsData.filter(j => j.workMode === 'offline').length;
  const onlineCount = jobsData.filter(j => j.workMode === 'online').length;
  const hybridCount = jobsData.filter(j => j.workMode === 'hybrid').length;
  const offlinePct = totalJobsCount > 0 ? Math.round((offlineCount / totalJobsCount) * 100) : 0;
  const onlinePct = totalJobsCount > 0 ? Math.round((onlineCount / totalJobsCount) * 100) : 0;
  const hybridPct = totalJobsCount > 0 ? Math.round((hybridCount / totalJobsCount) * 100) : 0;

  // Filtered jobs logic
  const filteredJobs = jobsData.filter(job => {
    // Search match
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      job.companyName.toLowerCase().includes(term) ||
      job.role.toLowerCase().includes(term) ||
      (job.targetBranch && job.targetBranch.toLowerCase().includes(term));

    // Department match
    const matchesDept = !selectedDept ||
      (job.targetBranch && job.targetBranch.toLowerCase().includes(selectedDept.toLowerCase()));

    // Status match
    const matchesStatus = !selectedStatus || job.status === selectedStatus;

    // Work Mode match
    const matchesWorkMode = !selectedWorkMode || job.workMode === selectedWorkMode;

    return matchesSearch && matchesDept && matchesStatus && matchesWorkMode;
  }).sort((a, b) => {
    if (sortBy === 'vacancies') {
      return (b.vacancies || 0) - (a.vacancies || 0);
    }
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

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
                <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Job & Reference Hub</h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Manage and filter job referral opportunities across all college departments.</p>
            </div>
            <button onClick={handleRefresh} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>refresh</span> Refresh
            </button>
          </div>

          {/* Visual Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Card 1: Total Referrals + Sparkline Graph */}
            <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Total Referrals</p>
                  <span className="material-symbols-outlined" style={{ color: '#228B22', fontSize: '1.25rem' }}>trending_up</span>
                </div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0 0' }}>{totalJobsCount}</h3>
              </div>
              <div style={{ height: '32px', width: '100%', marginTop: '0.5rem' }}>
                <svg width="100%" height="100%" viewBox="0 0 120 32" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#228B22" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#228B22" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M 0 26 Q 30 12 60 18 T 120 4 L 120 32 L 0 32 Z" fill="url(#totalGrad)" />
                  <path d="M 0 26 Q 30 12 60 18 T 120 4" fill="none" stroke="#228B22" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Card 2: Approval Ratio Bar Chart */}
            <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Approval Status Ratio</p>
                  <span className="material-symbols-outlined" style={{ color: '#22c55e', fontSize: '1.25rem' }}>donut_large</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', margin: 0 }}>{approvedCount}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#ca8a04', fontWeight: 600 }}>/ {pendingCount} Pending</span>
                </div>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: '#f1f5f9' }}>
                  <div style={{ width: `${approvedPct}%`, background: '#22c55e', transition: 'width 0.3s' }} title={`Approved: ${approvedCount}`} />
                  <div style={{ width: `${pendingPct}%`, background: '#eab308', transition: 'width 0.3s' }} title={`Pending: ${pendingCount}`} />
                  <div style={{ width: `${rejectedPct}%`, background: '#ef4444', transition: 'width 0.3s' }} title={`Rejected: ${rejectedCount}`} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '0.35rem' }}>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>● {Math.round(approvedPct)}% Appr</span>
                  <span style={{ color: '#ca8a04', fontWeight: 600 }}>● {Math.round(pendingPct)}% Pend</span>
                </div>
              </div>
            </div>

            {/* Card 3: Top Dept Breakdown Chart */}
            <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Top Target Dept</p>
                  <span className="material-symbols-outlined" style={{ color: '#9333ea', fontSize: '1.25rem' }}>bar_chart</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7e22ce', margin: '0.25rem 0 0 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{topDept}</h3>
              </div>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {sortedDepts.slice(0, 2).map(([d, cnt]) => {
                  const pct = totalJobsCount > 0 ? Math.round((cnt / totalJobsCount) * 100) : 0;
                  return (
                    <div key={d}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#475569', marginBottom: '2px' }}>
                        <span>{d}</span>
                        <span style={{ fontWeight: 600 }}>{cnt} ({pct}%)</span>
                      </div>
                      <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#9333ea', borderRadius: '2px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 4: Work Mode Distribution Chart */}
            <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Work Mode Mix</p>
                  <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: '1.25rem' }}>pie_chart</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1d4ed8', margin: '0.25rem 0 0 0' }}>
                  {hybridCount >= offlineCount && hybridCount >= onlineCount ? 'Hybrid Led' : offlineCount >= onlineCount ? 'Offline Led' : 'Online Led'}
                </h3>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: '#f1f5f9' }}>
                  <div style={{ width: `${offlinePct}%`, background: '#3b82f6' }} title={`Offline: ${offlineCount}`} />
                  <div style={{ width: `${hybridPct}%`, background: '#8b5cf6' }} title={`Hybrid: ${hybridCount}`} />
                  <div style={{ width: `${onlinePct}%`, background: '#06b6d4' }} title={`Online: ${onlineCount}`} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '0.35rem' }}>
                  <span style={{ color: '#3b82f6', fontWeight: 600 }}>Off: {offlinePct}%</span>
                  <span style={{ color: '#8b5cf6', fontWeight: 600 }}>Hyb: {hybridPct}%</span>
                  <span style={{ color: '#06b6d4', fontWeight: 600 }}>Onl: {onlinePct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar Panel */}
          <div style={{ background: '#fff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>search</span>
              <input
                type="text"
                placeholder="Search by company or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.85rem' }}
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem', outline: 'none', minWidth: '160px' }}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept.branch}>
                  {dept.deptCode} - {dept.branch}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem', outline: 'none' }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Work Mode Filter */}
            <select
              value={selectedWorkMode}
              onChange={(e) => setSelectedWorkMode(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem', outline: 'none' }}
            >
              <option value="">All Work Modes</option>
              <option value="offline">Offline</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem', outline: 'none' }}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="vacancies">Sort: Vacancies (High-to-Low)</option>
            </select>

            {/* Reset Button */}
            {(searchTerm || selectedDept || selectedStatus || selectedWorkMode || sortBy !== 'newest') && (
              <button
                onClick={clearFilters}
                style={{ padding: '0.5rem 0.75rem', background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', paddingBottom: '2rem' }}>
            {filteredJobs.map((job) => (
              <div key={job._id} className={styles.jobCard}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                  {/* Circular Avatar */}
                  <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e40af', fontWeight: 'bold', fontSize: '1.2rem', border: '2px solid #f1f5f9' }}>
                      {getInitials(job.companyName)}
                    </div>
                    {job.status && (
                      <span style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: '2px solid #fff',
                        backgroundColor: job.status === 'approved' ? '#22c55e' : job.status === 'rejected' ? '#ef4444' : '#eab308'
                      }} />
                    )}
                  </div>

                  {/* Company & Role Info */}
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0.25rem 0 0.15rem 0' }}>{job.companyName}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, margin: '0 0 0.5rem 0' }}>{job.role}</p>

                  {/* Target Branch Badge */}
                  {job.targetBranch && (
                    <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '0.375rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                      {job.targetBranch}
                    </span>
                  )}

                  {/* View Details Button */}
                  <button
                    onClick={() => navigate(`/admin/view_job_and_reference/${job._id}`)}
                    style={{
                      width: '100%',
                      marginTop: 'auto',
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
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '0.75rem', display: 'block' }}>work_off</span>
            <p style={{ color: '#64748b', fontWeight: 500 }}>No job references matching the active filters.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin_Job_and_Reference;
