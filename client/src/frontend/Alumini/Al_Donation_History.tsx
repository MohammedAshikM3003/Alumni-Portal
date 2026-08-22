import styles from './Al_Donation_History.module.css';
import './scrollbar.js';
import Sidebar from './Components/Sidebar/Sidebar';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatAmount = (amount: number) => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface PaymentRecord {
  id: string;
  cause: string;
  type: string;
  txId: string;
  amount: string;
  date: string;
  status: string;
  paymentId: string;
  rawStatus: string;
  razorpayOrderId?: string;
  _id?: string;
  amount_num?: number;
  purpose?: string;
  createdAt?: string;
}

interface ApiPayment {
  _id: string;
  purpose: string;
  amount: number;
  createdAt: string;
  status: string;
  razorpayOrderId?: string;
  currency?: string;
}

const mapStatus = (status: string | null | undefined) => {
  switch (status) {
    case 'paid': return 'Sent';
    case 'created': return 'Pending';
    case 'failed': return 'Failed';
    default: return 'Pending';
  }
};

interface AluminiDonationHistoryProps {
  onLogout?: () => void;
}

import { getPageCache, setPageCache } from '../../utils/pageCache';

const Alumini_Donation_History = ({ onLogout }: AluminiDonationHistoryProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const cachedDonations = getPageCache<any>('alumni_donations');
  const [donationData, setDonationData] = useState<PaymentRecord[]>(cachedDonations?.donationData || []);
  const [rawPayments, setRawPayments] = useState<ApiPayment[]>(cachedDonations?.rawPayments || []);
  const [loading, setLoading] = useState(!cachedDonations);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<{ isOpen: boolean; donation: PaymentRecord | null }>({ isOpen: false, donation: null });

  // Summary statistics
  const [totalDonated, setTotalDonated] = useState(cachedDonations?.totalDonated || 0);
  const [completedCount, setCompletedCount] = useState(cachedDonations?.completedCount || 0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchPayments = async () => {
      if (!user?.token) {
        if (!cachedDonations) setError('Please login to view donation history');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/payments/my`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch donation history');
        }

        const data = await response.json();

        if (data.success && data.payments) {
          const formattedData: PaymentRecord[] = data.payments.map((payment: ApiPayment, index: number) => ({
            id: String(index + 1).padStart(2, '0'),
            cause: payment.purpose,
            type: 'Online',
            txId: payment.razorpayOrderId || 'N/A',
            amount: formatAmount(payment.amount),
            date: formatDate(payment.createdAt),
            status: mapStatus(payment.status),
            paymentId: payment._id,
            rawStatus: payment.status,
          }));

          setDonationData(formattedData);
          setRawPayments(data.payments);

          const paidPayments = data.payments.filter((p: ApiPayment) => p.status === 'paid');
          const total = paidPayments.reduce((sum: number, p: ApiPayment) => sum + p.amount, 0);
          setTotalDonated(total);
          setCompletedCount(paidPayments.length);

          setPageCache('alumni_donations', {
            donationData: formattedData,
            rawPayments: data.payments,
            totalDonated: total,
            completedCount: paidPayments.length,
          });
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        if (!cachedDonations) setError(err.message || 'Failed to fetch donation history');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();

    return () => controller.abort();
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

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleRetryPayment = async (row: PaymentRecord) => {
    const payment = rawPayments.find(p => p._id === row.paymentId);
    if (!payment) {
      alert('Payment record not found');
      return;
    }

    try {
      setActionLoading(row.paymentId);

      // Load Razorpay script
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          openRazorpayCheckout(payment);
        };
        document.body.appendChild(script);
      } else {
        openRazorpayCheckout(payment);
      }
    } catch (error) {
      console.error('Retry payment error:', error);
      alert('Failed to start payment retry');
    } finally {
      setActionLoading(null);
    }
  };

  const openRazorpayCheckout = (payment: any) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SSwNZtauzpeLMb',
      amount: Math.round(payment.amount * 100),
      currency: payment.currency || 'INR',
      name: 'KSR Alumni Portal',
      description: payment.purpose,
      order_id: payment.razorpayOrderId,
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
      },
      handler: async (response: any) => {
        try {
          const verifyRes = await fetch(`${API_BASE}/api/payments/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user?.token}`,
            },
            body: JSON.stringify(response),
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.success) {
            throw new Error(verifyData.message || 'Payment verification failed');
          }

          alert('Payment successful! Your donation has been received.');
          // Refresh the donation list
          window.location.reload();
        } catch (error: any) {
          console.error('Verification error:', error);
          alert(error.message || 'Payment verification failed');
        }
      },
      modal: {
        ondismiss: () => {
          // User closed the modal
        },
      },
      theme: {
        color: '#0084D6',
      },
    };

    const razorpayCheckout = new window.Razorpay(options);
    razorpayCheckout.on('payment.failed', (error: any) => {
      console.error('Payment failed:', error);
      alert('Payment failed: ' + (error.reason || 'Please try again.'));
    });
    razorpayCheckout.open();
  };

  const handleDeletePayment = async (row: PaymentRecord) => {
    if (!window.confirm('Are you sure you want to delete this pending donation?')) {
      return;
    }

    try {
      setActionLoading(row.paymentId);

      const response = await fetch(`${API_BASE}/api/payments/${row.paymentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete payment');
      }

      alert('Donation deleted successfully');
      // Remove from local state immediately for better UX
      setDonationData(prev => prev.filter(d => d.paymentId !== row.paymentId));
      setRawPayments(prev => prev.filter(p => p._id !== row.paymentId));
    } catch (error: any) {
      console.error('Delete payment error:', error);
      alert(error.message || 'Failed to delete donation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDonation = (row: PaymentRecord) => {
    const payment = rawPayments.find(p => p._id === row.paymentId);
    if (payment) {
      // Prepare modal data carefully to avoid type conflicts
      const modalDonation: PaymentRecord = {
        ...row,
        _id: payment._id,
        razorpayOrderId: payment.razorpayOrderId,
        amount_num: payment.amount,
        purpose: payment.purpose,
        createdAt: payment.createdAt
      };
      setViewModal({ isOpen: true, donation: modalDonation });
    }
  };

  const handlePayFromModal = async () => {
    if (!viewModal.donation) return;

    try {
      setActionLoading(viewModal.donation._id || null);

      // Load Razorpay script
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          openRazorpayCheckout(viewModal.donation);
        };
        document.body.appendChild(script);
      } else {
        openRazorpayCheckout(viewModal.donation);
      }
    } catch (error: any) {
      console.error('Pay from modal error:', error);
      alert('Failed to start payment');
    } finally {
      setActionLoading(null);
    }
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
                    <th>Actions</th>
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
                            <td>
                              <div className={styles.actionBtnWrapper}>
                                {/* View Button */}
                                <button
                                  onClick={() => handleViewDonation(row)}
                                  className={styles.viewBtn}
                                  title="View donation details"
                                >
                                  <span className="material-symbols-outlined">visibility</span>
                                </button>
                              </div>
                            </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className={styles.emptyState}>
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

            {/* View Donation Modal */}
            {viewModal.isOpen && viewModal.donation && (
              <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                  {/* Modal Header */}
                  <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Donation Details</h2>
                    <button
                      onClick={() => setViewModal({ isOpen: false, donation: null })}
                      className={styles.modalCloseBtn}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className={styles.modalBody}>
                    {/* Purpose */}
                    <div className={styles.modalField}>
                      <p className={styles.modalFieldLabel}>DONATION PURPOSE</p>
                      <p className={styles.modalFieldValue}>{viewModal.donation.purpose}</p>
                    </div>

                    {/* Amount */}
                    <div className={styles.modalField}>
                      <p className={styles.modalFieldLabel}>AMOUNT</p>
                      <p className={`${styles.modalFieldValue} ${styles.modalFieldAmount}`}>
                        {formatAmount(viewModal.donation.amount_num || 0)}
                      </p>
                    </div>

                    {/* Date */}
                    <div className={styles.modalField}>
                      <p className={styles.modalFieldLabel}>DATE</p>
                      <p className={styles.modalFieldValue}>{formatDate(viewModal.donation.createdAt || new Date())}</p>
                    </div>

                    {/* Status */}
                    <div className={styles.modalField}>
                      <p className={styles.modalFieldLabel}>STATUS</p>
                      <span className={`${styles.modalStatusBadge} ${
                        viewModal.donation.status === 'paid' ? styles.modalStatusPaid :
                        viewModal.donation.status === 'created' ? styles.modalStatusPending :
                        styles.modalStatusFailed
                      }`}>
                        <span className={styles.modalStatusDot}></span>
                        {mapStatus(viewModal.donation.status)}
                      </span>
                    </div>

                    {/* Transaction ID */}
                    {viewModal.donation.razorpayOrderId && (
                      <div className={styles.modalField}>
                        <p className={styles.modalFieldLabel}>TRANSACTION ID</p>
                        <p className={styles.modalTxId}>{viewModal.donation.razorpayOrderId}</p>
                      </div>
                    )}
                  </div>

                  {/* Modal Actions */}
                  <div className={styles.modalFooter}>
                    {viewModal.donation.status === 'created' && (
                      <button
                        onClick={handlePayFromModal}
                        disabled={actionLoading === viewModal.donation._id}
                        className={`${styles.modalActionBtn} ${styles.modalPayBtn}`}
                      >
                        {actionLoading === viewModal.donation._id ? 'Processing...' : 'Pay Now'}
                      </button>
                    )}
                    <button
                      onClick={() => setViewModal({ isOpen: false, donation: null })}
                      className={`${styles.modalActionBtn} ${styles.modalCloseBtn2}`}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
        </main>
    </div>
  );
};

export default Alumini_Donation_History;