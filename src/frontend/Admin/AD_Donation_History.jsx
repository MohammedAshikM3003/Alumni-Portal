import { useState } from 'react';
import Sidebar from './Components/Sidebar/Sidebar';
import styles from './AD_Donation_History.module.css';
import { useNavigate } from 'react-router-dom';
import { DateInput } from '../../components/Calendar';

const Admin_Donation_History = ( { onLogout } ) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 7;

  // Table Data
  const donationsData = [
    {
      id: 1,
      initials: 'PV',
      name: 'Priya Varma',
      batch: 'Class of 2018 - CSE',
      amount: '₹250.00',
      date: 'Oct 24, 2023',
      type: 'UPI',
      typeClass: styles.typeUpi,
    },
    {
      id: 2,
      initials: 'RK',
      name: 'Rahul Krishnan',
      batch: 'Class of 2015 - MECH',
      amount: '₹1,200.00',
      date: 'Oct 22, 2023',
      type: 'Net Banking',
      typeClass: styles.typeNetBanking,
    },
    {
      id: 3,
      initials: 'AS',
      name: 'Ananya Singh',
      batch: 'Class of 2020 - ECE',
      amount: '₹5,000.00',
      date: 'Oct 20, 2023',
      type: 'Credit Card',
      typeClass: styles.typeCreditCard,
    },
    {
      id: 4,
      initials: 'JM',
      name: 'James Michael',
      batch: 'Class of 2012 - CIVIL',
      amount: '₹750.00',
      date: 'Oct 18, 2023',
      type: 'Debit Card',
      typeClass: styles.typeDebitCard,
    },
    {
      id: 5,
      initials: 'SK',
      name: 'Suresh Kumar',
      batch: 'Class of 2022 - IT',
      amount: '₹500.00',
      date: 'Oct 15, 2023',
      type: 'UPI',
      typeClass: styles.typeUpi,
    },
    {
      id: 6,
      initials: 'PV',
      name: 'Priya Varma',
      batch: 'Class of 2018 - CSE',
      amount: '₹250.00',
      date: 'Oct 24, 2023',
      type: 'UPI',
      typeClass: styles.typeUpi,
    },
    {
      id: 7,
      initials: 'RK',
      name: 'Rahul Krishnan',
      batch: 'Class of 2015 - MECH',
      amount: '₹1,200.00',
      date: 'Oct 22, 2023',
      type: 'Net Banking',
      typeClass: styles.typeNetBanking,
    },
    {
      id: 8,
      initials: 'AS',
      name: 'Ananya Singh',
      batch: 'Class of 2020 - ECE',
      amount: '₹5,000.00',
      date: 'Oct 20, 2023',
      type: 'Credit Card',
      typeClass: styles.typeCreditCard,
    },
    {
      id: 9,
      initials: 'JM',
      name: 'James Michael',
      batch: 'Class of 2012 - CIVIL',
      amount: '₹750.00',
      date: 'Oct 18, 2023',
      type: 'Debit Card',
      typeClass: styles.typeDebitCard,
    },
    {
      id: 10,
      initials: 'SK',
      name: 'Suresh Kumar',
      batch: 'Class of 2022 - IT',
      amount: '₹500.00',
      date: 'Oct 15, 2023',
      type: 'UPI',
      typeClass: styles.typeUpi,
    },
  ];

  const totalEntries = donationsData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedDonations = donationsData.slice(startIndex, startIndex + entriesPerPage);
  const rangeStart = totalEntries === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + entriesPerPage, totalEntries);

  const handlePageChange = (page) => {
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

  return (
    <div className={styles.pageContainer}>
      
      {/* Sidebar */}
      <Sidebar onLogout={onLogout} currentView={'donation_history'} />
      {/* Main Content Area */}
      <main className={styles.mainContent}>
        
        {/* Sticky Notification Header */}
        <header className={styles.stickyHeader}>
          <div className={styles.notificationBanner}>
            <div className={styles.notificationContent}>
              <span 
                className="material-symbols-outlined" 
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
              <span>Recent: Suresh Kumar just donated ₹500 to the Alumni Fund!</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={styles.contentWrapper}>
          
          {/* Title and Export Action */}
          <div className={styles.pageHeader}>
            <h2 className={styles.pageTitle}>Alumni Donations Tracking</h2>
            <button className={styles.exportBtn}>
              <span className="material-symbols-outlined">file_download</span>
              Export
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className={styles.filterBar}>
            <div className={styles.searchWrapper}>
              <span className="material-symbols-outlined">search</span>
              <input 
                type="text" 
                className={styles.searchInput} 
                placeholder="Search by donor name..." 
              />
            </div>
            <div className={styles.dateFilterWrapper}>
              <DateInput
                theme="admin"
                className={styles.dateInput}
              />
            </div>
          </div>

          {/* Data Table */}
          <div className={styles.tableCard}>
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>S.NO</th>
                    <th>Donor Name</th>
                    <th>Batch/Class</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th className={styles.textCenter}>Type</th>
                    <th className={styles.textRight}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDonations.map((row, index) => (
                    <tr key={row.id}>
                      <td className={styles.tdSno}>{startIndex + index + 1}</td>
                      <td>
                        <div className={styles.donorInfo}>
                          <div className={styles.donorAvatar}>{row.initials}</div>
                          <span className={styles.donorName}>{row.name}</span>
                        </div>
                      </td>
                      <td className={styles.tdBatch}>{row.batch}</td>
                      <td className={styles.tdAmount}>{row.amount}</td>
                      <td className={styles.tdDate}>{row.date}</td>
                      <td className={styles.textCenter}>
                        <span className={`${styles.typePill} ${row.typeClass}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className={styles.textRight}>
                        <button className={styles.actionBtn} onClick={() => { navigate('/admin/view_donation') }} >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className={styles.paginationFooter}>
              <p className={styles.paginationText}>
                Showing {rangeStart} to {rangeEnd} of {totalEntries} entries
              </p>
              <div className={styles.paginationControls}>
                <button
                  className={styles.pageBtn}
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      className={`${styles.pageBtn} ${currentPage === page ? styles.activePageBtn : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  className={styles.pageBtn}
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
};

export default Admin_Donation_History;