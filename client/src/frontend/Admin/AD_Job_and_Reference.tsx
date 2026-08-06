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
        
        {/* Header container */}
        <div className={styles.headerContainer}>
          <div>
            <h2 className={styles.headerTitle}>Job & Reference Hub</h2>
            <p className={styles.headerSubtitle}>Manage and filter job referral opportunities across all college departments.</p>
          </div>
          <button className={styles.refreshBtn} onClick={handleRefresh}>
            <span className={`material-symbols-outlined ${refreshing ? styles.refreshIconSpin : ''}`}>refresh</span>
            Refresh
          </button>
        </div>

        {/* Analytics & Stats Section */}
        <div className={styles.topDashboardSection}>
          {/* Card 1: Total Referrals */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <p className={styles.statLabel}>Total Referrals</p>
              <span className={`material-symbols-outlined ${styles.statIcon}`} style={{ color: '#22c55e' }}>trending_up</span>
            </div>
            <h3 className={styles.statValue}>{totalJobsCount}</h3>
            {/* Small area wave chart inside Card 1 */}
            <div className={styles.cardChartContainer}>
              <svg viewBox="0 0 100 30" className={styles.cardChartSvg} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0 25 C 20 23, 40 25, 60 21 C 80 18, 90 12, 100 8 L 100 30 L 0 30 Z" fill="url(#waveGrad)" />
                <path d="M 0 25 C 20 23, 40 25, 60 21 C 80 18, 90 12, 100 8" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 2: Approval Status Ratio */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <p className={styles.statLabel}>Approval Status Ratio</p>
              <span className={`material-symbols-outlined ${styles.statIcon}`} style={{ color: '#22c55e' }}>sync</span>
            </div>
            <h3 className={styles.statValue}>
              <span style={{ color: '#22c55e' }}>{approvedCount}</span>{' '}
              <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 500 }}>/ {pendingCount} Pending</span>
            </h3>
            <div className={styles.ratioProgressBarWrapper}>
              <div className={styles.ratioProgressBar}>
                <div className={styles.ratioSegment} style={{ width: `${approvedPct}%`, background: '#22c55e' }} />
                <div className={styles.ratioSegment} style={{ width: `${pendingPct}%`, background: '#eab308' }} />
                <div className={styles.ratioSegment} style={{ width: `${rejectedPct}%`, background: '#ef4444' }} />
              </div>
              <div className={styles.ratioLabels}>
                <span className={styles.ratioLabelItem} style={{ color: '#22c55e' }}>
                  <span className={styles.ratioDot} style={{ background: '#22c55e' }} />
                  {Math.round(approvedPct)}% Appr
                </span>
                <span className={styles.ratioLabelItem} style={{ color: '#eab308' }}>
                  <span className={styles.ratioDot} style={{ background: '#eab308' }} />
                  {Math.round(pendingPct)}% Pend
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Top Target Dept */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <p className={styles.statLabel}>Top Target Dept</p>
              <span className={`material-symbols-outlined ${styles.statIcon}`} style={{ color: '#8b5cf6' }}>bar_chart</span>
            </div>
            <h3 className={styles.statValue} style={{ color: '#8b5cf6' }}>{topDept}</h3>
            <div className={styles.deptProgressList}>
              {sortedDepts.slice(0, 2).map(([dept, count]) => {
                const pct = totalJobsCount > 0 ? Math.round((count / totalJobsCount) * 100) : 0;
                return (
                  <div key={dept} className={styles.deptProgressRow}>
                    <span className={styles.deptName}>{dept}</span>
                    <div className={styles.deptBarWrapper}>
                      <div className={styles.deptBar} style={{ width: `${pct}%`, background: '#8b5cf6' }} />
                    </div>
                    <span className={styles.deptCount}>{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 4: Work Mode Mix */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <p className={styles.statLabel}>Work Mode Mix</p>
              <span className={`material-symbols-outlined ${styles.statIcon}`} style={{ color: '#3b82f6' }}>pie_chart</span>
            </div>
            <h3 className={styles.statValue} style={{ color: '#3b82f6' }}>
              {offlineCount >= Math.max(onlineCount, hybridCount) ? 'Offline Led' : onlineCount >= hybridCount ? 'Online Led' : 'Hybrid Led'}
            </h3>
            <div className={styles.workModeProgressWrapper}>
              <div className={styles.workModeProgressBar}>
                <div className={styles.workModeSegment} style={{ width: `${offlinePct}%`, background: '#3b82f6' }} />
                <div className={styles.workModeSegment} style={{ width: `${hybridPct}%`, background: '#8b5cf6' }} />
                <div className={styles.workModeSegment} style={{ width: `${onlinePct}%`, background: '#06b6d4' }} />
              </div>
              <div className={styles.workModeLabels}>
                <span style={{ color: '#3b82f6' }}>Off: {offlinePct}%</span>
                <span style={{ color: '#8b5cf6' }}>Hyb: {hybridPct}%</span>
                <span style={{ color: '#06b6d4' }}>Onl: {onlinePct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar Panel */}
        <div className={styles.filterBar}>
          {/* Search Input */}
          <div className={styles.searchWrapper}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
            <input
              type="text"
              placeholder="Search by company or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept.branch}>
                {dept.branch}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={styles.filterSelect}
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
            className={styles.filterSelect}
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
            className={styles.filterSelect}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="vacancies">Sort: Vacancies</option>
          </select>

          {/* Reset Button */}
          {(searchTerm || selectedDept || selectedStatus || selectedWorkMode || sortBy !== 'newest') && (
            <button onClick={clearFilters} className={styles.clearBtn}>
              Clear
            </button>
          )}
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length > 0 ? (
          <div className={styles.jobsGrid}>
            {filteredJobs.map((job) => (
              <div key={job._id} className={styles.jobCard}>
                <div className={styles.cardContent}>
                  
                  {/* Circular Avatar */}
                  <div className={styles.avatarWrapper}>
                    <div className={styles.avatar}>
                      {job.companyName.charAt(0).toUpperCase()}
                    </div>
                    {job.status && (
                      <span
                        className={styles.statusDot}
                        style={{
                          backgroundColor: job.status === 'approved' ? '#22c55e' : job.status === 'rejected' ? '#ef4444' : '#eab308'
                        }}
                      />
                    )}
                  </div>

                  {/* Company & Role Info */}
                  <h3 className={styles.companyName}>{job.companyName}</h3>
                  <p className={styles.roleName}>{job.role}</p>

                  {/* Badges and tags */}
                  <div className={styles.badgeWrapper}>
                    {job.targetBranch && (
                      <span className={styles.branchBadge}>
                        {job.targetBranch}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className={styles.cardActions}>
                    <button
                      onClick={() => navigate(`/admin/view_job_and_reference/${job._id}`)}
                      className={styles.viewDetailsBtn}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span className={`material-symbols-outlined ${styles.emptyIcon}`}>work_off</span>
            <p className={styles.emptyText}>No job references matching the active filters.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin_Job_and_Reference;
