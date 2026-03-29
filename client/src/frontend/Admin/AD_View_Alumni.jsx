import { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  User,
  Building2,
  ArrowLeft,
  Trash2,
  Users,
  Award,
  Heart
} from 'lucide-react';
import styles from './AD_View_Alumni.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatAddress = (address) => {
  if (!address || typeof address !== 'object') return 'N/A';
  const parts = [address.street, address.city, address.pinCode].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'N/A';
};

const Admin_View_Alumni = ({ onLogout }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [alumniData, setAlumniData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchAlumni = async () => {
      if (!user?.token) {
        setError('Please login to view alumni details');
        setLoading(false);
        return;
      }

      try {
        setImageError(false); // Reset image error state
        const response = await fetch(`${API_BASE_URL}/api/alumni/${id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch alumni details');
        }

        const data = await response.json();

        if (data.success && data.alumni) {
          setAlumniData(data.alumni);
        } else {
          setError(data.message || 'Alumni not found');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAlumni();
    }
  }, [id, user]);

  const handleBack = () => {
    navigate('/admin/alumini');
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this alumni?\n\nThis will permanently remove:\n- Alumni profile data\n- Associated user account\n\nThis action cannot be undone.')) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/alumni/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Alumni deleted successfully');
        navigate('/admin/alumini');
      } else {
        alert(data.message || 'Failed to delete alumni');
      }
    } catch (err) {
      alert('Error deleting alumni: ' + err.message);
      console.error('Error deleting alumni:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboardWrapper}>
        <Sidebar currentView={'alumini'} onLogout={onLogout} />
        <main className={styles.mainContent}>
          <div className={styles.dashboardContent}>
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading alumni details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardWrapper}>
        <Sidebar currentView={'alumini'} onLogout={onLogout} />
        <main className={styles.mainContent}>
          <div className={styles.dashboardContent}>
            <p className={styles.error}>{error}</p>
            <button className={styles.backBtn} onClick={handleBack}>
              <ArrowLeft size={16} /> Back to Alumni Directory
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!alumniData) {
    return (
      <div className={styles.dashboardWrapper}>
        <Sidebar currentView={'alumini'} onLogout={onLogout} />
        <main className={styles.mainContent}>
          <div className={styles.dashboardContent}>
            <p>Alumni not found</p>
            <button className={styles.backBtn} onClick={handleBack}>
              <ArrowLeft size={16} /> Back to Alumni Directory
            </button>
          </div>
        </main>
      </div>
    );
  }

  const profileInitial = alumniData.name?.charAt(0).toUpperCase() || 'A';
  const batch = `${alumniData.yearFrom} - ${alumniData.yearTo}`;

  return (
    <div className={styles.dashboardWrapper}>
      <Sidebar currentView={'alumini'} onLogout={onLogout} />

      <main className={styles.mainContent}>
        <div className={styles.dashboardContent}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <button className={styles.backBtn} onClick={handleBack}>
                <ArrowLeft size={16} /> Back to Alumni Directory
              </button>
              <h1 className={styles.pageTitle}>Alumni Profile</h1>
            </div>
          </div>

          {/* Profile Content */}
          <div className={styles.profileWrapper}>
            {/* Top Profile Header Card */}
            <div className={styles.profileHeaderCard}>
              <div className={styles.profileAvatarLarge}>
                {alumniData.profilePhoto && !imageError ? (
                  <img
                    src={
                      alumniData.profilePhoto.startsWith('http')
                        ? alumniData.profilePhoto
                        : alumniData.profilePhoto.startsWith('/api')
                          ? `${API_BASE_URL}${alumniData.profilePhoto}`
                          : `${API_BASE_URL}/api/images/${alumniData.profilePhoto}`
                    }
                    alt={alumniData.name}
                    className={styles.avatarImage}
                    onError={(e) => {
                      console.error('Failed to load profile photo:', alumniData.profilePhoto);
                      setImageError(true);
                    }}
                  />
                ) : (
                  <span>{profileInitial}</span>
                )}
              </div>
              <div className={styles.profileIntro}>
                <div className={styles.introTop}>
                  <h2>{alumniData.name}</h2>
                  <span className={`${styles.badge} ${alumniData.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                    {alumniData.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {alumniData.placementType && (
                    <span className={`${styles.badge} ${styles.badgePlacement}`}>
                      {alumniData.placementType}
                    </span>
                  )}
                </div>
                <p className={styles.designation}>{alumniData.designation || 'Alumni'}</p>
                <p className={styles.department}>{alumniData.branch} | Batch: {batch}</p>

                <div className={styles.quickContact}>
                  <div className={styles.contactItem}>
                    <Mail size={16} /> <span>{alumniData.email}</span>
                  </div>
                  {alumniData.presentAddress?.mobile && (
                    <div className={styles.contactItem}>
                      <Phone size={16} /> <span>{alumniData.presentAddress.mobile}</span>
                    </div>
                  )}
                  {alumniData.presentAddress && (
                    <div className={styles.contactItem}>
                      <MapPin size={16} /> <span>{formatAddress(alumniData.presentAddress)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className={styles.infoGridLayout}>
              {/* Personal Information */}
              <div className={styles.infoCard}>
                <div className={styles.cardHeader}>
                  <User size={20} className={styles.cardIcon} />
                  <h3>Personal Information</h3>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Register Number</span>
                    <span className={styles.infoValue}>{alumniData.registerNumber}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Father's Name</span>
                    <span className={styles.infoValue}>{alumniData.fatherName || 'N/A'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Date of Birth</span>
                    <span className={styles.infoValue}>{formatDate(alumniData.dob)}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Email</span>
                    <span className={styles.infoValue}>{alumniData.email}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Marital Status</span>
                    <span className={styles.infoValue}>{alumniData.maritalStatus || 'N/A'}</span>
                  </div>
                  {alumniData.maritalStatus === 'Married' && alumniData.spouseDetails && (
                    <>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Spouse Name</span>
                        <span className={styles.infoValue}>{alumniData.spouseDetails.name || 'N/A'}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Spouse Qualification</span>
                        <span className={styles.infoValue}>{alumniData.spouseDetails.qualification || 'N/A'}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Children</span>
                        <span className={styles.infoValue}>{alumniData.spouseDetails.numberOfChildren || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Academic Information */}
              <div className={styles.infoCard}>
                <div className={styles.cardHeader}>
                  <GraduationCap size={20} className={styles.cardIcon} />
                  <h3>Academic Information</h3>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Degree</span>
                    <span className={styles.infoValue}>{alumniData.degree}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Branch</span>
                    <span className={styles.infoValue}>{alumniData.branch}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Batch</span>
                    <span className={styles.infoValue}>{batch}</span>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className={styles.infoCard}>
                <div className={styles.cardHeader}>
                  <MapPin size={20} className={styles.cardIcon} />
                  <h3>Address Information</h3>
                </div>
                <div className={styles.cardBody}>
                  <div className={`${styles.infoRow} ${styles.fullWidth}`}>
                    <span className={styles.infoLabel}>Present Address</span>
                    <span className={styles.infoValue}>
                      {formatAddress(alumniData.presentAddress)}
                      {alumniData.presentAddress?.mobile && ` | Mobile: ${alumniData.presentAddress.mobile}`}
                    </span>
                  </div>
                  <div className={`${styles.infoRow} ${styles.fullWidth}`}>
                    <span className={styles.infoLabel}>Permanent Address</span>
                    <span className={styles.infoValue}>
                      {formatAddress(alumniData.permanentAddress)}
                      {alumniData.permanentAddress?.mobile && ` | Mobile: ${alumniData.permanentAddress.mobile}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div className={styles.infoCard}>
                <div className={styles.cardHeader}>
                  <Briefcase size={20} className={styles.cardIcon} />
                  <h3>Employment Information</h3>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Placement Type</span>
                    <span className={styles.infoValue}>{alumniData.placementType || 'N/A'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Designation</span>
                    <span className={styles.infoValue}>{alumniData.designation || 'N/A'}</span>
                  </div>
                  <div className={`${styles.infoRow} ${styles.fullWidth}`}>
                    <span className={styles.infoLabel}>Company Address</span>
                    <span className={styles.infoValue}>{alumniData.companyAddress || 'N/A'}</span>
                  </div>
                  {alumniData.employmentRemarks && (
                    <div className={`${styles.infoRow} ${styles.fullWidth}`}>
                      <span className={styles.infoLabel}>Remarks</span>
                      <span className={styles.infoValue}>{alumniData.employmentRemarks}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Entrepreneur Details (if applicable) */}
              {alumniData.isEntrepreneur && alumniData.entrepreneurDetails && (
                <div className={styles.infoCard}>
                  <div className={styles.cardHeader}>
                    <Building2 size={20} className={styles.cardIcon} />
                    <h3>Entrepreneur Details</h3>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Organization Name</span>
                      <span className={styles.infoValue}>{alumniData.entrepreneurDetails.organizationName || 'N/A'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Nature of Work</span>
                      <span className={styles.infoValue}>{alumniData.entrepreneurDetails.natureOfWork || 'N/A'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Annual Turnover</span>
                      <span className={styles.infoValue}>{alumniData.entrepreneurDetails.annualTurnover || 'N/A'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Number of Employees</span>
                      <span className={styles.infoValue}>{alumniData.entrepreneurDetails.numberOfEmployees || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Competitive Exams (if applicable) */}
              {alumniData.hasCompetitiveExams && alumniData.competitiveExams?.length > 0 && (
                <div className={styles.infoCard}>
                  <div className={styles.cardHeader}>
                    <Award size={20} className={styles.cardIcon} />
                    <h3>Competitive Exams</h3>
                  </div>
                  <div className={styles.cardBody}>
                    {alumniData.competitiveExams.map((exam, index) => (
                      <div key={index} className={styles.infoRow}>
                        <span className={styles.infoLabel}>{exam.examName}</span>
                        <span className={styles.infoValue}>{exam.marks}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* College Qualifications (if applicable) */}
              {alumniData.collegeQualifications?.length > 0 && (
                <div className={`${styles.infoCard} ${styles.fullSection}`}>
                  <div className={styles.cardHeader}>
                    <GraduationCap size={20} className={styles.cardIcon} />
                    <h3>Educational Qualifications</h3>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.timeline}>
                      {alumniData.collegeQualifications.map((qual, index) => (
                        <div key={index} className={styles.timelineItem}>
                          <div className={styles.timelineDot}></div>
                          <div className={styles.timelineContent}>
                            <p className={styles.degreeTitle}>{qual.course}</p>
                            <p className={styles.institutionName}>{qual.institution}</p>
                            <div className={styles.qualificationMeta}>
                              {qual.yearOfPassing && (
                                <span className={styles.passingYear}>{qual.yearOfPassing}</span>
                              )}
                              {qual.percentage && (
                                <span className={styles.percentage}>{qual.percentage}%</span>
                              )}
                              {qual.boardUniversity && (
                                <span className={styles.board}>{qual.boardUniversity}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Known Alumni (if applicable) */}
              {alumniData.knownAlumni?.length > 0 && (
                <div className={`${styles.infoCard} ${styles.fullSection}`}>
                  <div className={styles.cardHeader}>
                    <Users size={20} className={styles.cardIcon} />
                    <h3>Known Alumni</h3>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.knownAlumniGrid}>
                      {alumniData.knownAlumni.map((known, index) => (
                        <div key={index} className={styles.knownAlumniCard}>
                          <div className={styles.knownAlumniAvatar}>
                            {known.name?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <div className={styles.knownAlumniInfo}>
                            <p className={styles.knownAlumniName}>{known.name}</p>
                            <p className={styles.knownAlumniDetails}>
                              {known.degree} | Batch: {known.batch}
                            </p>
                            {known.email && (
                              <p className={styles.knownAlumniContact}>
                                <Mail size={12} /> {known.email}
                              </p>
                            )}
                            {known.phone && (
                              <p className={styles.knownAlumniContact}>
                                <Phone size={12} /> {known.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Extra Curricular & Other Info */}
              {(alumniData.extraCurricular || alumniData.otherInfo) && (
                <div className={`${styles.infoCard} ${styles.fullSection}`}>
                  <div className={styles.cardHeader}>
                    <Heart size={20} className={styles.cardIcon} />
                    <h3>Additional Information</h3>
                  </div>
                  <div className={styles.cardBody}>
                    {alumniData.extraCurricular && (
                      <div className={`${styles.infoRow} ${styles.fullWidth}`}>
                        <span className={styles.infoLabel}>Extra Curricular Activities</span>
                        <span className={styles.infoValue}>{alumniData.extraCurricular}</span>
                      </div>
                    )}
                    {alumniData.otherInfo && (
                      <div className={`${styles.infoRow} ${styles.fullWidth}`}>
                        <span className={styles.infoLabel}>Other Information</span>
                        <span className={styles.infoValue}>{alumniData.otherInfo}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Delete Button at Bottom */}
            <div className={styles.deleteSection}>
              <div className={styles.deleteWarningCard}>
                <div className={styles.deleteWarningContent}>
                  <Trash2 size={24} className={styles.deleteWarningIcon} />
                  <div>
                    <h4>Delete Alumni Record</h4>
                    <p>Permanently remove this alumni from the system. This action cannot be undone.</p>
                  </div>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <span className={styles.btnSpinner}></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete Alumni
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin_View_Alumni;
