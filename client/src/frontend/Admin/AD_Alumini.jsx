import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AD_Alumini.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { Search, UserPlus, Eye } from 'lucide-react';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

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
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

    if (locationFilter) {
      result = result.filter((a) =>
        a.companyAddress?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        a.presentAddress?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (typeFilter) {
      result = result.filter((a) =>
        a.placementType?.toLowerCase().includes(typeFilter.toLowerCase())
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
  }, [searchTerm, designationFilter, locationFilter, typeFilter, batchFilter, alumniData]);

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
            <h1 className={styles.pageTitle}>Alumni Directory</h1>
            <p className={styles.pageSubtitle}>Manage and track your institution's global alumni network.</p>
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
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Search by Location"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              <div className={styles.filterGridRow}>
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Search by Type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
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
              <UserPlus size={32} className={styles.actionIcon} />
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
    </div>
  );
};

export default Admin_Alumini;