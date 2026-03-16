import { useState, useMemo } from 'react';
import { Plus, Eye, Trash2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './AD_View_Department.module.css';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';

const Admin_View_Department = ( { onLogout } ) => {

  const navigate = useNavigate();

  // State for functionality
  const [filterName, setFilterName] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ENTRIES_PER_PAGE = 10;

  // Complete Staff Data
  const [staffList, setStaffList] = useState([
    { id: 1, name: 'Dr. Vadin Santhiya G', designation: 'HOD & Professor', email: 'hod.cse@ksrce.ac.in', phone: '+91 98765 43210' },
    { id: 2, name: 'Prof. Ramesh Kumar', designation: 'Associate Professor', email: 'ramesh.k@ksrce.ac.in', phone: '+91 98765 43211' },
    { id: 3, name: 'Dr. Anita Sharma', designation: 'Assistant Professor', email: 'anita.s@ksrce.ac.in', phone: '+91 98765 43212' },
    { id: 4, name: 'Mr. Karthik Raj', designation: 'Assistant Professor', email: 'karthik.r@ksrce.ac.in', phone: '+91 98765 43213' },
    { id: 5, name: 'Mrs. Priya Dharshini', designation: 'Lab Administrator', email: 'priya.d@ksrce.ac.in', phone: '+91 98765 43214' },
    { id: 6, name: 'Dr. Rajesh Mehta', designation: 'Professor', email: 'rajesh.m@ksrce.ac.in', phone: '+91 98765 43215' },
    { id: 7, name: 'Prof. Sunitha Nair', designation: 'Associate Professor', email: 'sunitha.n@ksrce.ac.in', phone: '+91 98765 43216' },
    { id: 8, name: 'Dr. Vikram Singh', designation: 'Assistant Professor', email: 'vikram.s@ksrce.ac.in', phone: '+91 98765 43217' },
    { id: 9, name: 'Ms. Deepa Latha', designation: 'Assistant Professor', email: 'deepa.l@ksrce.ac.in', phone: '+91 98765 43218' },
    { id: 10, name: 'Mr. Arjun Prasad', designation: 'Lab Administrator', email: 'arjun.p@ksrce.ac.in', phone: '+91 98765 43219' },
    { id: 11, name: 'Dr. Kavitha Reddy', designation: 'Professor', email: 'kavitha.r@ksrce.ac.in', phone: '+91 98765 43220' },
    { id: 12, name: 'Prof. Manoj Gupta', designation: 'Associate Professor', email: 'manoj.g@ksrce.ac.in', phone: '+91 98765 43221' },
    { id: 13, name: 'Dr. Swathi Krishnan', designation: 'Assistant Professor', email: 'swathi.k@ksrce.ac.in', phone: '+91 98765 43222' },
    { id: 14, name: 'Mr. Naveen Kumar', designation: 'Assistant Professor', email: 'naveen.k@ksrce.ac.in', phone: '+91 98765 43223' },
    { id: 15, name: 'Mrs. Lakshmi Priya', designation: 'Lab Administrator', email: 'lakshmi.p@ksrce.ac.in', phone: '+91 98765 43224' },
    { id: 16, name: 'Dr. Radhika Iyer', designation: 'Professor', email: 'radhika.i@ksrce.ac.in', phone: '+91 98765 43225' },
    { id: 17, name: 'Prof. Suresh Babu', designation: 'Associate Professor', email: 'suresh.b@ksrce.ac.in', phone: '+91 98765 43226' },
    { id: 18, name: 'Dr. Meera Joshi', designation: 'Assistant Professor', email: 'meera.j@ksrce.ac.in', phone: '+91 98765 43227' },
  ]);

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
    navigate('/admin/department/add_faculty');
  };

  const handleViewStaff = () => {
    navigate('/admin/department/view_faculty');
  };

  const handleDeleteDepartment = () => {
    if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      navigate('/admin/department');
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
              <h1 className={styles.pageTitle}>Computer Science and Engineering (CSE)</h1>
              <p className={styles.pageSubtitle}>Manage staff, faculty, and administrators for this department.</p>
            </div>
          </div>

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
            <button className={styles.deleteDeptBtn} onClick={handleDeleteDepartment}>
              <Trash2 size={20} />
              Delete Department
            </button>
            <button className={styles.addStaffBtn} onClick={handleOpenAddFaculty}>
              <Plus size={20} />
              Add Staff
            </button>
          </div>

          {/* Staff Table */}
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
                    <tr key={staff.id}>
                      <td className={styles.textMuted}>
                        {String((currentPage - 1) * ENTRIES_PER_PAGE + index + 1).padStart(2, '0')}
                      </td>
                      <td className={styles.fontSemibold}>{staff.name}</td>
                      <td>
                        <span className={styles.badgeRole}>{staff.designation}</span>
                      </td>
                      <td className={styles.textMuted}>{staff.email}</td>
                      <td className={styles.fontMono}>{staff.phone}</td>
                      <td className={styles.textCenter}>
                        <div className={styles.actionGroup}>
                          <button
                            className={styles.viewBtn}
                            onClick={() => handleViewStaff()}
                          >
                            <Eye size={16} />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStaff.length === 0 && (
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

        </div>
      </main>

    </div>
  );
};

export default Admin_View_Department;