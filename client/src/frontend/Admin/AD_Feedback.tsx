import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AD_Feedback.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

interface FeedbackSummary {
  id: string;
  name: string;
  department: string;
  quote: string;
  rating: string;
  date: string;
  rawDate: Date;
}

interface DepartmentItem {
  _id: string;
  branch: string;
  deptCode: string;
}

const Admin_Feedback = ({ onLogout }: { onLogout?: () => void }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [feedbackData, setFeedbackData] = useState<FeedbackSummary[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      if (!user?.token) {
        setError('Please login to view feedbacks');
        setLoading(false);
        return;
      }

      try {
        const [feedbackRes, deptRes] = await Promise.all([
          fetch(`${API_BASE}/api/feedback/all`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          fetch(`${API_BASE}/api/departments`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          })
        ]);

        if (!feedbackRes.ok) throw new Error('Failed to fetch feedbacks');

        const data = await feedbackRes.json();
        if (data.success && data.feedbacks) {
          const formattedData: FeedbackSummary[] = data.feedbacks.map((fb: any) => ({
            id: fb._id,
            name: fb.submittedBy?.name || fb.reviewedBy || 'Anonymous',
            department: fb.department || 'General',
            quote: `"${fb.visionIV?.comment || fb.missionIM?.comment || fb.peos?.comment || 'No comments provided.'}"`,
            rating: fb.visionIV?.rating || fb.missionIM?.rating || 'satisfied',
            date: formatDate(fb.date || fb.createdAt),
            rawDate: new Date(fb.date || fb.createdAt),
          }));
          setFeedbackData(formattedData);
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

  // Metrics
  const totalCount = feedbackData.length;
  const satisfiedCount = feedbackData.filter(f => f.rating === 'best' || f.rating === 'satisfied').length;
  const satisfactionRate = totalCount > 0 ? Math.round((satisfiedCount / totalCount) * 100) : 0;
  const improvementCount = feedbackData.filter(f => f.rating === 'needs_improvement').length;

  const fbDeptCounts: Record<string, number> = {};
  feedbackData.forEach(f => {
    const dept = f.department?.trim();
    if (dept && dept !== 'General') fbDeptCounts[dept] = (fbDeptCounts[dept] || 0) + 1;
  });
  let topFbDept = 'N/A';
  let maxFbDeptCount = 0;
  Object.entries(fbDeptCounts).forEach(([dept, count]) => {
    if (count > maxFbDeptCount) {
      maxFbDeptCount = count;
      topFbDept = dept;
    }
  });

  // Filtered dataset
  const filteredFeedbacks = feedbackData.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      item.name.toLowerCase().includes(term) ||
      item.quote.toLowerCase().includes(term) ||
      item.department.toLowerCase().includes(term);

    const matchesDept = !selectedDept || item.department.toLowerCase() === selectedDept.toLowerCase();

    const matchesRating = !selectedRating || item.rating === selectedRating;

    return matchesSearch && matchesDept && matchesRating;
  }).sort((a, b) => {
    if (sortBy === 'date_asc') return a.rawDate.getTime() - b.rawDate.getTime();
    return b.rawDate.getTime() - a.rawDate.getTime();
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDept('');
    setSelectedRating('');
    setSortBy('date_desc');
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView="feedback" />
        <main className={styles.mainContent}>
          <div className={styles.loadingState}>Loading feedbacks...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView="feedback" />
        <main className={styles.mainContent}>
          <div className={styles.errorState}>{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Sidebar onLogout={onLogout} currentView="feedback" />

      <main className={styles.mainContent}>
        {/* Header */}
        <header className={styles.pageHeader} style={{ marginBottom: '1.25rem' }}>
          <div>
            <h2 className={styles.pageTitle}>Alumni Feedback</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Review and filter evaluation feedback submitted across all departments.</p>
          </div>
        </header>

        {/* Metric Cards Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Total Feedbacks</p>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0 0' }}>{totalCount}</h3>
          </div>
          <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Satisfaction Rate</p>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', margin: '0.25rem 0 0 0' }}>{satisfactionRate}%</h3>
          </div>
          <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Needs Improvement</p>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b91c1c', margin: '0.25rem 0 0 0' }}>{improvementCount}</h3>
          </div>
          <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '0.75rem', color: '#9333ea', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Most Responsive Dept</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7e22ce', margin: '0.4rem 0 0 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{topFbDept}</h3>
          </div>
        </div>

        {/* Search & Multi-Filter Panel */}
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>search</span>
            <input
              type="text"
              placeholder="Search reviewer or comment text..."
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

          {/* Rating Filter */}
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem', outline: 'none' }}
          >
            <option value="">All Ratings</option>
            <option value="best">Best</option>
            <option value="satisfied">Satisfied</option>
            <option value="needs_improvement">Needs Improvement</option>
          </select>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem', outline: 'none' }}
          >
            <option value="date_desc">Sort: Newest First</option>
            <option value="date_asc">Sort: Oldest First</option>
          </select>

          {/* Reset Button */}
          {(searchTerm || selectedDept || selectedRating || sortBy !== 'date_desc') && (
            <button
              onClick={clearFilters}
              style={{ padding: '0.5rem 0.75rem', background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* 3x3 Feedback Grid */}
        <div className={styles.feedbackGrid}>
          {filteredFeedbacks.length > 0 ? (
            filteredFeedbacks.map((feedback) => (
              <div key={feedback.id} className={styles.feedbackCard}>
                <div className={styles.cardBody}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 className={styles.authorName} style={{ margin: 0 }}>{feedback.name}</h3>
                    <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontWeight: 600 }}>
                      {feedback.department}
                    </span>
                  </div>
                  <p className={styles.feedbackQuote}>{feedback.quote}</p>
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.dateBadge}>{feedback.date}</span>
                  <button className={styles.viewBtn} onClick={() => { navigate(`/admin/feedback_form/${feedback.id}`); }}>
                    View <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <span className="material-symbols-outlined">rate_review</span>
              <p>No feedbacks received matching the active filters.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default Admin_Feedback;
