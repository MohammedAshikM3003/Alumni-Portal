import { useState, useEffect, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Plus, Users, Award, X, Send, Mail } from 'lucide-react';
import styles from './AD_Alumini.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface Address {
  street?: string;
  city?: string;
  pinCode?: string;
  mobile?: string;
}

interface Alumni {
  _id: string;
  name: string;
  registerNumber?: string;
  email: string;
  branch?: string;
  degree?: string;
  designation?: string;
  yearFrom: number;
  yearTo: number;
  placementType?: string;
  companyAddress?: string | Address;
  presentAddress?: Address;
}

interface Department {
  _id: string;
  stream: string;
  branch: string;
  deptCode: string;
}

interface ApiAlumniResponse {
  success: boolean;
  alumni?: Alumni[];
  message?: string;
}

const formatAddress = (address: string | Address | null | undefined): string => {
  if (!address) return '-';
  if (typeof address === 'string') return address;
  const parts = [address.street, address.city, address.pinCode].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '-';
};

interface AdminAluminiProps {
  onLogout: () => void;
}

const Admin_Alumini: FC<AdminAluminiProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [alumniData, setAlumniData] = useState<Alumni[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredData, setFilteredData] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Search/filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Popup/Modal states
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>('');
  const [emailsList, setEmailsList] = useState<string[]>([]);
  const [popupError, setPopupError] = useState<string>('');
  const [isSendingLinks, setIsSendingLinks] = useState<boolean>(false);
  const [popupMessage, setPopupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddEmail = () => {
    const trimmed = emailInput.trim();
    if (!trimmed) return;
    
    // Validate email pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setPopupError('Please enter a valid email address');
      return;
    }

    if (emailsList.includes(trimmed)) {
      setPopupError('This email address has already been added');
      return;
    }

    setEmailsList((prev) => [...prev, trimmed]);
    setEmailInput('');
    setPopupError('');
  };

  const handleRemoveEmail = (idxToRemove: number) => {
    setEmailsList((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSendLinks = async () => {
    if (emailsList.length === 0) return;
    setIsSendingLinks(true);
    setPopupMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/registration/send-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          emails: emailsList,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPopupMessage({
          type: 'success',
          text: `Registration invitation ${emailsList.length > 1 ? 'links' : 'link'} sent successfully!`,
        });
        setEmailsList([]);
        setEmailInput('');
        
        // Auto close after 2 seconds
        setTimeout(() => {
          setIsPopupOpen(false);
          setPopupMessage(null);
        }, 2000);
      } else {
        setPopupMessage({
          type: 'error',
          text: data.message || 'Failed to send registration links',
        });
      }
    } catch {
      setPopupMessage({
        type: 'error',
        text: 'Error connecting to server. Please try again.',
      });
    } finally {
      setIsSendingLinks(false);
    }
  };

  // Fetch alumni list and departments list
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async (): Promise<void> => {
      if (!user?.token) {
        setError('Please login to view alumni');
        setLoading(false);
        return;
      }

      try {
        // Fetch all alumni
        const alumniRes = await fetch(`${API_BASE_URL}/api/alumni/all`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const alumniResponse: ApiAlumniResponse = await alumniRes.json();

        if (alumniResponse.success && alumniResponse.alumni) {
          setAlumniData(alumniResponse.alumni);
          setFilteredData(alumniResponse.alumni);
        } else {
          setError(alumniResponse.message || 'Failed to fetch alumni');
        }

        // Fetch departments for filter dropdown
        const deptRes = await fetch(`${API_BASE_URL}/api/departments`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const deptData = await deptRes.json();
        if (Array.isArray(deptData)) {
          setDepartments(deptData);
        } else if (deptData.success && Array.isArray(deptData.departments)) {
          setDepartments(deptData.departments);
        }
      } catch {
        setError('Unable to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [user?.token]);

  // Apply search and filters
  useEffect(() => {
    let result = alumniData;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.name?.toLowerCase().includes(term) ||
          a.registerNumber?.toLowerCase().includes(term) ||
          a.email?.toLowerCase().includes(term) ||
          a.designation?.toLowerCase().includes(term)
      );
    }

    if (selectedBranch) {
      result = result.filter((a) => a.branch === selectedBranch);
    }

    if (selectedBatch) {
      const [yearFrom, yearTo] = selectedBatch.split('-');
      result = result.filter((a) => a.yearFrom === parseInt(yearFrom, 10) && a.yearTo === parseInt(yearTo, 10));
    }

    setFilteredData(result);
    setCurrentPage(1);
  }, [searchTerm, selectedBranch, selectedBatch, alumniData]);



  const getBadgeClass = (type: string | null | undefined): string => {
    if (!type) return styles.badgeGray;
    const t = type.toLowerCase();
    if (t.includes('product')) return styles.badgeBlue;
    if (t.includes('startup')) return styles.badgePurple;
    if (t.includes('service')) return styles.badgeGreen;
    return styles.badgeGray;
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const uniqueBatches = [...new Set(alumniData.map((a) => `${a.yearFrom}-${a.yearTo}`))].sort().reverse();

  return (
    <div className={styles.pageContainer}>
      <Sidebar onLogout={onLogout} currentView={'alumini'} />

      <main className={styles.mainContent}>
        <header className={styles.contentHeader}>
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Alumni Directory</h1>
              <p className={styles.pageSubtitle}>
                Manage and track your institution's global alumni network.
              </p>
            </div>
            <div className={styles.pageActionButtons}>
              <button
                className={styles.primaryActionBtn}
                onClick={() => navigate('/admin/alumini_form')}
              >
                <Plus size={18} />
                Add Alumni
              </button>
              <button
                className={styles.secondaryActionBtn}
                onClick={() => setIsPopupOpen(true)}
              >
                <Send size={18} />
                Send Registration Link
              </button>
            </div>
          </div>

          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#eaf6ed', color: '#2e6f40' }}>
                <Users size={24} />
              </div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>Total Alumni</p>
                <h2 className={styles.kpiValue}>{alumniData.length.toLocaleString()}</h2>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                <Award size={24} />
              </div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>Active Filters Match</p>
                <h2 className={styles.kpiValue}>{filteredData.length.toLocaleString()}</h2>
              </div>
            </div>
          </div>
        </header>

        {/* Filter and Search Bar */}
        <div style={{ padding: '0 2.5rem 1rem 2.5rem' }}>
          <div className={styles.filterBar}>
            <div className={styles.searchInputWrapper}>
              <span className={styles.searchIcon}>
                <Search size={18} />
              </span>
              <input
                type="text"
                className={styles.mainSearchInput}
                placeholder="Search alumni by name, register no, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className={styles.filterControls}>
              <select
                className={styles.filterSelect}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="">All Branches</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept.branch}>
                    {dept.branch}
                  </option>
                ))}
              </select>

              <select
                className={styles.filterSelect}
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="">All Batches</option>
                {uniqueBatches.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>

              {(searchTerm || selectedBranch || selectedBatch) && (
                <button
                  className={styles.clearFilterBtn}
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedBranch('');
                    setSelectedBatch('');
                  }}
                  title="Clear all active search and filter options"
                >
                  <X size={16} style={{ marginRight: '6px' }} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <section className={styles.tableSection}>
          <div className={styles.tableContainer}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>Loading alumni data...</div>
            ) : error ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444', fontWeight: 600 }}>{error}</div>
            ) : (
              <>
                <div className={styles.tableResponsive}>
                  <table className={styles.dataTable}>
                    <thead className={styles.tableHead}>
                      <tr>
                        <th>S.No</th>
                        <th>Name</th>
                        <th>Designation</th>
                        <th>Batch</th>
                        <th>Location</th>
                        <th>Type</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody className={styles.tableBody}>
                      {paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className={styles.textCenter} style={{ padding: '3rem', color: '#94a3b8' }}>
                            No alumni found matching active filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedData.map((row, index) => (
                          <tr key={row._id}>
                            <td className={styles.textMuted}>
                              {String(startIndex + index + 1).padStart(2, '0')}
                            </td>
                            <td className={styles.fontSemibold}>{row.name}</td>
                            <td>{row.designation || '-'}</td>
                            <td>
                              {row.yearFrom}-{row.yearTo}
                            </td>
                            <td>{formatAddress(row.companyAddress || row.presentAddress)}</td>
                            <td>
                              <span className={`${styles.badge} ${getBadgeClass(row.placementType)}`}>
                                {row.placementType || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <div className={styles.actionWrapper}>
                                <button
                                  className={styles.viewBtn}
                                  title="View Details"
                                  onClick={() => navigate(`/admin/alumini/${row._id}`)}
                                >
                                  <Eye size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className={styles.paginationFooter}>
                  <span className={styles.paginationText}>
                    Showing {filteredData.length === 0 ? 0 : startIndex + 1} to{' '}
                    {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
                  </span>
                  <div className={styles.paginationControls}>
                    <button
                      className={styles.pageBtn}
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </button>
                    <button
                      className={styles.pageBtn}
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Registration Link Popup */}
      {isPopupOpen && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <div className={styles.popupHeader}>
              <div className={styles.popupHeaderIcon}>
                <Mail size={22} />
              </div>
              <div>
                <h2 className={styles.popupTitle}>Send Registration Links</h2>
                <p className={styles.popupSubtitle}>
                  Enter email addresses to send registration invitations
                </p>
              </div>
              <button
                className={styles.popupCloseBtn}
                onClick={() => {
                  setIsPopupOpen(false);
                  setEmailInput('');
                  setEmailsList([]);
                  setPopupError('');
                  setPopupMessage(null);
                }}
                disabled={isSendingLinks}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.popupBody}>
              <div className={styles.emailInputContainer}>
                <input
                  type="email"
                  className={styles.emailInput}
                  placeholder="Enter email address and press Enter"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setPopupError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEmail();
                    }
                  }}
                  disabled={isSendingLinks}
                />
                <button
                  className={styles.addEmailBtn}
                  onClick={handleAddEmail}
                  disabled={isSendingLinks || !emailInput.trim()}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>

              {popupError && <p className={styles.emailErrorText}>{popupError}</p>}

              <div className={styles.emailListContainer}>
                {emailsList.length === 0 ? (
                  <div className={styles.emptyEmailList}>
                    <Mail className={styles.emptyIcon} size={40} />
                    <p>No emails added yet</p>
                    <span>Add email addresses above to send registration links</span>
                  </div>
                ) : (
                  <>
                    <div className={styles.emailListHeader}>
                      Added Emails ({emailsList.length})
                    </div>
                    <div className={styles.emailList}>
                      {emailsList.map((email, idx) => (
                        <div key={idx} className={styles.emailItem}>
                          <Mail className={styles.emailItemIcon} size={14} />
                          <span className={styles.emailItemText}>{email}</span>
                          <button
                            className={styles.removeEmailBtn}
                            onClick={() => handleRemoveEmail(idx)}
                            disabled={isSendingLinks}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {popupMessage && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    backgroundColor: popupMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    color: popupMessage.type === 'success' ? '#15803d' : '#ef4444',
                    border: `1px solid ${popupMessage.type === 'success' ? '#bbf7d0' : '#fca5a5'}`,
                  }}
                >
                  {popupMessage.text}
                </div>
              )}
            </div>

            <div className={styles.popupFooter}>
              <button
                className={styles.popupCancelBtn}
                onClick={() => {
                  setIsPopupOpen(false);
                  setEmailInput('');
                  setEmailsList([]);
                  setPopupError('');
                  setPopupMessage(null);
                }}
                disabled={isSendingLinks}
              >
                Cancel
              </button>
              <button
                className={styles.popupSendBtn}
                onClick={handleSendLinks}
                disabled={isSendingLinks || emailsList.length === 0}
              >
                {isSendingLinks ? (
                  <>
                    <span className={styles.sendingSpinner}></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Send Links
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin_Alumini;
