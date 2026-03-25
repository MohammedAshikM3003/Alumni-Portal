import { useState, useMemo, useEffect } from 'react';
import { Plus, Eye, Trash2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './AD_View_Department.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const Admin_View_Department = ( { onLogout } ) => {

  const navigate = useNavigate();
  const { user } = useAuth();
  const { deptCode } = useParams();

  // State for functionality
  const [filterName, setFilterName] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [department, setDepartment] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const ENTRIES_PER_PAGE = 10;

  // Complete Staff Data
  const [staffList, setStaffList] = useState([]);

  // Fetch department and faculty data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.token) {
        setError('Please login to view department details');
        setLoading(false);
        return;
      }

      if (!deptCode) {
        setError('Department code not provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch department details
        const deptResponse = await fetch(`${API_BASE}/api/departments/code/${deptCode}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (deptResponse.ok) {
          const deptData = await deptResponse.json();
          if (deptData.success) {
            setDepartment(deptData.department);
          }
        }

        // Fetch coordinators by department
        const coordinatorResponse = await fetch(`${API_BASE}/api/coordinators/department/${deptCode}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!coordinatorResponse.ok) {
          throw new Error('Failed to fetch coordinator data');
        }

        const coordinatorData = await coordinatorResponse.json();

        if (coordinatorData.success && coordinatorData.coordinators) {
          setStaffList(coordinatorData.coordinators);
        } else {
          setError('Failed to load coordinator data');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.token, deptCode]);

  // Get unique designations for filter
  const designations = useMemo(() => {
    const unique = [...new Set(staffList.map(staff => staff.designation))];
    return unique.sort();
  }, [staffList]);

  // Filter logic
  const filteredStaff = useMemo(() => {
    return staffList.filter(staff => {
      const matchesName = filterName === '' ||
        staff.name.toLowerCase().includes(filterName.toLowerCase());
      const matchesRole = filterRole === '' || staff.designation === filterRole;
      return matchesName && matchesRole;
    });
  }, [staffList, filterName, filterRole]);

  // Pagination logic
  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * ENTRIES_PER_PAGE;
    return filteredStaff.slice(startIndex, startIndex + ENTRIES_PER_PAGE);
  }, [filteredStaff, currentPage]);

  const totalPages = Math.ceil(filteredStaff.length / ENTRIES_PER_PAGE);

  // Event handlers
  const handleNameFilterChange = (e) => {
    setFilterName(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering by name
  };

  const handleRoleFilterChange = (designation) => {
    setFilterRole(designation);
    setCurrentPage(1); // Reset to first page when filtering by role
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Modal handlers
  const handleOpenAddFaculty = () => {
    navigate(`/admin/department/${deptCode}/add_faculty`);
  };

  const handleViewStaff = (staffId) => {
    navigate(`/admin/department/view_faculty/${staffId}`);
  };

  const handleDeleteDepartment = async () => {
    if (!window.confirm('Are you sure you want to delete this department?\n\nWARNING: All faculty members in this department will also be deleted and their accounts will be removed. This action cannot be undone.')) {
      return;
    }

    if (!department?._id) {
      setError('Department information not available');
      return;
    }

    if (!user?.token) {
      setError('Please login to delete departments');
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/departments/${department._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'Department deleted successfully!');
        navigate('/admin/department');
      } else {
        setError(data.message || 'Failed to delete department');
      }
    } catch (err) {
      setError('Error deleting department');
      console.error('Error deleting department:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/department');
  };

  return (
    <div className={styles.dashboardWrapper}>
      <Sidebar onLogout={onLogout} currentView={'department'} />

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Dashboard Content Area */}
        <div className={styles.dashboardContent}>

          {/* Page Title & Breadcrumb */}
          <div className={styles.pageHeader}>
            <div>
              <button className={styles.backBtn} onClick={handleBack}>
                <ArrowLeft size={16} /> Back to Departments
              </button>
              <h1 className={styles.pageTitle}>
                {loading ? 'Loading...' :
                 department ? `${department.branch} (${department.deptCode})` :
                 deptCode ? `Department ${deptCode}` : 'Department Details'}
              </h1>
              <p className={styles.pageSubtitle}>Manage coordinators and administrators for this department.</p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {/* Toolbar: Name & Role Filters */}
          <div className={styles.actionBar}>
            <div className={styles.toolbarLeft}>
              <div className={styles.filterGroupLarge}>
                <label>Filter by Name:</label>
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Enter staff name"
                  value={filterName}
                  onChange={handleNameFilterChange}
                />
              </div>
              <div className={styles.filterGroup}>
                <label>Filter by Role:</label>
                <select
                  value={filterRole}
                  onChange={(e) => handleRoleFilterChange(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="">All Roles</option>
                  {designations.map(designation => (
                    <option key={designation} value={designation}>
                      {designation}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className={`${styles.clearFiltersBtn} ${styles.clearFiltersInline}`}
                onClick={() => {
                  setFilterName('');
                  setFilterRole('');
                  setCurrentPage(1);
                }}
              >
                Clear All Filters
              </button>
            </div>
            <button
              className={styles.deleteDeptBtn}
              onClick={handleDeleteDepartment}
              disabled={deleting}
            >
              <Trash2 size={20} />
              {deleting ? 'Deleting...' : 'Delete Department'}
            </button>
            <button className={styles.addStaffBtn} onClick={handleOpenAddFaculty}>
              <Plus size={20} />
              Add Staff
            </button>
          </div>

          {/* Staff Table */}
          {loading ? (
            <div className={styles.loadingState}>
              Loading coordinator data...
            </div>
          ) : (
          <div className={styles.tableCard}>
            <div className={styles.tableResponsive}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Staff Name</th>
                    <th>Role / Designation</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th className={styles.textCenter}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStaff.map((staff, index) => (
                    <tr key={staff._id}>
                      <td className={styles.textMuted}>
                        {String((currentPage - 1) * ENTRIES_PER_PAGE + index + 1).padStart(2, '0')}
                      </td>
                      <td className={styles.fontSemibold}>{staff.name}</td>
                      <td>
                        <span className={styles.badgeRole}>{staff.designation}</span>
                      </td>
                      <td className={styles.textMuted}>{staff.email}</td>
                      <td className={styles.fontMono}>{staff.phone || 'N/A'}</td>
                      <td className={styles.textCenter}>
                        <div className={styles.actionGroup}>
                          <button
                            className={styles.viewBtn}
                            onClick={() => handleViewStaff(staff._id)}
                          >
                            <Eye size={16} />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStaff.length === 0 && !loading && (
                    <tr>
                      <td colSpan="6" className={styles.emptyState}>
                        No staff members found matching your search criteria.
                      </td>
                    </tr>
                  )}
                  {paginatedStaff.length === 0 && filteredStaff.length > 0 && (
                    <tr>
                      <td colSpan="6" className={styles.emptyState}>
                        No results for this page. Try a different page or adjust your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className={styles.paginationFooter}>
              <span className={styles.paginationText}>
                Showing {filteredStaff.length > 0 ? (currentPage - 1) * ENTRIES_PER_PAGE + 1 : 0} to{' '}
                {Math.min(currentPage * ENTRIES_PER_PAGE, filteredStaff.length)} of {filteredStaff.length} entries
                {(filterName || filterRole) && ` (filtered from ${staffList.length} total)`}
              </span>
              <div className={styles.paginationControls}>
                <button
                  className={styles.pageBtn}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                {/* Page Numbers */}
                <div className={styles.pageNumbers}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`${styles.pageNumber} ${page === currentPage ? styles.pageNumberActive : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  className={styles.pageBtn}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
          )}

        </div>
      </main>

    </div>
  );
};

export default Admin_View_Department;