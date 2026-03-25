import { useState, useEffect } from 'react';
import styles from './AD_Department.module.css';
import { Search, Plus, Eye, X } from 'lucide-react';
import Sidebar from './Components/Sidebar/Sidebar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const Admin_Department = ( { onLogout } ) => {

    const navigate = useNavigate();
    const { user } = useAuth();

  // State Management
  const [departments, setDepartments] = useState([]);
  const [coordinatorCount, setCoordinatorCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    stream: '',
    branch: '',
    deptCode: ''
  });

  // Fetch departments from backend
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!user?.token) {
        setError('Please login to view departments');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/departments`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch departments');
        }

        const data = await response.json();

        if (data.success && data.departments) {
          setDepartments(data.departments);
        } else {
          setError('Failed to load departments');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching departments:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchCoordinatorCount = async () => {
      if (!user?.token) return;

      try {
        const response = await fetch(`${API_BASE}/api/coordinators/all`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.coordinators) {
            setCoordinatorCount(data.coordinators.length);
          }
        }
      } catch (err) {
        console.error('Error fetching coordinator count:', err);
        // Don't show error for coordinator count, just keep it as 0
      }
    };

    fetchDepartments();
    fetchCoordinatorCount();
  }, [user?.token]);

  // Simple Modal Handlers
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFormData({ stream: '', branch: '', deptCode: '' });
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ stream: '', branch: '', deptCode: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Add Department Only
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!user?.token) {
      setError('Please login to create departments');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state with new department
        setDepartments([...departments, data.department]);
        handleCloseModal();
        setError(null);
      } else {
        setError(data.message || 'Failed to create department');
      }
    } catch (err) {
      setError('Error creating department');
      console.error('Error creating department:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = (deptCode) => {
    navigate(`/admin/department/view_department/${deptCode}`);
  };

  return (
    <div className={styles.dashboardWrapper}>
        <Sidebar currentView={'department'} onLogout={onLogout} />
      {/* Main Content Area */}
      <main className={styles.mainContent}>

        {/* Dashboard Content Area */}
        <div className={styles.dashboardContent}>

          {/* Page Title & Search */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Department Management</h1>
              <p className={styles.pageSubtitle}>Manage streams, branches, and academic structures.</p>
            </div>
            <div className={styles.searchContainer}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search departments..."
              />
            </div>
          </div>

          {/* Action Bar with Add Button and Stats */}
          <div className={styles.actionBar}>

            <div className={styles.statsContainer}>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{departments.length}</div>
                <div className={styles.statLabel}>Total Departments</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{coordinatorCount}</div>
                <div className={styles.statLabel}>Total Co-Ordinators</div>
              </div>
            <button className={styles.addBtn} onClick={handleOpenModal}>
              <Plus size={20} />
              Add Department
            </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className={styles.loadingState}>
              Loading departments...
            </div>
          ) : (
          <div className={styles.tableCard}>
            <div className={styles.tableResponsive}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Stream</th>
                    <th>Branch Name</th>
                    <th>Department Code</th>
                    <th className={styles.textCenter}>Alumni Records</th>
                    <th className={styles.textCenter}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept, index) => (
                    <tr key={dept._id}>
                      <td className={styles.textMuted}>{String(index + 1).padStart(2, '0')}</td>
                      <td className={styles.fontSemibold}>{dept.stream}</td>
                      <td>{dept.branch}</td>
                      <td>
                        <span className={styles.badgeCode}>{dept.deptCode}</span>
                      </td>
                      <td className={styles.textCenter}>
                        <span className={dept.alumniCount > 0 ? styles.badgeSuccess : styles.badgeEmpty}>
                          {dept.alumniCount} Records
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionGroup}>
                          <button className={styles.viewButton} onClick={() => handleView(dept.deptCode)} title="View Department Details">
                            <Eye size={18} />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {departments.length === 0 && !loading && (
                    <tr>
                      <td colSpan="6" className={styles.emptyState}>No departments found. Add a new one to get started.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

        </div>
      </main>

      {/* Simple Add Department Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Add New Department</h3>
              <button className={styles.closeBtn} onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              {error && (
                <div className={styles.errorMessage} style={{
                  color: '#dc2626',
                  backgroundColor: '#fef2f2',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}
              <div className={styles.formGroup}>
                <label>Stream</label>
                <input
                  type="text"
                  name="stream"
                  value={formData.stream}
                  onChange={handleInputChange}
                  placeholder="e.g. B.E, B.Tech, M.E, MBA, MCA"
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Branch Name</label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  placeholder="e.g. Computer Science and Engineering"
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Department Code</label>
                <input
                  type="text"
                  name="deptCode"
                  value={formData.deptCode}
                  onChange={handleInputChange}
                  placeholder="e.g. CSE"
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin_Department;