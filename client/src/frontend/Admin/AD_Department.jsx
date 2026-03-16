import React, { useState } from 'react';
import styles from './AD_Department.module.css';
import { LayoutDashboard, Mail, Users, Briefcase, Heart, Calendar, MessageSquare, Building2, Search, Plus, Eye, X } from 'lucide-react';
import Sidebar from './Components/Sidebar/Sidebar';
import { useNavigate } from 'react-router-dom';

const Admin_Department = ( { onLogout } ) => {

    const navigate = useNavigate();
  // Navigation Links
  const navLinks = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', active: false },
    { icon: <Mail size={20} />, label: 'Mail', active: false },
    { icon: <Users size={20} />, label: 'Alumni', active: false },
    { icon: <Briefcase size={20} />, label: 'Job & Reference', active: false },
    { icon: <Heart size={20} />, label: 'Donation', active: false },
    { icon: <Calendar size={20} />, label: 'Events & Reunion', active: false },
    { icon: <MessageSquare size={20} />, label: 'Feedback', active: false },
    { icon: <Building2 size={20} />, label: 'Departments', active: true }, // Active Item
  ];

  // State Management
  const [departments, setDepartments] = useState([
    { id: 1, stream: 'B.E', branch: 'Computer Science and Engineering', deptCode: 'CSE', alumniCount: 1250 },
    { id: 2, stream: 'B.Tech', branch: 'Information Technology', deptCode: 'IT', alumniCount: 840 },
    { id: 3, stream: 'B.E', branch: 'Electronics and Communication', deptCode: 'ECE', alumniCount: 1100 },
    { id: 4, stream: 'B.E', branch: 'Mechanical Engineering', deptCode: 'MECH', alumniCount: 1420 },
    { id: 5, stream: 'B.E', branch: 'Computer Science and Engineering', deptCode: 'CSE', alumniCount: 1250 },
    { id: 6, stream: 'B.Tech', branch: 'Information Technology', deptCode: 'IT', alumniCount: 840 },
    { id: 7, stream: 'B.E', branch: 'Electronics and Communication', deptCode: 'ECE', alumniCount: 1100 },
    { id: 8, stream: 'B.E', branch: 'Mechanical Engineering', deptCode: 'MECH', alumniCount: 1420 },
    { id: 9, stream: 'B.E', branch: 'Computer Science and Engineering', deptCode: 'CSE', alumniCount: 1250 },
    { id: 10, stream: 'B.Tech', branch: 'Information Technology', deptCode: 'IT', alumniCount: 840 },
    { id: 11, stream: 'B.E', branch: 'Electronics and Communication', deptCode: 'ECE', alumniCount: 1100 },
    { id: 12, stream: 'B.E', branch: 'Mechanical Engineering', deptCode: 'MECH', alumniCount: 1420 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    stream: '',
    branch: '',
    deptCode: ''
  });

  // Simple Modal Handlers
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFormData({ stream: '', branch: '', deptCode: '' });
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
  const handleSubmit = (e) => {
    e.preventDefault();
    const newDept = {
      id: Date.now(),
      ...formData,
      alumniCount: 0
    };
    setDepartments([...departments, newDept]);
    handleCloseModal();
  };

  const handleView = () => {
    navigate('/admin/department/view_department'); 
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
                <div className={styles.statNumber}>{departments.reduce((total, dept) => total + dept.alumniCount, 0)}</div>
                <div className={styles.statLabel}>Total Coordinators</div>
              </div>
            <button className={styles.addBtn} onClick={handleOpenModal}>
              <Plus size={20} />
              Add Department
            </button>
            </div>
          </div>


          {/* Department Table */}
          <div className={styles.tableCard}>
            <div className={styles.tableResponsive}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Stream</th>
                    <th>Branch Name</th>
                    <th>Dept Code</th>
                    <th className={styles.textCenter}>Alumni Records</th>
                    <th className={styles.textCenter}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept, index) => (
                    <tr key={dept.id}>
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
                  {departments.length === 0 && (
                    <tr>
                      <td colSpan="6" className={styles.emptyState}>No departments found. Add a new one to get started.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

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
              <div className={styles.formGroup}>
                <label>Stream</label>
                <select
                  name="stream"
                  value={formData.stream}
                  onChange={handleInputChange}
                  required
                  className={styles.formInput}
                >
                  <option value="">Select Stream</option>
                  <option value="B.E">B.E</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="M.E">M.E</option>
                  <option value="MBA">MBA</option>
                  <option value="MCA">MCA</option>
                </select>
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
                <button type="submit" className={styles.submitBtn}>
                  Save Department
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