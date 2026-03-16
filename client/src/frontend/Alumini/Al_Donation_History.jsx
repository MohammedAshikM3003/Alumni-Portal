import styles from './Al_Donation_History.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Alumini_Donation_History = ({ onLogout }) => {
  // Mock data matching the screenshot exactly
  const donationData = [
    { id: '01', cause: 'Scholarship Fund 2024', type: 'Online', txId: 'TXN-882910321', amount: '₹15,000.00', date: 'Oct 24, 2023', status: 'Sent' },
    { id: '02', cause: 'Library Digitalization', type: 'UPI', txId: 'TXN-773210452', amount: '₹5,000.00', date: 'Oct 18, 2023', status: 'Sent' },
    { id: '03', cause: 'Sports Complex Renovation', type: 'Bank Transfer', txId: 'TXN-912234567', amount: '₹25,000.00', date: 'Oct 15, 2023', status: 'Pending' },
    { id: '04', cause: 'Annual Alumni Meet Fund', type: 'UPI', txId: 'TXN-881223344', amount: '₹2,500.00', date: 'Oct 12, 2023', status: 'Pending' },
    { id: '05', cause: 'Research Lab Upgrade', type: 'Online', txId: 'TXN-445566778', amount: '₹50,000.00', date: 'Oct 05, 2023', status: 'Failed' },
    { id: '06', cause: 'Auditorium Sound System', type: 'Bank Transfer', txId: 'TXN-112299002', amount: '₹10,000.00', date: 'Sep 28, 2023', status: 'Failed' },
    { id: '07', cause: 'Campus Greenery Project', type: 'Online', txId: 'TXN-559900223', amount: '₹12,500.00', date: 'Sep 20, 2023', status: 'Failed' },
    { id: '08', cause: 'Library Digitalization', type: 'UPI', txId: 'TXN-773210452', amount: '₹5,000.00', date: 'Oct 18, 2023', status: 'Sent' },
    { id: '09', cause: 'Sports Complex Renovation', type: 'Bank Transfer', txId: 'TXN-912234567', amount: '₹25,000.00', date: 'Oct 15, 2023', status: 'Pending' },
    { id: '10', cause: 'Annual Alumni Meet Fund', type: 'UPI', txId: 'TXN-881223344', amount: '₹2,500.00', date: 'Oct 12, 2023', status: 'Pending' },
    { id: '11', cause: 'Research Lab Upgrade', type: 'Online', txId: 'TXN-445566778', amount: '₹50,000.00', date: 'Oct 05, 2023', status: 'Failed' },
    { id: '12', cause: 'Annual Alumni Meet Fund', type: 'UPI', txId: 'TXN-881223344', amount: '₹2,500.00', date: 'Oct 12, 2023', status: 'Pending' },
    { id: '13', cause: 'Research Lab Upgrade', type: 'Online', txId: 'TXN-445566778', amount: '₹50,000.00', date: 'Oct 05, 2023', status: 'Failed' },
    { id: '14', cause: 'Annual Alumni Meet Fund', type: 'UPI', txId: 'TXN-881223344', amount: '₹2,500.00', date: 'Oct 12, 2023', status: 'Pending' },
    { id: '15', cause: 'Research Lab Upgrade', type: 'Online', txId: 'TXN-445566778', amount: '₹50,000.00', date: 'Oct 05, 2023', status: 'Failed' },
  ];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(donationData.length / itemsPerPage);

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

  const navigate = useNavigate();

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
                  <p className={styles.summaryValue}>₹1,20,000.00</p>
                  </div>
              </div>

              {/* Card 2 */}
              <div className={styles.summaryCard}>
                  <div className={`${styles.summaryIcon} ${styles.iconGreen}`}>
                  <span className="material-symbols-outlined">check</span>
                  </div>
                  <div className={styles.summaryInfo}>
                  <p className={styles.summaryLabel}>COMPLETED CONTRIBUTIONS</p>
                  <p className={styles.summaryValue}>18</p>
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
                    {paginatedData.map((row, index) => (
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
                    ))}
                </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
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
            </div>
        </main>
    </div>
  );
};

export default Alumini_Donation_History;