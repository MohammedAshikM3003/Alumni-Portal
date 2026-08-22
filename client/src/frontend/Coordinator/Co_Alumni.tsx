import { useState, useEffect, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Building2 } from 'lucide-react';
import styles from './Co_Alumni.module.css';
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
  designation?: string;
  yearFrom: number;
  yearTo: number;
  placementType?: string;
  companyAddress?: string | Address;
  presentAddress?: Address;
}

interface CoordinatorData {
  department: string;
  [key: string]: any;
}

interface ApiAlumniResponse {
  success: boolean;
  alumni?: Alumni[];
  message?: string;
}

interface ApiCoordinatorResponse {
  success: boolean;
  data?: CoordinatorData;
}

const formatAddress = (address: string | Address | null | undefined): string => {
  if (!address) return '-';
  if (typeof address === 'string') return address;
  const parts = [address.street, address.city, address.pinCode].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '-';
};

interface CoordinatorAlumniProps {
  onLogout: () => void;
}

const Coordinator_Alumni: FC<CoordinatorAlumniProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [coordinatorData, setCoordinatorData] = useState<CoordinatorData | null>(null);
  const [alumniData, setAlumniData] = useState<Alumni[]>([]);
  const [filteredData, setFilteredData] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Search/filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Fetch coordinator profile and department alumni
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async (): Promise<void> => {
      if (!user?.token) {
        setError('Please login to view alumni');
        setLoading(false);
        return;
      }

      try {
        const coordRes = await fetch(`${API_BASE_URL}/api/coordinators/profile/me`, {
            signal: controller.signal,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const coordData: ApiCoordinatorResponse = await coordRes.json();

        if (!coordData.success || !coordData.data) {
          setError('Failed to fetch coordinator profile');
          setLoading(false);
          return;
        }

        setCoordinatorData(coordData.data);
        const department = coordData.data.department;

        const alumniRes = await fetch(`${API_BASE_URL}/api/alumni/all?branch=${encodeURIComponent(department)}`, {
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
          a.email?.toLowerCase().includes(term)
      );
    }

    if (filterType) {
      switch (filterType) {
        case 'department':
          result = [...result].sort((a, b) => (a.branch || '').localeCompare(b.branch || ''));
          break;
        case 'designation':
          result = [...result].sort((a, b) => (a.designation || '').localeCompare(b.designation || ''));
          break;
        case 'name':
          result = [...result].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          break;
        case 'type':
          result = [...result].sort((a, b) => (a.placementType || '').localeCompare(b.placementType || ''));
          break;
        default:
          break;
      }
    }

    if (batchFilter) {
      const [yearFrom, yearTo] = batchFilter.split('-');
      result = result.filter((a) => a.yearFrom === parseInt(yearFrom, 10) && a.yearTo === parseInt(yearTo, 10));
    }

    setFilteredData(result);
    setCurrentPage(1);
  }, [searchTerm, filterType, batchFilter, alumniData]);

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
      <Sidebar onLogout={onLogout} currentView={'alumni'} />

      <main className={styles.mainContent}>
        <header className={styles.contentHeader}>
          <div className={styles.pageTitleWrapper}>
            <div className={styles.pageHeader}>
              <div>
                <h1 className={styles.pageTitle}>Alumni Directory</h1>
                <p className={styles.pageSubtitle}>
                  Manage and track your department alumni network.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.metricsGrid}>
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
                <select
                  className={styles.filterSelect}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Select Filter</option>
                  <option value="designation">By Designation</option>
                  <option value="name">By Name</option>
                  <option value="type">By Type</option>
                </select>

                <select
                  className={styles.filterSelect}
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                >
                  <option value="">All Batches</option>
                  {uniqueBatches.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.metricCard}>
              <p className={styles.metricLabel}>Total No. of Alumni</p>
              <h2 className={styles.metricValue}>{alumniData.length.toLocaleString()}</h2>
            </div>

            <div className={styles.scopeCard}>
              <Building2 size={20} className={styles.scopeIcon} />
              <p className={styles.scopeLabel}>Department Scope</p>
              <h2 className={styles.scopeValue}>{coordinatorData?.department || 'N/A'}</h2>
              <p className={styles.scopeHint}>Showing only your mapped department</p>
            </div>
          </div>
        </header>

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
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody className={styles.tableBody}>
                      {paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className={styles.textCenter}>
                            No alumni found
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
                            <td className={styles.fontMono}>
                              {row.yearFrom}-{row.yearTo}
                            </td>
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
                                  onClick={() => navigate(`/coordinator/alumni/${row._id}`)}
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
    </div>
  );
};

export default Coordinator_Alumni;
