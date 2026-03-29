import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AD_Event_and_Reunion_History.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'completed': return styles.statusCompleted;
    case 'cancelled': return styles.statusCancelled;
    case 'pending': return styles.statusPending;
    default: return styles.statusPending;
  }
};

const Admin_Event_and_Reunion_History = ({ onLogout }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsData, setEventsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cardsPerPage = 9;

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.token) {
        setError('Please login to view events');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/events`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data = await response.json();

        if (data.success && data.events) {
          const formattedData = data.events.map((event) => ({
            id: event._id,
            title: event.eventName,
            organizer: event.organizer?.branch || 'N/A',
            organizerCode: event.organizer?.deptCode || '',
            coOrganizers: event.coOrganizers?.map(co => co.deptCode).join(', ') || '',
            date: formatDate(event.eventDate),
            day: event.eventDay,
            time: formatTime(event.eventTime),
            venue: event.venue,
            status: event.status,
            createdAt: event.createdAt,
          }));
          setEventsData(formattedData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  const totalPages = Math.ceil(eventsData.length / cardsPerPage) || 1;
  const startIndex = (currentPage - 1) * cardsPerPage;
  const paginatedEvents = eventsData.slice(startIndex, startIndex + cardsPerPage);

  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
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

      {/* Sidebar Navigation */}
      <Sidebar onLogout={onLogout} currentView={'event_and_reunion_history'} />


      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <div className={styles.contentMaxWidth}>

          {/* Header Section */}
          <header className={styles.pageHeader}>
            <div className={styles.headerText}>
              <h2 className={styles.pageTitle}>Events & Reunion History</h2>
              <p className={styles.pageSubtitle}>
                Reflecting on our past gatherings, celebrations, and alumni milestones.
              </p>
            </div>
            <button className={styles.hostBtn} onClick={() => { navigate('/admin/event_and_reunion_form1') }} >
              <span className="material-symbols-outlined">add_circle</span>
              <span>Host New Event</span>
            </button>
          </header>

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
                    <button className={styles.viewDetailsBtn} onClick={() => { navigate(`/admin/event_and_reunion_invitation/${event.id}`) }} >View</button>
                  </div>
                </article>
              ))
            ) : (
              <div className={styles.emptyState}>
                <span className="material-symbols-outlined">event_busy</span>
                <p>No events found. Create your first event!</p>
              </div>
            )}
          </section>

          {/* Pagination */}
          {eventsData.length > 0 && (
            <footer className={styles.pagination}>
              <button
                className={styles.pageArrowBtn}
                onClick={handlePrevPage}
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
                onClick={handleNextPage}
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
