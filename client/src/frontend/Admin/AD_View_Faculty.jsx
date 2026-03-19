
import { 
  Mail, 
  Users, 
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  MapPin
} from 'lucide-react';
import styles from './AD_View_Faculty.module.css';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';

const Admin_View_Faculty = ( { onLogout } ) => {
  const navigate = useNavigate();

  // Dummy Faculty Data
  const facultyData = {
    id: 'FAC-2045',
    name: 'Dr. Vadin Santhiya G',
    designation: 'HOD & Professor',
    department: 'Computer Science and Engineering (CSE)',
    email: 'hod.cse@ksrce.ac.in',
    phone: '+91 98765 43210',
    location: 'Coimbatore, Tamil Nadu',
    status: 'Active',
    joinDate: '12 Aug, 2015',
    personalInfo: {
      dob: '15 May, 1980',
      gender: 'Female',
      bloodGroup: 'O+',
      address: '123, Faculty Quarters, KSRCE Campus, Tiruchengode - 637215'
    },
    education: [
      { degree: 'Ph.D. in Computer Science', institution: 'Anna University, Chennai', year: '2014' },
      { degree: 'M.E. in Software Engineering', institution: 'PSG College of Technology', year: '2005' },
      { degree: 'B.E. in CSE', institution: 'Government College of Engineering', year: '2002' }
    ],
    experience: '18 Years total (10 Years at KSRCE)',
    publications: 24,
    patents: 2
  };

  const handleBack = () => {
    navigate('/admin/department');
  };

  const handleEdit = () => {
    navigate('/admin/department/edit_faculty');
  };

  const profileInitial = facultyData.name.replace('Dr. ', '').trim().charAt(0).toUpperCase();

  return (
    <div className={styles.dashboardWrapper}>
      <Sidebar currentView={'department'} onLogout={onLogout}  />
      {/* Main Content Area */}
      <main className={styles.mainContent}>

        {/* Dashboard Content Area */}
        <div className={styles.dashboardContent}>
          
          {/* Breadcrumb & Actions */}
          <div className={styles.pageHeader}>
            <div>
              <button className={styles.backBtn} onClick={handleBack}>
                <ArrowLeft size={16} /> Back to Department
              </button>
              <h1 className={styles.pageTitle}>Faculty Profile</h1>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.editBtn} onClick={handleEdit}>
                <Edit size={18} /> Edit Profile
              </button>
              <button className={styles.deleteBtn}>
                <Trash2 size={18} /> Deactivate
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className={styles.profileWrapper}>

            {/* Top Profile Header */}
            <div className={styles.profileHeaderCard}>
              <div className={styles.profileAvatarLarge}>
                <span>{profileInitial}</span>
              </div>
              <div className={styles.profileIntro}>
                <div className={styles.introTop}>
                  <h2>{facultyData.name}</h2>
                  <span className={styles.badgeActive}>{facultyData.status}</span>
                </div>
                <p className={styles.designation}>{facultyData.designation}</p>
                <p className={styles.department}>{facultyData.department}</p>

                <div className={styles.quickContact}>
                  <div className={styles.contactItem}>
                    <Mail size={16} /> <span>{facultyData.email}</span>
                  </div>
                  <div className={styles.contactItem}>
                    <Phone size={16} /> <span>{facultyData.phone}</span>
                  </div>
                  <div className={styles.contactItem}>
                    <MapPin size={16} /> <span>{facultyData.location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className={styles.infoGridLayout}>
              {/* Personal Information */}
              <div className={`${styles.infoCard} ${styles.fullSection}`}>
                <div className={styles.cardHeader}>
                  <Users size={20} className={styles.cardIcon} />
                  <h3>Personal Information</h3>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Staff ID</span>
                    <span className={styles.infoValue}>{facultyData.id}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Date of Birth</span>
                    <span className={styles.infoValue}>{facultyData.personalInfo.dob}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Gender</span>
                    <span className={styles.infoValue}>{facultyData.personalInfo.gender}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Blood Group</span>
                    <span className={styles.infoValue}>{facultyData.personalInfo.bloodGroup}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Date of Joining</span>
                    <span className={styles.infoValue}>{facultyData.joinDate}</span>
                  </div>
                  <div className={`${styles.infoRow} ${styles.fullWidth}`}>
                    <span className={styles.infoLabel}>Residential Address</span>
                    <span className={styles.infoValue}>{facultyData.personalInfo.address}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
};

export default Admin_View_Faculty;