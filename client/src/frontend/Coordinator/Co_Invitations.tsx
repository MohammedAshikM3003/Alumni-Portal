import { useState, useEffect, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import styles from './Co_Invitations.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';
import { formatBranchName } from '../../utils/formatters';

const API_BASE = import.meta.env.VITE_API_URL;

interface Department {
  _id: string;
  branch: string;
  deptCode: string;
}

interface ApiEvent {
  _id: string;
  eventName: string;
  eventDate: string;
  eventDay: string;
  eventTime: string;
  venue: string;
  batch?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  organizer: Department;
  coOrganizers: Department[];
  createdAt: string;
}

interface EventData {
  id: string;
  title: string;
  organizer: string;
  organizerCode: string;
  coOrganizers: string;
  date: string;
  day: string;
  time: string;
  venue: string;
  batch?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  createdAt: string;
}

interface CoordinatorInvitationsProps {
  onLogout: () => void;
}

const formatDate = (dateString: string | number | Date): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatTime = (timeStr: string | undefined): string => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
};

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'completed': return styles.statusCompleted;
    case 'cancelled': return styles.statusCancelled;
    case 'upcoming': return styles.statusUpcoming;
    default: return styles.statusUpcoming;
  }
};

const CoordinatorInvitations: FC<CoordinatorInvitationsProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [eventsData, setEventsData] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [coordinatorDept, setCoordinatorDept] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');

  const cardsPerPage = 9;

  useEffect(() => {
    const controller = new AbortController();

    const fetchEvents = async (): Promise<void> => {
      if (!user?.token) {
        setError('Please login to view events');
        setLoading(false);
        return;
      }

      try {
        // Fetch coordinator profile
        const coordRes = await fetch(`${API_BASE}/api/coordinators/profile/me`, {
          headers: { Authorization: `Bearer ${user.token}` },
          signal: controller.signal,
        });
        const coordData = await coordRes.json();
        const dept = coordData.success && coordData.data ? coordData.data.department : (user.department || '');
        setCoordinatorDept(dept);

        // Fetch events
        const response = await fetch(`${API_BASE}/api/events`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data = await response.json();

        if (data.success && data.data) {
          // Filter events by coordinator's department (organized or co-organized)
          const deptNormalized = formatBranchName(dept).toLowerCase();
          const deptEvents = data.data.filter((event: ApiEvent) => {
            const orgBranch = formatBranchName(event.organizer?.branch || '').toLowerCase();
            const orgCode = (event.organizer?.deptCode || '').toLowerCase();
            const isOrg = orgBranch === deptNormalized || orgCode === deptNormalized;
            const isCoOrg = event.coOrganizers?.some(co => {
              const coBranch = formatBranchName(co?.branch || '').toLowerCase();
              const coCode = (co?.deptCode || '').toLowerCase();
              return coBranch === deptNormalized || coCode === deptNormalized;
            });
            return isOrg || isCoOrg;
          });

          const formattedData: EventData[] = deptEvents.map((event: ApiEvent) => ({
            id: event._id,
            title: event.eventName,
            organizer: event.organizer?.branch || 'N/A',
            organizerCode: event.organizer?.deptCode || '',
            coOrganizers: event.coOrganizers?.map(co => co.deptCode).join(', ') || '',
            date: formatDate(event.eventDate),
            day: event.eventDay,
            time: formatTime(event.eventTime),
            venue: event.venue,
            batch: event.batch,
            status: (event.status as string) === 'pending' ? 'upcoming' : event.status,
            createdAt: event.createdAt,
          }));

          setEventsData(formattedData);
          setFilteredEvents(formattedData);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    return () => controller.abort();
  }, [user]);

  // Apply filters
  useEffect(() => {
    let result = eventsData;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(term) ||
        e.organizer.toLowerCase().includes(term) ||
        e.organizerCode.toLowerCase().includes(term) ||
        e.venue.toLowerCase().includes(term)
      );
    }

    if (selectedStatus) {
      result = result.filter(e => e.status === selectedStatus);
    }

    if (selectedBatch) {
      result = result.filter(e => e.batch && e.batch.includes(selectedBatch));
    }

    setFilteredEvents(result);
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedBatch, eventsData]);

  // Metrics
  const totalEvents = eventsData.length;
  const upcomingCount = eventsData.filter(e => e.status === 'upcoming').length;
  const completedCount = eventsData.filter(e => e.status === 'completed').length;

  const uniqueBatches = [...new Set(eventsData.map(e => e.batch).filter(Boolean))] as string[];

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedBatch('');
  };

  const totalPages = Math.ceil(filteredEvents.length / cardsPerPage) || 1;
  const startIndex = (currentPage - 1) * cardsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + cardsPerPage);

  const handlePageClick = (page: number): void => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePrevPage = (): void => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = (): void => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxButtonsToShow = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);

    if (endPage - startPage < maxButtonsToShow - 1) {
      startPage = Math.max(1, endPage - maxButtonsToShow + 1);
    }

    for (let i = startPage; i <= endPage; i += 1) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className={styles.pageContainer}>
      <Sidebar onLogout={onLogout} currentView={'Events_and_Reunions'} />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.contentMaxWidth}>
            {/* Header Section */}
            <div className={styles.pageHeader}>
              <div className={styles.headerText}>
                <h1 className={styles.pageTitle}>Events and Reunion</h1>
                <p className={styles.pageSubtitle}>
                  Manage reunions, invitations, and events for <strong>{coordinatorDept || 'your department'}</strong>
                </p>
              </div>
            </div>

            {/* Dashboard 5-Card Grid */}
            <div className={styles.dashboardStatsRow}>
              {/* Card 1: Search & Filter */}
              <div className={styles.filterCard}>
                <div className={styles.searchBoxWrapper}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    className={styles.searchBoxInput}
                    placeholder="Search event by name, venue..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className={styles.dropdownRow}>
                  <select
                    className={styles.dropdownSelect}
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {uniqueBatches.length > 0 && (
                    <select
                      className={styles.dropdownSelect}
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                    >
                      <option value="">All Batches</option>
                      {uniqueBatches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  )}

                  {(searchTerm || selectedStatus || selectedBatch) && (
                    <button onClick={clearFilters} className={styles.clearBtnCompact}>
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Card 2: Total Events */}
              <div className={styles.kpiMetricCard}>
                <p className={styles.kpiMetricLabel}>Total Events</p>
                <h2 className={styles.kpiMetricValue}>{totalEvents}</h2>
              </div>

              {/* Card 3: Upcoming */}
              <div className={styles.kpiMetricCard}>
                <p className={styles.kpiMetricLabel}>Upcoming Gatherings</p>
                <h2 className={styles.kpiMetricValue}>{upcomingCount}</h2>
              </div>

              {/* Card 4: Completed */}
              <div className={styles.kpiMetricCard}>
                <p className={styles.kpiMetricLabel}>Completed Reunions</p>
                <h2 className={styles.kpiMetricValue}>{completedCount}</h2>
              </div>

              {/* Card 5: Host New Event */}
              <div
                className={styles.addAlumniButtonCard}
                onClick={() => navigate('/coordinator/event_and_reunion_form')}
              >
                <Plus size={26} className={styles.addAlumniIcon} />
                <span className={styles.addAlumniText}>HOST NEW EVENT</span>
              </div>
            </div>

            {/* Events Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', fontWeight: 600 }}>Loading events...</div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444', fontWeight: 600 }}>{error}</div>
            ) : paginatedEvents.length > 0 ? (
              <section className={styles.eventsGrid}>
                {paginatedEvents.map((event) => (
                  <article
                    key={event.id}
                    className={styles.eventCard}
                    onClick={() => navigate(`/coordinator/view_invitations/${event.id}`)}
                  >
                    <div className={styles.cardContent}>
                      <div className={styles.cardHeader}>
                        <span className={`${styles.statusBadge} ${getStatusBadgeClass(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                      <div className={styles.cardText}>
                        <h3 className={styles.eventTitle}>{event.title}</h3>
                        <div className={styles.eventOrganizer}>
                          <span className="material-symbols-outlined">business</span>
                          {event.organizer} ({event.organizerCode})
                        </div>
                        {event.batch && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>school</span>
                            <span>Batch: {event.batch}</span>
                          </div>
                        )}
                        <div className={styles.eventMeta}>
                          <span className={styles.eventDate}>
                            <span className="material-symbols-outlined">calendar_month</span>
                            {event.date} ({event.day})
                          </span>
                          <span className={styles.eventTime}>
                            <span className="material-symbols-outlined">schedule</span>
                            {event.time}
                          </span>
                          <span className={styles.eventVenue}>
                            <span className="material-symbols-outlined">location_on</span>
                            {event.venue}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.viewDetailsText}>View Event &amp; Invitation</span>
                      <span className={`material-symbols-outlined ${styles.viewDetailsArrow}`}>arrow_forward</span>
                    </div>
                  </article>
                ))}
              </section>
            ) : (
              <div className={styles.emptyState}>
                <h3 className={styles.emptyStateTitle}>No Events Found</h3>
                <p>No events match the selected criteria for your department.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageButton}
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    className={`${styles.pageButton} ${currentPage === page ? styles.pageButtonActive : ''}`}
                    onClick={() => handlePageClick(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className={styles.pageButton}
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoordinatorInvitations;
