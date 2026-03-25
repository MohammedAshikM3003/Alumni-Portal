import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Al_Mail.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Alumini_Mail({ onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mailHistory, setMailHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Alumni User object:', user); // Debug log
    // Always fetch mails, regardless of user state
    fetchAlumniMails();
  }, []);

  const fetchAlumniMails = async () => {
    try {
      setLoading(true);

      let apiUrl;
      if (user?.email) {
        console.log('Fetching mails for alumni:', user.email); // Debug log
        apiUrl = `${API_BASE_URL}/api/mail/alumni/${encodeURIComponent(user.email)}`;
      } else {
        console.log('No user email found, no mails to fetch'); // Debug log
        setMailHistory([]);
        setLoading(false);
        return;
      }

      console.log('API URL:', apiUrl); // Debug log

      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status); // Debug log
      console.log('Response ok:', response.ok); // Debug log

      const data = await response.json();
      console.log('Response data:', data); // Debug log

      if (data.success) {
        // Transform backend data to match original structure
        const transformedMails = data.mails.map((mail) => ({
          id: mail._id,
          sender: mail.senderName,
          badge: mail.isBroadcast ? "Broadcast" : "",
          text: mail.content,
          time: formatDate(mail.createdAt),
          btnStyle: getButtonStyleByStatus(mail.responseStatus),
          borderColor: getBorderColorByStatus(mail.responseStatus),
          responseStatus: mail.responseStatus, // Include status for frontend use
          responseData: mail.responseData, // Include response data
          mailData: mail // Keep original data for navigation
        }));

        console.log('Transformed mails:', transformedMails); // Debug log
        setMailHistory(transformedMails);
      } else {
        console.error('API returned success: false', data);
        setMailHistory([]);
      }
    } catch (err) {
      console.error('Error fetching alumni mails:', err);
      setMailHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getButtonStyleByStatus = (status) => {
    switch (status) {
      case 'accept':
        return 'btnViewGreenOutline';
      case 'reject':
        return 'btnViewRedOutline';
      case 'pending':
      default:
        return 'btnViewGreyOutline';
    }
  };

  const getBorderColorByStatus = (status) => {
    switch (status) {
      case 'accept':
        return '#22c55e'; // Green border for accepted
      case 'reject':
        return '#ef4444'; // Red border for rejected
      case 'pending':
      default:
        return '#d1d5db'; // Grey border for pending
    }
  };

  const handleRefresh = () => {
    setSearchQuery('');
    fetchAlumniMails();
  };

  const handleViewMail = (mail) => {
    // Navigate to alumni mail view page with complete mail data including response status
    navigate('/alumini/mail/viewmail', {
      state: {
        mailId: mail.mailData._id,
        mailData: {
          ...mail.mailData,
          responseStatus: mail.responseStatus,
          responseData: mail.responseData,
          submittedAt: mail.mailData.submittedAt
        }
      }
    });
  };

  // Filter mails based on search query
  const filteredMails = mailHistory.filter((mail) => {
    const query = searchQuery.toLowerCase();
    return (
      mail.sender.toLowerCase().includes(query) ||
      mail.text.toLowerCase().includes(query) ||
      (mail.badge && mail.badge.toLowerCase().includes(query))
    );
  });

  return (
    <div className={styles.pageWrapper}>
      <Sidebar onLogout={onLogout} currentView={'mail'} />

      <main className={styles.mainContent}>
        <div className={styles.contentContainer}>
          <div className={styles.headerBar}>
            <div>
              <h2 className={styles.pageTitle}>Mail History</h2>
              {user?.email && (
                <p className="text-sm text-slate-500 mt-1">Email: {user.email}</p>
              )}
            </div>
            <div className={styles.headerActions}>
              <div className={styles.searchWrapper}>
                <input
                  className={styles.searchInput}
                  placeholder="Search mail..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
              </div>
              <button
                className={styles.refreshButton}
                onClick={handleRefresh}
                disabled={loading}
              >
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF3D00] mb-4"></div>
              <p className="text-slate-500">Loading your mails...</p>
            </div>
          ) : filteredMails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">mail</span>
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No mails found</h3>
              <p className="text-slate-500">
                {searchQuery ? "Try adjusting your search query" : "No mails have been sent to your email address yet"}
              </p>
            </div>
          ) : (
            <div className={styles.mailGrid}>
              {filteredMails.map((mail) => (
                <div key={mail.id} className={styles.mailCard} style={{ borderColor: mail.borderColor }}>
                  <div className={styles.mailCardContent}>
                    <div className={styles.mailCardHeader}>
                      <span className={styles.mailCardSender}>{mail.sender}</span>
                      {mail.badge && <span className={styles.mailCardBadge}>{mail.badge}</span>}
                    </div>
                    <p className={styles.mailCardText}>
                      {mail.text.length > 120 ? mail.text.substring(0, 120) + '...' : mail.text}
                    </p>
                  </div>
                  <div className={styles.mailCardFooter}>
                    <span className={styles.mailCardTime}>{mail.time}</span>
                    <button
                      className={`${styles.btnView} ${styles[mail.btnStyle]}`}
                      onClick={() => handleViewMail(mail)}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
