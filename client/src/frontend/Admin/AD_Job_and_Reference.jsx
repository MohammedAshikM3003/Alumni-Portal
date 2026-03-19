import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AD_Job_and_Reference.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const Admin_Job_and_Reference = ({ onLogout }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobsData, setJobsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const cardsPerPage = 9;

  useEffect(() => {
    const fetchJobReferences = async () => {
      if (!user?.token) {
        setError('Please login to view job references');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/jobs/all`, {
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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobReferences();
  }, [user]);

  const filteredJobs = jobsData.filter(job =>
    job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredJobs.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + cardsPerPage);

  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxButtonsToShow = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);

    if (endPage - startPage < maxButtonsToShow - 1) {
      startPage = Math.max(1, endPage - maxButtonsToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/jobs/all`, {
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'CO';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className={styles.pageLayout}>
        <Sidebar onLogout={onLogout} currentView={'job_and_reference'} />
        <main className={styles.mainContent}>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-500">Loading job references...</p>
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
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-500">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageLayout}>

      {/* Sidebar */}
      <Sidebar onLogout={onLogout} currentView={'job_and_reference'} />

      {/* Main Content Area */}
      <main className={styles.mainContent}>

        {/* Top Header */}
        <header className={styles.pageHeader}>
          <div>
            <h2 className={styles.pageTitle}>Job & Reference</h2>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.searchWrapper}>
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <button className={styles.refreshBtn} onClick={handleRefresh}>
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </header>

        {/* Sub Header & Actions */}
        <div className={styles.subHeader}>
          <div>
            <h3 className={styles.subTitle}>Available Opportunities</h3>
            <p className={styles.subDescription}>Explore job openings shared by our alumni network.</p>
          </div>
        </div>

        {/* Jobs Grid */}
        {paginatedJobs.length > 0 ? (
          <div className={styles.jobsGrid}>
            {paginatedJobs.map((job) => (
              <div key={job._id} className={styles.jobCard}>
                <div className={styles.companyLogoWrapper}>
                  <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-2xl rounded-xl">
                    {getInitials(job.companyName)}
                  </div>
                </div>
                <h4 className={styles.companyName}>{job.companyName}</h4>
                <p className={styles.jobRole}>{job.role}</p>
                <button className={styles.viewDetailsBtn} onClick={() => { navigate(`/admin/view_job_and_reference/${job._id}`) }} >View Details</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-10 rounded-xl border border-slate-100 shadow-sm text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">work</span>
            <p className="text-slate-500">No job references found.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.paginationWrapper}>
            <nav className={styles.paginationNav}>
              <button
                className={styles.pageBtn}
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  className={`${styles.pageBtn} ${currentPage === page ? styles.activePageBtn : ''}`}
                  onClick={() => handlePageClick(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className={styles.pageBtn}
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </nav>
          </div>
        )}

      </main>
    </div>
  );
};

export default Admin_Job_and_Reference;
