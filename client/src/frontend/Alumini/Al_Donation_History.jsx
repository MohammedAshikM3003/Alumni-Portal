import styles from './Al_Donation_History.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatAmount = (amount) => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const mapStatus = (status) => {
  switch (status) {
    case 'paid': return 'Sent';
    case 'created': return 'Pending';
    case 'failed': return 'Failed';
    default: return 'Pending';
  }
};

const Alumini_Donation_History = ({ onLogout }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [donationData, setDonationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Summary statistics
  const [totalDonated, setTotalDonated] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user?.token) {
        setError('Please login to view donation history');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/payments/my`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch donation history');
        }

        const data = await response.json();

        if (data.success && data.payments) {
          const formattedData = data.payments.map((payment, index) => ({
            id: String(index + 1).padStart(2, '0'),
            cause: payment.purpose,
            type: 'Online',
            txId: payment.razorpayOrderId || 'N/A',
            amount: formatAmount(payment.amount),
            date: formatDate(payment.createdAt),
            status: mapStatus(payment.status),
          }));

          setDonationData(formattedData);

          // Calculate summary stats
          const paidPayments = data.payments.filter(p => p.status === 'paid');
          const total = paidPayments.reduce((sum, p) => sum + p.amount, 0);
          setTotalDonated(total);
          setCompletedCount(paidPayments.length);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(donationData.length / itemsPerPage) || 1;

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, donationData.length);
  const paginatedData = donationData.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView="donation_history" />
        <main className={styles.mainContent}>
          <div className={styles.loadingState}>Loading donation history...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView="donation_history" />
        <main className={styles.mainContent}>
          <div className={styles.errorState}>{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>

        {/* Sidebar Navigation */}
        <Sidebar onLogout={onLogout} currentView="donation_history" />

        {/* Main Content Area */}
        <main className={styles.mainContent}>
            {/* Top Header Section */}
            <header className={styles.header}>
            <div>
                <h1 className={styles.pageTitle}>Donation History</h1>
                <p className={styles.pageSubtitle}>
                Manage and track your contributions to the college development.
                </p>
            </div>
            <button className={styles.newDonationBtn} onClick={() => {navigate('/alumini/donation_history/donation_form')}}>
                <span className="material-symbols-outlined">add</span>
                New Donation
            </button>
            </header>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
              {/* Card 1 */}
              <div className={styles.summaryCard}>
                  <div className={`${styles.summaryIcon} ${styles.iconBlue}`}>
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                  </div>
                  <div className={styles.summaryInfo}>
                  <p className={styles.summaryLabel}>TOTAL DONATED</p>
                  <p className={styles.summaryValue}>{formatAmount(totalDonated)}</p>
                  </div>
              </div>

              {/* Card 2 */}
              <div className={styles.summaryCard}>
                  <div className={`${styles.summaryIcon} ${styles.iconGreen}`}>
                  <span className="material-symbols-outlined">check</span>
                  </div>
                  <div className={styles.summaryInfo}>
                  <p className={styles.summaryLabel}>COMPLETED CONTRIBUTIONS</p>
                  <p className={styles.summaryValue}>{completedCount}</p>
                  </div>
              </div>

              {/* Card 3 */}
              <div className={styles.summaryCard}>
                  <div className={`${styles.summaryIcon} ${styles.iconOrange}`}>
                  <span className="material-symbols-outlined">emoji_events</span>
                  </div>
                  <div className={styles.summaryInfo}>
                  <p className={styles.summaryLabel}>IMPACT RANK</p>
                  <p className={styles.summaryValue}>Top 5% Donor</p>
                  </div>
              </div>
            </div>

            {/* Table Container */}
            <div className={styles.tableCard}>
            <div className={styles.tableResponsive}>
                <table className={styles.donationTable}>
                <thead>
                    <tr>
                    <th>S.No</th>
                    <th>Cause</th>
                    <th>Type</th>
                    <th>Transaction ID</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((row, index) => (
                        <tr key={index}>
                            <td className={styles.colId}>{row.id}</td>
                            <td className={styles.colCause}>{row.cause}</td>
                            <td className={styles.colType}>{row.type}</td>
                            <td className={styles.colTx}>{row.txId}</td>
                            <td className={styles.colAmount}>{row.amount}</td>
                            <td className={styles.colDate}>{row.date}</td>
                            <td>
                            <span className={`${styles.statusBadge} ${styles[`status${row.status}`]}`}>
                                <span className={styles.statusDot}></span>
                                {row.status}
                            </span>
                            </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className={styles.emptyState}>
                          <p>No donations yet. Make your first contribution!</p>
                        </td>
                      </tr>
                    )}
                </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {donationData.length > 0 && (
            <div className={styles.paginationContainer}>
                <p className={styles.paginationText}>
                  Showing {startIndex + 1} to {endIndex} of {donationData.length} entries
                </p>
                <div className={styles.paginationControls}>
                  <button
                    className={styles.pageBtn}
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`${styles.pageBtn} ${currentPage === pageNum ? styles.activePage : ''}`}
                      onClick={() => handlePageClick(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    className={styles.pageBtn}
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
            </div>
            )}
            </div>
        </main>
    </div>
  );
};

export default Alumini_Donation_History;