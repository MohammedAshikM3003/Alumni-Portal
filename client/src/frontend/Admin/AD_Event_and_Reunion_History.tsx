import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AD_Event_and_Reunion_History.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';
import { formatBranchName } from '../../utils/formatters';

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatTime = (timeStr: string | undefined) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
};

const getStatusBadgeClass = (status: string | undefined) => {
  switch (status) {
    case 'completed': return styles.statusCompleted;
    case 'cancelled': return styles.statusCancelled;
    case 'pending': return styles.statusPending;
    default: return styles.statusPending;
  }
};

interface EventHistory {
  id: string;
  title: string;
  organizer: string;
  organizerCode: string;
  coOrganizers: string;
  date: string;
  rawDate: Date;
  day: string;
  time: string;
  venue: string;
  status: string;
  createdAt: string;
}

interface DepartmentItem {
  _id: string;
  branch: string;
  deptCode: string;
}

const Admin_Event_and_Reunion_History = ({ onLogout }: { onLogout?: () => void }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsData, setEventsData] = useState<EventHistory[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('');

  const cardsPerPage = 9;

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      if (!user?.token) {
        setError('Please login to view events');
        setLoading(false);
        return;
      }

      try {
        const [eventsRes, deptRes] = await Promise.all([
          fetch(`${API_BASE}/api/events`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          fetch(`${API_BASE}/api/departments`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          })
        ]);

        if (!eventsRes.ok) throw new Error('Failed to fetch events');

        const data = await eventsRes.json();
        if (data.success && data.data) {
          const formattedData: EventHistory[] = data.data.map((event: any) => ({
            id: event._id,
            title: event.eventName,
            organizer: event.organizer?.branch || 'N/A',
            organizerCode: event.organizer?.deptCode || '',
            coOrganizers: event.coOrganizers?.map((co: { deptCode: string }) => co.deptCode).join(', ') || '',
            date: formatDate(event.eventDate),
            rawDate: new Date(event.eventDate),
            day: event.eventDay,
            time: formatTime(event.eventTime),
            venue: event.venue,
            status: event.status,
            createdAt: event.createdAt,
          }));
          setEventsData(formattedData);
        }

        if (deptRes.ok) {
          const deptJson = await deptRes.json();
          if (deptJson.success && deptJson.departments) {
            setDepartments(deptJson.departments);
          }
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
  }, [user]);

  // Metrics
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
  const totalEvents = eventsData.length;
  const upcomingCount = eventsData.filter(e => {
    const eventDate = new Date(e.rawDate);
    eventDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    return eventDate >= now && e.status !== 'cancelled' && e.status !== 'completed';
  }).length;
  const completedCount = eventsData.filter(e => e.status === 'completed').length;

  const eventDeptCounts: Record<string, number> = {};
  eventsData.forEach(e => {
    const dept = e.organizer?.trim();
    if (dept && dept !== 'N/A') eventDeptCounts[dept] = (eventDeptCounts[dept] || 0) + 1;
  });
  let topEventDept = 'N/A';
  let maxEventDeptCount = 0;
  Object.entries(eventDeptCounts).forEach(([dept, count]) => {
    if (count > maxEventDeptCount) {
      maxEventDeptCount = count;
      topEventDept = dept;
    }
  });

  // Filtered logic
  const filteredEvents = eventsData.filter(event => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      event.title.toLowerCase().includes(term) ||
      event.venue.toLowerCase().includes(term) ||
      event.organizer.toLowerCase().includes(term);

    const matchesDept = !selectedDept || event.organizer.toLowerCase() === selectedDept.toLowerCase();

    const matchesStatus = !selectedStatus || event.status === selectedStatus;

    let matchesTimeframe = true;
    if (selectedTimeframe === 'upcoming') {
      matchesTimeframe = event.rawDate >= now;
    } else if (selectedTimeframe === 'past') {
      matchesTimeframe = event.rawDate < now;
    }

    return matchesSearch && matchesDept && matchesStatus && matchesTimeframe;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDept('');
    setSelectedStatus('');
    setSelectedTimeframe('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredEvents.length / cardsPerPage) || 1;
  const startIndex = (currentPage - 1) * cardsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + cardsPerPage);

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxButtonsToShow = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);

    if (endPage - startPage < maxButtonsToShow - 1) {
      startPage = Math.max(1, endPage - maxButtonsToShow + 1);
    }

    for (let i = startPage; i <= endPage; i += 1) pages.push(i);
    return pages;
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'event_and_reunion_history'} />
        <main className={styles.mainContent}>
          <div className={styles.contentMaxWidth}>
            <div className={styles.loadingState}>Loading events...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'event_and_reunion_history'} />
        <main className={styles.mainContent}>
          <div className={styles.contentMaxWidth}>
            <div className={styles.errorState}>{error}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Sidebar onLogout={onLogout} currentView={'event_and_reunion_history'} />
      <main className={styles.mainContent}>
        <div className={styles.contentMaxWidth}>

          {/* Header Section */}
          <header className={styles.pageHeader} style={{ marginBottom: '1.25rem' }}>
            <div className={styles.headerText}>
              <h2 className={styles.pageTitle}>Events & Reunion History</h2>
              <p className={styles.pageSubtitle}>
                Reflecting on our past gatherings, celebrations, and alumni milestones across departments.
              </p>
            </div>
            <button className={styles.hostBtn} onClick={() => { navigate('/admin/event_and_reunion_form1'); }}>
              <span className="material-symbols-outlined">add_circle</span>
              <span>Host New Event</span>
            </button>
          </header>

          {/* Metric Cards Summary Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Total Events</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0 0' }}>{totalEvents}</h3>
            </div>
            <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Upcoming Gatherings</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1d4ed8', margin: '0.25rem 0 0 0' }}>{upcomingCount}</h3>
            </div>
            <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Completed Reunions</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', margin: '0.25rem 0 0 0' }}>{completedCount}</h3>
            </div>
            <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: '0.75rem', color: '#9333ea', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Most Active Dept</p>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7e22ce', margin: '0.4rem 0 0 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{topEventDept}</h3>
            </div>
          </div>

          {/* Search & Multi-Filter Panel */}
          <div style={{ background: '#fff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>search</span>
              <input
                type="text"
                placeholder="Search event title or venue..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.85rem' }}
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem', outline: 'none', minWidth: '160px' }}
            >
              <option value="">All Organizing Depts</option>
              {departments.map((dept) => (
                <option key={dept._id} value={formatBranchName(dept.branch)}>
                  {dept.deptCode} - {formatBranchName(dept.branch)}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem', outline: 'none' }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Timeframe Filter */}
            <select
              value={selectedTimeframe}
              onChange={(e) => { setSelectedTimeframe(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem', outline: 'none' }}
            >
              <option value="">All Timeframes</option>
              <option value="upcoming">Upcoming Events</option>
              <option value="past">Past Events</option>
            </select>

            {/* Reset Button */}
            {(searchTerm || selectedDept || selectedStatus || selectedTimeframe) && (
              <button
                onClick={clearFilters}
                style={{ padding: '0.5rem 0.75rem', background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Event History Grid */}
          <section className={styles.eventsGrid}>
            {paginatedEvents.length > 0 ? (
              paginatedEvents.map((event) => (
                <article key={event.id} className={styles.eventCard}>
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
                      <div className={styles.eventMeta}>
                        <span className={styles.eventDate}>
                          <span className="material-symbols-outlined">calendar_month</span>
                          {event.date} ({event.day})
                        </span>
                        <span className={styles.eventTime}>
                          <span className="material-symbols-outlined">schedule</span>
                          {event.time}
                        </span>
                      </div>
                    </div>
                    <button className={styles.viewDetailsBtn} onClick={() => { navigate(`/admin/event_and_reunion_invitation/${event.id}`); }}>View</button>
                  </div>
                </article>
              ))
            ) : (
              <div className={styles.emptyState}>
                <span className="material-symbols-outlined">event_busy</span>
                <p>No events found matching active filters.</p>
              </div>
            )}
          </section>

          {/* Pagination */}
          {filteredEvents.length > 0 && (
            <footer className={styles.pagination}>
              <button
                className={styles.pageArrowBtn}
                onClick={() => handlePageClick(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  className={`${styles.pageNumberBtn} ${currentPage === page ? styles.activePage : ''}`}
                  onClick={() => handlePageClick(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className={styles.pageArrowBtn}
                onClick={() => handlePageClick(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </footer>
          )}

        </div>
      </main>
    </div>
  );
};

export default Admin_Event_and_Reunion_History;
