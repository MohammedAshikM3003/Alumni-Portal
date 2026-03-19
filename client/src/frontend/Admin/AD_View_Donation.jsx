import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import styles from './AD_View_Donation.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatAmount = (amount) => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const Admin_View_Donation = ({ onLogout }) => {
  const { id } = useParams();
  const { user } = useAuth();
  const receiptRef = useRef(null);
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayment = async () => {
      if (!user?.token) {
        setError('Please login to view donation details');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/payments/${id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch donation details');
        }

        const data = await response.json();

        if (data.success && data.payment) {
          setDonation(data.payment);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPayment();
    }
  }, [id, user]);

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid':
        return 'Successful';
      case 'failed':
        return 'Failed';
      case 'created':
        return 'Pending';
      default:
        return status;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Donation Receipt',
          text: `Donation Receipt - ${donation.user?.name || 'Unknown'}`,
          url: url,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          alert('Failed to share');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch {
        alert('Failed to copy link');
      }
    }
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const widthRatio = maxWidth / canvas.width;
      const heightRatio = maxHeight / canvas.height;
      const ratio = Math.min(widthRatio, heightRatio);

      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');

      const fileName = `donation-receipt-${donation.user?.name?.replace(/\s+/g, '_') || 'unknown'}-${Date.now()}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      alert('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'donation_history'} />
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <div className={styles.loadingState}>Loading donation details...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'donation_history'} />
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <div className={styles.errorState}>{error}</div>
          </div>
        </main>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'donation_history'} />
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <div className={styles.errorState}>Donation not found</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>

      {/* Sidebar */}
      <div className={styles.sidebarWrapper}>
        <Sidebar onLogout={onLogout} currentView={'donation_history'} />
      </div>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Back Button */}
        <div className={styles.backButton} onClick={() => window.history.back()}>
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back</span>
        </div>

        {/* Page Content */}
        <div className={styles.contentWrapper}>
          {/* Header & Back Button */}
          <div className={styles.pageHeader}>
            <h2 className={styles.pageTitle}>Donation Transaction Details</h2>
          </div>

          {/* Receipt Card Wrapper */}
          <div className={styles.receiptWrapper}>
            <div className={styles.receiptCard} ref={receiptRef}>

              {/* Top Color Bar */}
              <div className={styles.cardTopBar}></div>

              <div className={styles.cardBody}>
                {/* Receipt Header */}
                <div className={styles.receiptHeader}>
                  <div>
                    <h3 className={styles.receiptTitle}>Transaction Receipt</h3>
                    <p className={styles.receiptSubtitle}>Official record for this donation contribution</p>
                  </div>
                  <div className={styles.statusWrapper}>
                    <span className={styles.statusPill}>{getStatusLabel(donation.status)}</span>
                  </div>
                </div>

                {/* Receipt Details Grid */}
                <div className={styles.detailsGrid}>
                  <div className={styles.detailGroup}>
                    <label className={styles.detailLabel}>Donor Name</label>
                    <p className={styles.detailValue}>{donation.user?.name || 'Unknown'}</p>
                  </div>

                  <div className={styles.detailGroup}>
                    <label className={styles.detailLabel}>Donor Email</label>
                    <p className={styles.detailValue}>{donation.user?.email || 'N/A'}</p>
                  </div>

                  <div className={styles.detailGroup}>
                    <label className={styles.detailLabel}>Cause</label>
                    <p className={styles.detailValue}>{donation.purpose}</p>
                  </div>

                  <div className={styles.detailGroup}>
                    <label className={styles.detailLabel}>Payment Type</label>
                    <div className={styles.paymentTypeWrapper}>
                      <span className={`material-symbols-outlined ${styles.paymentIcon}`}>
                        account_balance_wallet
                      </span>
                      <p className={styles.detailValue}>Online (Razorpay)</p>
                    </div>
                  </div>

                  <div className={styles.detailGroup}>
                    <label className={styles.detailLabel}>Order ID</label>
                    <p className={styles.detailValueMono}>{donation.razorpayOrderId || 'N/A'}</p>
                  </div>

                  <div className={styles.detailGroup}>
                    <label className={styles.detailLabel}>Payment ID</label>
                    <p className={styles.detailValueMono}>{donation.razorpayPaymentId || 'N/A'}</p>
                  </div>

                  <div className={styles.detailGroup}>
                    <label className={styles.detailLabel}>Amount</label>
                    <p className={styles.detailValueLarge}>{formatAmount(donation.amount)}</p>
                  </div>

                  <div className={styles.detailGroup}>
                    <label className={styles.detailLabel}>Transaction Date</label>
                    <p className={styles.detailValue}>
                      {donation.paidAt ? formatDate(donation.paidAt) : formatDate(donation.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className={styles.divider}></div>

                {/* Card Footer (System Note & Actions) */}
                <div className={styles.cardFooter}>
                  <div className={styles.systemNote}>
                    <div className={styles.verifiedIcon}>
                      <span className="material-symbols-outlined">verified</span>
                    </div>
                    <p>
                      This is a system-generated document. <br />
                      K.S.R College of Engineering Alumni Portal.
                    </p>
                  </div>

                  <div className={styles.actionButtons}>
                    <button className={styles.iconBtn} aria-label="Print" onClick={handlePrint}>
                      <span className="material-symbols-outlined">print</span>
                    </button>
                    <button className={styles.iconBtn} aria-label="Share" onClick={handleShare}>
                      <span className="material-symbols-outlined">share</span>
                    </button>
                    <button className={styles.iconBtn} aria-label="Download" onClick={handleDownload}>
                      <span className="material-symbols-outlined">download</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin_View_Donation;
