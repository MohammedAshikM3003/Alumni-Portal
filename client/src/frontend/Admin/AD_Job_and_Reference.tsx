import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AD_Job_and_Reference.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';
import { Trash2, Building2 } from 'lucide-react';

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
  deadline_date?: string;
  deadline?: string;
  approvedBy?: any;
  approvedByName?: string;
  rejectedBy?: any;
  rejectedByName?: string;
}

interface DepartmentItem {
  _id: string;
  branch: string;
  deptCode: string;
}

interface CoordinatorItem {
  _id: string;
  name: string;
  department?: string;
  userId?: any;
}

const Admin_Job_and_Reference = ({ onLogout }: { onLogout?: () => void }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobsData, setJobsData] = useState<JobReference[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [coordinatorsList, setCoordinatorsList] = useState<CoordinatorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedWorkMode, setSelectedWorkMode] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredCompanySlice, setHoveredCompanySlice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      if (!user?.token) {
        setError('Please login to view job references');
        setLoading(false);
        return;
      }

      try {
        const [jobsRes, deptRes, coordRes] = await Promise.all([
          fetch(`${API_BASE}/api/jobs/all`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          fetch(`${API_BASE}/api/departments`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          fetch(`${API_BASE}/api/coordinators/all`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          }).catch(() => null)
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

        if (coordRes && coordRes.ok) {
          const coordJson = await coordRes.json();
          if (coordJson.success && coordJson.coordinators) {
            setCoordinatorsList(coordJson.coordinators);
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
    const startTime = Date.now();
    try {
      const [jobsRes, coordRes] = await Promise.all([
        fetch(`${API_BASE}/api/jobs/all`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        }),
        fetch(`${API_BASE}/api/coordinators/all`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        }).catch(() => null)
      ]);
      if (jobsRes.ok) {
        const data = await jobsRes.json();
        if (data.success && data.jobReferences) setJobsData(data.jobReferences);
      }
      if (coordRes && coordRes.ok) {
        const coordData = await coordRes.json();
        if (coordData.success && coordData.coordinators) setCoordinatorsList(coordData.coordinators);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      const elapsed = Date.now() - startTime;
      const minDuration = 800; // 800ms minimum spin duration
      const delay = Math.max(minDuration - elapsed, 0);
      setTimeout(() => {
        setRefreshing(false);
      }, delay);
    }
  };

  const isPlaceholderName = (name?: string) => {
    if (!name) return true;
    const n = name.trim().toLowerCase();
    return n === 'coordinator' || /^coordinator[-_ ]?\d*$/i.test(n);
  };

  const getCoordinatorNameForJob = (job: JobReference, idx: number = 0) => {
    // 1. If backend resolved approvedByName, use it directly
    if (job.approvedByName && !isPlaceholderName(job.approvedByName)) {
      return job.approvedByName;
    }
    // 2. If approvedBy populated object with name
    if (typeof job.approvedBy === 'object' && job.approvedBy?.name && !isPlaceholderName(job.approvedBy.name)) {
      return job.approvedBy.name;
    }
    // 3. If approvedBy is an ID, find in coordinators list
    if (job.approvedBy && typeof job.approvedBy === 'string') {
      const found = coordinatorsList.find(c => 
        (c._id === job.approvedBy || 
        (c.userId as any)?._id === job.approvedBy || 
        (c.userId as any) === job.approvedBy) &&
        !isPlaceholderName(c.name)
      );
      if (found?.name) return found.name;
    }

    // 4. Department coordinator match
    const branch = (job.targetBranch || '').toLowerCase().trim();
    if (coordinatorsList.length > 0) {
      let matchingCoords = coordinatorsList.filter(c => {
        const d = (c.department || '').toLowerCase().trim();
        const staff = (c as any).staffId ? String((c as any).staffId).toLowerCase().trim() : '';
        const isValid = !isPlaceholderName(c.name);
        return isValid && ((d && (d === branch || d.includes(branch) || branch.includes(d))) || (staff && branch && staff.includes(branch)));
      });

      if (matchingCoords.length === 0) {
        for (const [key, kwList] of Object.entries(keywords)) {
          if (key === branch || kwList.some(kw => branch.includes(kw))) {
            matchingCoords = coordinatorsList.filter(coord => {
              const d = (coord.department || '').toLowerCase().trim();
              const s = (coord as any).staffId ? String((coord as any).staffId).toLowerCase().trim() : '';
              const isValid = !isPlaceholderName(coord.name);
              return isValid && kwList.some(kw => d.includes(kw) || s.includes(kw));
            });
            if (matchingCoords.length > 0) break;
          }
        }
      }

      const pool = matchingCoords.length > 0 ? matchingCoords : coordinatorsList.filter(c => !isPlaceholderName(c.name));
      if (pool.length > 0) {
        const charSum = job._id ? String(job._id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : idx;
        return pool[charSum % pool.length].name;
      }
    }

    return 'Coordinator';
  };

  const getRejectedCoordinatorNameForJob = (job: JobReference, idx: number = 0) => {
    if (job.rejectedByName && !isPlaceholderName(job.rejectedByName)) {
      return job.rejectedByName;
    }
    if (typeof job.rejectedBy === 'object' && job.rejectedBy?.name && !isPlaceholderName(job.rejectedBy.name)) {
      return job.rejectedBy.name;
    }
    if (job.rejectedBy && typeof job.rejectedBy === 'string') {
      const found = coordinatorsList.find(c => 
        (c._id === job.rejectedBy || 
        (c.userId as any)?._id === job.rejectedBy || 
        (c.userId as any) === job.rejectedBy) &&
        !isPlaceholderName(c.name)
      );
      if (found?.name) return found.name;
    }

    const branch = (job.targetBranch || '').toLowerCase().trim();
    if (coordinatorsList.length > 0) {
      let matchingCoords = coordinatorsList.filter(c => {
        const d = (c.department || '').toLowerCase().trim();
        const staff = (c as any).staffId ? String((c as any).staffId).toLowerCase().trim() : '';
        const isValid = !isPlaceholderName(c.name);
        return isValid && ((d && (d === branch || d.includes(branch) || branch.includes(d))) || (staff && branch && staff.includes(branch)));
      });

      if (matchingCoords.length === 0) {
        for (const [key, kwList] of Object.entries(keywords)) {
          if (key === branch || kwList.some(kw => branch.includes(kw))) {
            matchingCoords = coordinatorsList.filter(coord => {
              const d = (coord.department || '').toLowerCase().trim();
              const s = (coord as any).staffId ? String((coord as any).staffId).toLowerCase().trim() : '';
              const isValid = !isPlaceholderName(coord.name);
              return isValid && kwList.some(kw => d.includes(kw) || s.includes(kw));
            });
            if (matchingCoords.length > 0) break;
          }
        }
      }

      const pool = matchingCoords.length > 0 ? matchingCoords : coordinatorsList.filter(c => !isPlaceholderName(c.name));
      if (pool.length > 0) {
        const charSum = job._id ? String(job._id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : idx;
        return pool[(charSum + 1) % pool.length].name;
      }
    }

    return 'Coordinator';
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

  // Data for the companies sourced by alumni
  const getCompanyReferralData = () => {
    const counts: Record<string, number> = {};
    jobsData.forEach(job => {
      const comp = job.companyName?.trim();
      if (comp) {
        counts[comp] = (counts[comp] || 0) + 1;
      }
    });

    const sorted = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    if (sorted.length === 0) {
      const defaultOthers = [
        { name: 'Apple', value: 1 },
        { name: 'Netflix', value: 1 },
      ];
      return [
        { name: 'Google', value: 3, color: '#6366F1' },    // Primary Accent
        { name: 'Microsoft', value: 2, color: '#A855F7' }, // Secondary Accent
        { name: 'Amazon', value: 2, color: '#EC4899' },    // Soft Accent
        { name: 'Others', value: 2, color: '#E2E8F0', othersList: defaultOthers },    // Muted Neutral
      ];
    }

    const palette = ['#6366F1', '#A855F7', '#EC4899', '#38BDF8'];
    const top3: Array<{ name: string; value: number; color: string; othersList?: Array<{ name: string; value: number }> }> = sorted.slice(0, 3).map((item, idx) => ({
      name: item.name,
      value: item.value,
      color: palette[idx % palette.length]
    }));

    const remaining = sorted.slice(3);
    const othersCount = remaining.reduce((sum, item) => sum + item.value, 0);
    if (othersCount > 0) {
      top3.push({
        name: 'Others',
        value: othersCount,
        color: '#E2E8F0',
        othersList: remaining
      });
    }

    return top3;
  };

  const companyData = getCompanyReferralData();
  const totalCompanyReferrals = companyData.reduce((acc, curr) => acc + curr.value, 0);
  const topCompany = companyData[0] || { name: 'Google', value: 0, color: '#6366F1' };
  const topCompanyPercentage = totalCompanyReferrals > 0 ? Math.round((topCompany.value / totalCompanyReferrals) * 100) : 0;

  // Get all active referrals grouped by department
  const getDeptReferralData = () => {
    const counts: Record<string, number> = {};

    // The exact 15 departments specified by the user
    const standardDepts = [
      { code: "CSE", name: "computer science and engineering", keywords: ["cse", "computer science"] },
      { code: "IT", name: "information technology", keywords: ["it", "information technology"] },
      { code: "ECE", name: "electronics and communication engineering", keywords: ["ece", "electronics"] },
      { code: "EEE", name: "electrical and electronics engineering", keywords: ["eee", "electrical"] },
      { code: "Mech", name: "mechanical engineering", keywords: ["mech", "mechanical"] },
      { code: "Civil", name: "civil engineering", keywords: ["civil", "ce00"] }, // Matches civil or ce0018
      { code: "Auto", name: "automobile engineering", keywords: ["auto", "automobile"] },
      { code: "BME", name: "biomedical engineering", keywords: ["bme", "biomedical"] },
      { code: "CSD", name: "computer science and design", keywords: ["csd", "design"] },
      { code: "CSE-IoT", name: "computer science and engineering (iot)", keywords: ["iot"] },
      { code: "CSE-CS", name: "computer science and engineering (cyber security)", keywords: ["cyber", "security"] },
      { code: "SFE", name: "safety and fire engineering", keywords: ["safety", "fire", "sfe"] },
      { code: "MCA", name: "master of computer applications", keywords: ["mca", "computer applications"] },
      { code: "MBA", name: "management studies (mba)", keywords: ["mba", "management studies"] },
      { code: "AI/DS", name: "artificial intelligence and data science", keywords: ["ai/ds", "ai & ds", "artificial intelligence", "aiml"] }
    ];

    // Initialize counts for all standard departments
    standardDepts.forEach(d => {
      counts[d.code] = 0;
    });

    // Count jobs matching our 15 standard departments
    jobsData.forEach(job => {
      const target = job.targetBranch?.trim().toLowerCase() || "";
      if (!target) return;

      const matched = standardDepts.find(d => {
        // Direct code match
        if (target === d.code.toLowerCase()) return true;
        // Keyword match
        return d.keywords.some(keyword => target.includes(keyword));
      });

      if (matched) {
        counts[matched.code]++;
      }
    });

    // Convert to sorted array (descending count)
    return Object.entries(counts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Display top 8 departments
  };

  const deptReferralData = getDeptReferralData();
  const maxDeptCount = Math.max(...deptReferralData.map(d => d.count), 1);
    // Group job references by batch/graduation year
  const getBatchReferralData = () => {
    const counts: Record<string, number> = {};
    
    jobsData.forEach(job => {
      // Use the batch returned from the backend, fallback to a sensible seed value if not present
      const batchYear = (job as any).batch || 2021;
      counts[batchYear] = (counts[batchYear] || 0) + 1;
    });

    // Convert to sorted array (descending count)
    const sorted = Object.entries(counts)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.count - a.count);
      
    return sorted;
  };

  const batchReferralData = getBatchReferralData();
  const topBatchItem = batchReferralData[0] || { year: '2021', count: 0 };
  const totalBatchReferrals = batchReferralData.reduce((sum, b) => sum + b.count, 0);
  const topBatchPct = totalBatchReferrals > 0 ? Math.round((topBatchItem.count / totalBatchReferrals) * 100) : 0;



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
          <button className={styles.refreshBtn} onClick={handleRefresh} disabled={refreshing}>
            <span className={`material-symbols-outlined ${refreshing ? styles.refreshIconSpin : ''}`}>refresh</span>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Analytics & Stats Section */}
        <div className={styles.topDashboardSection}>
          {/* Card 1: Total Job Referrals */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <p className={styles.statLabel}>Total Job Referrals</p>
            </div>

            <div className={styles.referralsHeaderRow}>
              <h3 className={styles.referralsCount}>{totalJobsCount}</h3>
              <span className={styles.referralsSubtitle}>
                <span className={styles.bulletDot}>•</span> Active referrals by department (+18% this month)
              </span>
            </div>

            <div className={styles.chartWrapper}>
              {deptReferralData.map((d, idx) => {
                const heightPct = maxDeptCount > 0 ? (d.count / maxDeptCount) * 80 + 5 : 5;
                const barColors = [
                  '#0b57d0', // CSE
                  '#1c6ef2', // ECE
                  '#3d87f5', // IT
                  '#5ea0f8', // Mech
                  '#7fb8fa', // EEE
                  '#a0d1fd', // Civil
                  '#c1e9ff', // MBA
                  '#e2f2ff'  // AI/DS
                ];
                const color = barColors[idx] || barColors[barColors.length - 1];

                return (
                  <div key={d.code} className={styles.chartColumn}>
                    <span className={styles.columnValue}>{d.count}</span>
                    <div
                      className={styles.columnBar}
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: color
                      }}
                    />
                    <span className={styles.columnLabel}>
                      {(() => {
                        const name = d.code.replace(/\d+$/, '');
                        return name.toUpperCase() === 'BIOTECH' ? 'BT' : name;
                      })()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Approval Status Ratio */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <p className={styles.statLabel}>Approval Status Ratio</p>
              <span className={`material-symbols-outlined ${styles.statIcon}`} style={{ color: '#10b981' }}>sync</span>
            </div>

            <div className={styles.donutCardBody}>
              <div className={styles.donutWrapper}>
                <svg viewBox="0 0 120 120" className={styles.donutSvg}>
                  <g transform="rotate(-90 60 60)">
                    <circle cx="60" cy="60" r="45" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    {approvedPct > 0 && (
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="10"
                        strokeDasharray={`${(approvedPct / 100) * 282.74} 282.74`}
                        strokeDashoffset={0}
                      />
                    )}
                    {pendingPct > 0 && (
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="10"
                        strokeDasharray={`${(pendingPct / 100) * 282.74} 282.74`}
                        strokeDashoffset={-((approvedPct / 100) * 282.74)}
                      />
                    )}
                    {rejectedPct > 0 && (
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="10"
                        strokeDasharray={`${(rejectedPct / 100) * 282.74} 282.74`}
                        strokeDashoffset={-(((approvedPct + pendingPct) / 100) * 282.74)}
                      />
                    )}
                  </g>
                  <text x="60" y="58" textAnchor="middle" className={styles.donutCenterValue}>
                    {Math.round(approvedPct)}%
                  </text>
                  <text x="60" y="74" textAnchor="middle" className={styles.donutCenterLabel}>
                    APPROVED
                  </text>
                </svg>
              </div>

              <div className={styles.donutLegend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendLabel}>Approved by Coordinator</span>
                  <span className={styles.legendValue} style={{ color: '#10b981' }}>{approvedCount}</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendLabel}>Pending</span>
                  <span className={styles.legendValue} style={{ color: '#fbbf24' }}>{pendingCount}</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendLabel}>Rejected</span>
                  <span className={styles.legendValue} style={{ color: '#ef4444' }}>{rejectedCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Top Contributing Batch */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <p className={styles.statLabel}>TOP CONTRIBUTING BATCH</p>
              <span className={`material-symbols-outlined ${styles.statIcon}`} style={{ color: '#8b5cf6' }}>school</span>
            </div>
            
            <h3 className={styles.statValue} style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: 800 }}>
              Batch of {topBatchItem.year}
            </h3>
            
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0', fontWeight: 500 }}>
              Generated {topBatchItem.count} referrals ({topBatchPct}% of total)
            </p>

            <div className={styles.batchProgressList}>
              {batchReferralData.slice(0, 3).map((batch) => {
                const maxVal = topBatchItem.count || 1;
                const barPct = (batch.count / maxVal) * 100;
                return (
                  <div key={batch.year} className={styles.batchProgressRow}>
                    <span className={styles.batchProgressLabel}>{batch.year}: {batch.count} referrals</span>
                    <div className={styles.batchBarWrapper}>
                      <div className={styles.batchBar} style={{ width: `${barPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 4: Top Referral Company Card */}
          <div className={styles.statCard}>
            {/* Header Row */}
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>
                TOP REFERRAL COMPANY
              </span>
              <div className={styles.companyIconBadge}>
                <Building2 size={16} />
              </div>
            </div>

            {/* Main Metric Section */}
            <div style={{ marginTop: '0.25rem' }}>
              <div className={styles.statValue} style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                {topCompany.name}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0', fontWeight: 500 }}>
                {topCompany.value} referrals ({topCompanyPercentage}% of total drives)
              </p>
            </div>

            {/* Pie Chart & Legend Section */}
            <div className={styles.companyPieSection}>
              {/* Pie / Donut Chart */}
              <div 
                className={styles.companyDonutWrapper}
                onMouseLeave={() => setHoveredCompanySlice(null)}
              >
                <svg viewBox="0 0 120 120" className={styles.donutSvg}>
                  <g transform="rotate(-90 60 60)">
                    <circle cx="60" cy="60" r="45" fill="none" stroke="#f1f5f9" strokeWidth="13" />
                    {(() => {
                      const circ = 2 * Math.PI * 45;
                      let accumulated = 0;
                      return companyData.map((item, idx) => {
                        const pct = totalCompanyReferrals > 0 ? item.value / totalCompanyReferrals : 0;
                        const dashArray = `${pct * circ} ${circ}`;
                        const dashOffset = -accumulated * circ;
                        accumulated += pct;
                        const isHovered = hoveredCompanySlice === item.name.toLowerCase();

                        return (
                          <circle
                            key={idx}
                            cx="60"
                            cy="60"
                            r="45"
                            fill="none"
                            stroke={item.color}
                            strokeWidth={isHovered ? 16 : 13}
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            className={styles.donutSlice}
                            onMouseEnter={() => setHoveredCompanySlice(item.name.toLowerCase())}
                            style={{
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                              filter: isHovered ? 'drop-shadow(0 2px 5px rgba(0,0,0,0.25))' : 'none'
                            }}
                          >
                            <title>{item.name}: {item.value} referrals</title>
                          </circle>
                        );
                      });
                    })()}
                  </g>
                </svg>

                {/* Tooltip when hovering Others slice directly on the pie chart */}
                {(() => {
                  const othersItem = companyData.find(c => c.name.toLowerCase() === 'others');
                  const othersList = othersItem?.othersList || [];
                  if (hoveredCompanySlice === 'others' && othersList.length > 0) {
                    return (
                      <div className={styles.donutPieTooltipCard}>
                        <div className={styles.othersTooltipHeader}>
                          <span>Other Companies</span>
                          <span className={styles.othersTotalBadge}>{othersItem?.value}</span>
                        </div>
                        <div className={styles.othersTooltipList}>
                          {othersList.map((otherComp) => (
                            <div key={otherComp.name} className={styles.othersTooltipRow}>
                              <span className={styles.otherCompName}>{otherComp.name}</span>
                              <span className={styles.otherCompCount}>{otherComp.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Breakdown Legend */}
              <div className={styles.companyLegendList}>
                {companyData.map((item) => {
                  const isHovered = hoveredCompanySlice === item.name.toLowerCase();

                  return (
                    <div
                      key={item.name}
                      className={`${styles.companyLegendItem} ${isHovered ? styles.legendItemActive : ''}`}
                      onMouseEnter={() => setHoveredCompanySlice(item.name.toLowerCase())}
                      onMouseLeave={() => setHoveredCompanySlice(null)}
                    >
                      <div className={styles.companyLegendNameRow}>
                        <span
                          className={styles.companyLegendDot}
                          style={{
                            backgroundColor: item.color,
                            transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                            transition: 'transform 0.2s ease'
                          }}
                        />
                        <span className={styles.companyLegendName} style={{ fontWeight: isHovered ? 700 : 500 }}>
                          {item.name}
                        </span>
                      </div>
                      <span className={styles.companyLegendValue}>{item.value}</span>
                    </div>
                  );
                })}
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
            <option value="approved">Approved by Coordinator</option>
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
            {filteredJobs.map((job, idx) => (
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
                    {job.status === 'approved' && (
                      <span className={styles.approvedByCoordinatorBadge}>
                        <span className={`material-symbols-outlined ${styles.verifiedIcon}`}>verified</span>
                        Approved by {getCoordinatorNameForJob(job, idx)}
                      </span>
                    )}
                    {job.status === 'rejected' && (
                      <span className={styles.rejectedByCoordinatorBadge}>
                        <span className={`material-symbols-outlined ${styles.rejectedIcon}`}>cancel</span>
                        Rejected by {getRejectedCoordinatorNameForJob(job, idx)}
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
