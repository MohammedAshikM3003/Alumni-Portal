import { useState, useMemo, useEffect } from 'react';
import { Plus, Eye, Trash2, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import styles from './AD_View_Department.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';
import { formatBranchName } from '../../utils/formatters';

const API_BASE = import.meta.env.VITE_API_URL;

interface Department {
  _id: string;
  branch: string;
  deptCode: string;
}

interface Staff {
  _id: string;
  name: string;
  designation: string;
  email: string;
  phone?: string;
}

const Admin_View_Department = ( { onLogout }: { onLogout?: () => void } ) => {

  const navigate = useNavigate();
  const { user } = useAuth();
  const { deptCode } = useParams();

  // State for functionality
  const [filterName, setFilterName] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modals state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'success' | 'warning' | 'error';
    onClose?: () => void;
  } | null>(null);

  // Complete Staff Data
  const [staffList, setStaffList] = useState<Staff[]>([]);

  // Fetch department and faculty data
  useEffect(() => {
    const controller = new AbortController();
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
            signal: controller.signal,
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
        const upperCaseDeptCode = deptCode.toUpperCase();
        const coordinatorResponse = await fetch(`${API_BASE}/api/coordinators/department/${upperCaseDeptCode}`, {
            signal: controller.signal,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!coordinatorResponse.ok) {
          const errorText = await coordinatorResponse.text();
          throw new Error(`Failed to fetch coordinator data: ${coordinatorResponse.status} - ${errorText}`);
        }

        const coordinatorData = await coordinatorResponse.json();

        if (coordinatorData.success && coordinatorData.coordinators) {
          setStaffList(coordinatorData.coordinators);
        } else {
          setError(coordinatorData.message || 'Failed to load coordinator data');
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

  // Event handlers
  const handleNameFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterName(e.target.value);
  };

  const handleRoleFilterChange = (designation: string) => {
    setFilterRole(designation);
  };

  // Modal handlers
  const handleOpenAddFaculty = () => {
    navigate(`/admin/department/${deptCode}/add_faculty`);
  };

  const handleViewStaff = (staffId: string) => {
    navigate(`/admin/department/view_faculty/${staffId}`);
  };

  const handleDeleteDepartment = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDepartment = async () => {
    if (!department?._id) {
      setError('Department information not available');
      setShowDeleteConfirm(false);
      return;
    }

    if (!user?.token) {
      setError('Please login to delete departments');
      setShowDeleteConfirm(false);
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
      setShowDeleteConfirm(false);

      if (response.ok && data.success) {
        setAlertModal({
          isOpen: true,
          type: 'success',
          title: 'Department Deleted',
          message: `The "${formatBranchName(department.branch)}" department has been deleted successfully.`,
          onClose: () => navigate('/admin/department'),
        });
      } else {
        setAlertModal({
          isOpen: true,
          type: 'error',
          title: 'Delete Failed',
          message: data.message || 'Failed to delete department',
        });
      }
    } catch (err: any) {
      setShowDeleteConfirm(false);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Delete Failed',
        message: 'Error connecting to server. Please try again.',
      });
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
                 department ? `${formatBranchName(department.branch)} (${department.deptCode})` :
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
                  {filteredStaff.map((staff, index) => (
                    <tr key={staff._id}>
                      <td className={styles.textMuted}>
                        {String(index + 1).padStart(2, '0')}
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
                      <td colSpan={6} className={styles.emptyState}>
                        No staff members found matching your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

        </div>
      </main>

      {/* Delete Department Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.alertModalOverlay} onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div className={styles.alertModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.alertIconCircleRed}>
              <Trash2 size={36} strokeWidth={2.2} />
            </div>
            <h2 className={styles.alertTitle}>Delete Department</h2>
            <p className={styles.alertMessage}>
              Are you sure you want to delete the "{formatBranchName(department?.branch || '')}" department? All associated faculty members will also be removed. This action cannot be undone.
            </p>
            <div className={styles.modalActionButtons}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteModalBtn}
                onClick={confirmDeleteDepartment}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal Popup (Success / Error) */}
      {alertModal?.isOpen && (
        <div
          className={styles.alertModalOverlay}
          onClick={() => {
            if (alertModal.onClose) alertModal.onClose();
            setAlertModal(null);
          }}
        >
          <div className={styles.alertModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={alertModal.type === 'error' ? styles.alertIconCircleRed : styles.alertIconCircle}>
              {alertModal.type === 'error' ? (
                <AlertTriangle size={36} strokeWidth={2.5} />
              ) : (
                <Check size={36} strokeWidth={3} />
              )}
            </div>
            <h2 className={styles.alertTitle}>{alertModal.title}</h2>
            <p className={styles.alertMessage}>{alertModal.message}</p>
            <button
              type="button"
              className={styles.alertOkBtn}
              onClick={() => {
                if (alertModal.onClose) alertModal.onClose();
                setAlertModal(null);
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin_View_Department;