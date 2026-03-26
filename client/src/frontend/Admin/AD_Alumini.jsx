import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AD_Alumini.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { Search, UserPlus, Eye, Send, X, Plus, Trash2, Mail } from 'lucide-react';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const createClientTraceId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const logClientStep = (traceId, flow, step, details = {}) => {
  console.log(`[RegistrationMailClient:${traceId}][${flow}][Step ${step}]`, details);
};

const logClientBreak = (traceId, flow, step, reason, details = {}) => {
  console.warn(`[RegistrationMailClient:${traceId}][${flow}][BREAK at Step ${step}] ${reason}`, details);
};

// Helper function to format address object to string
const formatAddress = (address) => {
  if (!address || typeof address !== 'object') return '-';
  const parts = [address.street, address.city, address.pinCode].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '-';
};

const Admin_Alumini = ( { onLogout } ) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [alumniData, setAlumniData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search/Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Registration link popup states
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailList, setEmailList] = useState([]);
  const [emailError, setEmailError] = useState('');
  const [sendingEmails, setSendingEmails] = useState(false);

  // Add email to list
  const handleAddEmail = () => {
    const email = emailInput.trim().toLowerCase();

    if (!email) {
      setEmailError('Please enter an email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Invalid email format');
      return;
    }

    if (emailList.includes(email)) {
      setEmailError('Email already added');
      return;
    }

    setEmailList([...emailList, email]);
    setEmailInput('');
    setEmailError('');
  };

  // Handle Enter key in input
  const handleEmailKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  // Remove email from list
  const handleRemoveEmail = (emailToRemove) => {
    setEmailList(emailList.filter(email => email !== emailToRemove));
  };

  // Send registration links
  const handleSendRegistrationLinks = async () => {
    const clientTraceId = createClientTraceId();
    if (emailList.length === 0) {
      logClientBreak(clientTraceId, 'send-links', 1, 'No emails added');
      setEmailError('Please add at least one email');
      return;
    }

    setSendingEmails(true);
    setEmailError('');
    logClientStep(clientTraceId, 'send-links', 2, {
      emailCount: emailList.length,
      hasAuthToken: Boolean(user?.token),
      apiBaseUrl: API_BASE_URL,
    });

    try {
      const endpoint = `${API_BASE_URL}/api/registration/send-links`;
      logClientStep(clientTraceId, 'send-links', 3, {
        endpoint,
        apiBaseUrl: API_BASE_URL,
        emailCount: emailList.length,
        emails: emailList,
        hasAuthToken: Boolean(user?.token),
        pageOrigin: window.location.origin,
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ emails: emailList }),
      });

      const responseText = await response.text();
      let data = null;

      try {
        logClientStep(clientTraceId, 'send-links', 4, { message: 'Parsing response body' });
        data = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        logClientBreak(clientTraceId, 'send-links', 4, 'Non-JSON response', {
          status: response.status,
          responseText,
          parseError,
        });
      }

      logClientStep(clientTraceId, 'send-links', 5, {
        status: response.status,
        ok: response.ok,
        data,
      });

      if (data?.success) {
        logClientStep(clientTraceId, 'send-links', 6, {
          sent: data.sent,
          failedCount: data.failed?.length || 0,
          failedDetails: data.failed || [],
          serverTraceId: data?.traceId,
          serverStep: data?.step,
        });
        let message = `Successfully sent ${data.sent} registration link(s)!`;
        if (data.failed?.length > 0) {
          message += `\n\nFailed:\n${data.failed.map(f => `${f.email}: ${f.reason}`).join('\n')}`;
        }
        alert(message);
        setShowEmailPopup(false);
        setEmailList([]);
        setEmailInput('');
      } else {
        logClientBreak(clientTraceId, 'send-links', 6, 'API returned non-OK status', {
          status: response.status,
          data,
          serverTraceId: data?.traceId,
          serverFlow: data?.flow,
          serverStep: data?.step,
        });
        setEmailError(data?.message || 'Failed to send links');
      }
    } catch (error) {
      setEmailError('Failed to send registration links. Please try again.');
      logClientBreak(clientTraceId, 'send-links', 7, 'Fetch failed', {
        error,
        message: error?.message,
        stack: error?.stack,
        apiBaseUrl: API_BASE_URL,
      });
    } finally {
      logClientStep(clientTraceId, 'send-links', 8, { message: 'handleSendRegistrationLinks finished' });
      setSendingEmails(false);
    }
  };

  // Close popup and reset
  const handleClosePopup = () => {
    setShowEmailPopup(false);
    setEmailList([]);
    setEmailInput('');
    setEmailError('');
  };

  // Fetch alumni data
  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/alumni/all`, {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setAlumniData(data.alumni);
          setFilteredData(data.alumni);
        } else {
          setError(data.message || 'Failed to fetch alumni');
        }
      } catch (err) {
        setError('Unable to connect to server');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchAlumni();
    }
  }, [user?.token]);

  // Filter alumni based on search criteria
  useEffect(() => {
    let result = alumniData;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.name?.toLowerCase().includes(term) ||
          a.registerNumber?.toLowerCase().includes(term) ||
          a.email?.toLowerCase().includes(term)
      );
    }

    if (designationFilter) {
      result = result.filter((a) =>
        a.designation?.toLowerCase().includes(designationFilter.toLowerCase())
      );
    }

    if (batchFilter) {
      const [yearFrom, yearTo] = batchFilter.split('-');
      result = result.filter(
        (a) => a.yearFrom === parseInt(yearFrom) && a.yearTo === parseInt(yearTo)
      );
    }

    setFilteredData(result);
    setCurrentPage(1);
  }, [searchTerm, designationFilter, batchFilter, alumniData]);

  // Get badge class based on placement type
  const getBadgeClass = (type) => {
    if (!type) return styles.badgeGray;
    const t = type.toLowerCase();
    if (t.includes('product')) return styles.badgeBlue;
    if (t.includes('startup')) return styles.badgePurple;
    if (t.includes('service')) return styles.badgeGreen;
    return styles.badgeGray;
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Get unique batches for dropdown
  const uniqueBatches = [...new Set(alumniData.map((a) => `${a.yearFrom}-${a.yearTo}`))].sort().reverse();

  return (
    <div className={styles.pageContainer}>

      {/* Sidebar */}
        <Sidebar onLogout={onLogout} currentView={'alumini'} />

      {/* Main Content Area */}
      <main className={styles.mainContent}>

        {/* Content Header */}
        <header className={styles.contentHeader}>
          <div className={styles.pageTitleWrapper}>
            <div className={styles.pageHeader}>
              <div>
                <h1 className={styles.pageTitle}>Alumni Directory</h1>
                <p className={styles.pageSubtitle}>Manage and track your institution's global alumni network.</p>
              </div>
              <div className={styles.pageActionButtons}>
                <div className={styles.pageactionCard} onClick={() => setShowEmailPopup(true)} >
                  <Send size={20} className={styles.pageactionIcon} />
                  <span className={styles.pageactionText}>Send Registration Links</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.metricsGrid}>

            {/* Advanced Search Engine */}
            <div className={styles.searchContainer}>
              <div className={styles.searchInputWrapper}>
                <span className={styles.searchIcon}>
                  <Search size={20} />
                </span>
                <input
                  type="text"
                  className={styles.mainSearchInput}
                  placeholder="Search alumni by name, register no, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className={styles.filterGridRow}>
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Search by Designation"
                  value={designationFilter}
                  onChange={(e) => setDesignationFilter(e.target.value)}
                />
                <select
                  className={styles.filterSelect}
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                >
                  <option value="">All Batches</option>
                  {uniqueBatches.map((batch) => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Total Alumni Metric */}
            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Total No. of Alumni</p>
              <h2 className={styles.metricValue}>{alumniData.length.toLocaleString()}</h2>
            </div>

            {/* Action Card */}
            <div className={styles.actionCard} onClick={() => { navigate('/admin/alumini_form') }} >
              <UserPlus size={20} className={styles.actionIcon} />
              <span className={styles.actionText}>+ Add Alumni</span>
            </div>

          </div>
        </header>

        {/* Main Table Area */}
        <section className={styles.tableSection}>
          <div className={styles.tableContainer}>

            {loading ? (
              <div className={styles.loadingState}>Loading alumni data...</div>
            ) : error ? (
              <div className={styles.errorState}>{error}</div>
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
                        <th className={styles.textCenter}>Type</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody className={styles.tableBody}>
                      {paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan="7" className={styles.textCenter}>No alumni found</td>
                        </tr>
                      ) : (
                        paginatedData.map((row, index) => (
                          <tr key={row._id}>
                            <td className={styles.textMuted}>{String(startIndex + index + 1).padStart(2, '0')}</td>
                            <td className={styles.fontSemibold}>{row.name}</td>
                            <td>{row.designation || '-'}</td>
                            <td className={styles.fontMono}>{row.yearFrom}-{row.yearTo}</td>
                            <td>{formatAddress(row.companyAddress || row.presentAddress)}</td>
                            <td className={styles.textCenter}>
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
                                  <Eye size={20} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination Footer */}
                <div className={styles.paginationFooter}>
                  <span className={styles.paginationText}>
                    Showing {filteredData.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
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

      {/* Send Registration Link Popup */}
      {showEmailPopup && (
        <div className={styles.popupOverlay} onClick={handleClosePopup}>
          <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupHeader}>
              <div className={styles.popupHeaderIcon}>
                <Mail size={24} />
              </div>
              <div>
                <h2 className={styles.popupTitle}>Send Registration Links</h2>
                <p className={styles.popupSubtitle}>Enter email addresses to send registration invitations</p>
              </div>
              <button className={styles.popupCloseBtn} onClick={handleClosePopup}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.popupBody}>
              {/* Email Input */}
              <div className={styles.emailInputContainer}>
                <input
                  type="email"
                  className={styles.emailInput}
                  placeholder="Enter email address and press Enter"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setEmailError('');
                  }}
                  onKeyPress={handleEmailKeyPress}
                  disabled={sendingEmails}
                />
                <button
                  className={styles.addEmailBtn}
                  onClick={handleAddEmail}
                  disabled={sendingEmails}
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>

              {emailError && (
                <p className={styles.emailErrorText}>{emailError}</p>
              )}

              {/* Email List */}
              <div className={styles.emailListContainer}>
                {emailList.length === 0 ? (
                  <div className={styles.emptyEmailList}>
                    <Mail size={40} className={styles.emptyIcon} />
                    <p>No emails added yet</p>
                    <span>Add email addresses above to send registration links</span>
                  </div>
                ) : (
                  <>
                    <div className={styles.emailListHeader}>
                      <span>{emailList.length} email{emailList.length > 1 ? 's' : ''} added</span>
                    </div>
                    <div className={styles.emailList}>
                      {emailList.map((email, index) => (
                        <div key={index} className={styles.emailItem}>
                          <Mail size={16} className={styles.emailItemIcon} />
                          <span className={styles.emailItemText}>{email}</span>
                          <button
                            className={styles.removeEmailBtn}
                            onClick={() => handleRemoveEmail(email)}
                            disabled={sendingEmails}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={styles.popupFooter}>
              <button
                className={styles.popupCancelBtn}
                onClick={handleClosePopup}
                disabled={sendingEmails}
              >
                Cancel
              </button>
              <button
                className={styles.popupSendBtn}
                onClick={handleSendRegistrationLinks}
                disabled={emailList.length === 0 || sendingEmails}
              >
                {sendingEmails ? (
                  <>
                    <span className={styles.sendingSpinner}></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send {emailList.length > 0 ? `${emailList.length} Link${emailList.length > 1 ? 's' : ''}` : 'Links'}
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