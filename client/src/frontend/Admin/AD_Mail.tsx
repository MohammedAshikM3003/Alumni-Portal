import { useNavigate } from "react-router-dom";

import Sidebar from "./Components/Sidebar/Sidebar";

import styles from "./AD_Mail.module.css";

import { useState, useEffect } from "react";

import { useAuth } from "../../context/authContext/authContext";



const API_BASE_URL = import.meta.env.VITE_API_URL;



interface MailItem {

  _id: string;

  title?: string;

  content: string;

  senderName: string;

  dominantStatus: string;

  createdAt: string;

}



export default function Admin_Mail({ onLogout }: { onLogout?: () => void }) {

  const [searchQuery, setSearchQuery] = useState("");

  const [mailData, setMailData] = useState<MailItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [draftCount, setDraftCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accept" | "reject">("all");

  const navigate = useNavigate();

  const { user } = useAuth();



  // Fetch sent messages and draft count from backend

  useEffect(() => {

    const controller = new AbortController();



    const fetchSentMessages = async () => {

      try {

        setLoading(true);



        const response = await fetch(`${API_BASE_URL}/api/mail/all`, {

          headers: {

            'Content-Type': 'application/json',

            Authorization: `Bearer ${user?.token}`

          },

          signal: controller.signal,

        });



        const data = await response.json();



        if (data.success) {

          setMailData(data.mails);

        }

      } catch (err: any) {

        if (err.name === 'AbortError') return;

        console.error('Error fetching messages:', err);

      } finally {

        setLoading(false);

      }

    };



    const fetchDraftCount = async () => {

      try {

        const response = await fetch(`${API_BASE_URL}/api/drafts/count`, {

          headers: { 'Content-Type': 'application/json' },

          signal: controller.signal,

        });



        const data = await response.json();

        if (data.success) {

          setDraftCount(data.count);

        }

      } catch (err: any) {

        if (err.name === 'AbortError') return;

        console.error('Error fetching draft count:', err);

      }

    };



    fetchSentMessages();

    fetchDraftCount();

    return () => controller.abort();

  }, []);



  const fetchSentMessages = async () => {

    try {

      setLoading(true);



      const response = await fetch(`${API_BASE_URL}/api/mail/all`, {

        headers: {

          'Content-Type': 'application/json',

          Authorization: `Bearer ${user?.token}`

        }

      });



      const data = await response.json();



      if (data.success) {

        setMailData(data.mails);

      }

    } catch (err: any) {

      console.error('Error fetching messages:', err);

    } finally {

      setLoading(false);

    }

  };



  const fetchDraftCount = async () => {

    try {

      const response = await fetch(`${API_BASE_URL}/api/drafts/count`, {

        headers: { 'Content-Type': 'application/json' }

      });



      const data = await response.json();

      if (data.success) {

        setDraftCount(data.count);

      }

    } catch (err: any) {

      console.error('Error fetching draft count:', err);

    }

  };



  const handleRefresh = () => {

    setSearchQuery("");

    fetchSentMessages();

    fetchDraftCount();

  };



  // Format date to display like original mock data

  const formatDate = (dateString: string) => {

    const date = new Date(dateString);

    const now = new Date();

    const diffTime = Math.abs(now.getTime() - date.getTime());

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));



    if (diffDays === 0) {

      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    } else if (diffDays < 7) {

      return date.toLocaleDateString('en-US', { weekday: 'short' });

    } else {

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    }

  };



  const getButtonClassByStatus = (dominantStatus: string | undefined) => {

    switch (dominantStatus) {

      case 'accept':

        return styles.btnViewGreenOutline;

      case 'reject':

        return styles.btnViewRedOutline;

      case 'pending':

      default:

        return styles.btnViewGreyOutline;

    }

  };



  const getCardBorderByStatus = (dominantStatus: string | undefined) => {

    switch (dominantStatus) {

      case 'accept':

        return styles.borderGreen;

      case 'reject':

        return styles.borderRed;

      case 'pending':

      default:

        return styles.borderGrey;

    }

  };



  // Filter messages based on search query
  const searchFilteredMails = mailData.filter(mail =>
    mail.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mail.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mail.senderName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate status counts
  const allCount = searchFilteredMails.length;
  const pendingCount = searchFilteredMails.filter(mail => mail.dominantStatus === 'pending' || (mail.dominantStatus !== 'accept' && mail.dominantStatus !== 'reject')).length;
  const acceptedCount = searchFilteredMails.filter(mail => mail.dominantStatus === 'accept').length;
  const rejectedCount = searchFilteredMails.filter(mail => mail.dominantStatus === 'reject').length;

  // Filter based on selected status and sort by date descending
  const sortedMails = searchFilteredMails
    .filter(mail => {
      if (statusFilter === "all") return true;
      if (statusFilter === "pending") {
        return mail.dominantStatus === 'pending' || (mail.dominantStatus !== 'accept' && mail.dominantStatus !== 'reject');
      }
      return mail.dominantStatus === statusFilter;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const renderMailCard = (mail: MailItem) => (
    <div key={mail._id} className={`${styles.mailCard} ${getCardBorderByStatus(mail.dominantStatus)}`}>
      <div className={styles.mailCardContent}>
        <div className={styles.mailCardBody}>
          <div className={styles.mailCardTop}>
            <span className={styles.mailSender}>{mail.senderName}</span>
          </div>
          <p className={styles.mailMessage}>
            {mail.content.length > 120
              ? mail.content.substring(0, 120) + '...'
              : mail.content}
          </p>
        </div>
        <div className={styles.mailCardFooter}>
          <span className={styles.mailTime}>{formatDate(mail.createdAt)}</span>
          <button
            className={`${styles.btnView} ${getButtonClassByStatus(mail.dominantStatus)}`}
            onClick={() => navigate('/admin/mail/view_mail', {
              state: {
                mailId: mail._id,
                mailData: mail
              }
            })}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );



  return (

    <div className={styles.bodyContainer}>

        {/* Sidebar Component */}

        <Sidebar onLogout={onLogout} currentView={'mail'} />



      <main className={styles.mainContent}>

        <div className={styles.contentWrapper}>

          <div className={styles.headerSection}>

            <div>

              <h2 className={styles.pageTitle}>Mail History</h2>

            </div>

            <div className={styles.headerActions}>

              {/* Mail Actions */}

              <div className={styles.actionHeader} onClick={() => { navigate('/admin/mail/draft_history') }} >
                <button className={styles.draftsBtn}>
                  <span className="material-symbols-outlined">drafts</span>
                  <span>Drafts</span>
                  <span className={styles.badge}>{draftCount}</span>
                </button>
              </div>

              <div className={styles.filterContainer}>
                <button
                  className={`${styles.filterBtn} ${statusFilter === 'all' ? styles.activeAll : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  <span>All</span>
                  <span className={styles.filterCount}>{allCount}</span>
                </button>
                <button
                  className={`${styles.filterBtn} ${statusFilter === 'pending' ? styles.activePending : ''}`}
                  onClick={() => setStatusFilter('pending')}
                >
                  <span>Pending</span>
                  <span className={styles.filterCount}>{pendingCount}</span>
                </button>
                <button
                  className={`${styles.filterBtn} ${statusFilter === 'accept' ? styles.activeAccepted : ''}`}
                  onClick={() => setStatusFilter('accept')}
                >
                  <span>Accepted</span>
                  <span className={styles.filterCount}>{acceptedCount}</span>
                </button>
                <button
                  className={`${styles.filterBtn} ${statusFilter === 'reject' ? styles.activeRejected : ''}`}
                  onClick={() => setStatusFilter('reject')}
                >
                  <span>Rejected</span>
                  <span className={styles.filterCount}>{rejectedCount}</span>
                </button>
              </div>

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

              <button className={styles.refreshBtn} onClick={handleRefresh} disabled={loading}>

                <span className={`material-symbols-outlined ${loading ? styles.refreshIconSpin : ''}`}>refresh</span>

              </button>

            </div>



          </div>



          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading messages...</p>
            </div>
          ) : (
            <div className={styles.mailGrid}>
              {/* Compose Mail Card - Always first */}
              <div className={`${styles.mailCard} ${styles.mailCardNew}`} onClick={() => navigate('/admin/mail/broadcast_message')}>
                <div className={styles.newMailContainer}>
                  <span className={`material-symbols-outlined ${styles.newMailIcon}`}>add</span>
                  <span className={styles.newMailText1}>Compose Mail</span>
                  <p className={styles.mailMessage}>Click to compose a message for one or more alumni recipients</p>
                </div>
              </div>

              {sortedMails.map(renderMailCard)}

              {sortedMails.length === 0 && (
                <div className={styles.emptyState}>
                  <span className="material-symbols-outlined">mail</span>
                  <p>No messages found</p>
                </div>
              )}
            </div>
          )}
        </div>

      </main>

    </div>

  );

}

