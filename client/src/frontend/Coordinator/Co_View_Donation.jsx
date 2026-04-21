import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import styles from './Co_View_Donation.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from './Components/BackButton/Back';
import { useAuth } from '../../context/authContext/authContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatAmount = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const CoordinatorViewDonation = ({ onLogout }) => {
    const { id } = useParams();
    const { user } = useAuth();
    const [donation, setDonation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const donationCardRef = useRef(null);

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

    const getStatusStyle = (status) => {
        switch (status) {
            case 'paid':
                return { bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', label: 'Successful' };
            case 'failed':
                return { bgColor: 'bg-red-50', textColor: 'text-red-600', label: 'Failed' };
            case 'created':
                return { bgColor: 'bg-amber-50', textColor: 'text-amber-600', label: 'Pending' };
            default:
                return { bgColor: 'bg-slate-50', textColor: 'text-slate-600', label: status };
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        const shareText = `Donation: ${donation.purpose} - Amount: ₹${donation.amount}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Donation Receipt',
                    text: shareText,
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText);
            alert('Donation details copied to clipboard');
        }
    };

    const handleDownload = async () => {
        if (!donationCardRef.current) return;

        try {
            // Clone the card to avoid modifying the original
            const clonedCard = donationCardRef.current.cloneNode(true);

            // Remove the buttons section from the clone (last flex-gap-3 div with buttons)
            const buttonsDiv = clonedCard.querySelector('div.flex.gap-3');
            if (buttonsDiv) {
                buttonsDiv.remove();
            }

            // Create a temporary container
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'fixed';
            tempContainer.style.top = '0';
            tempContainer.style.left = '0';
            tempContainer.style.width = '100%';
            tempContainer.style.zIndex = '-9999';
            tempContainer.appendChild(clonedCard);
            document.body.appendChild(tempContainer);

            const canvas = await html2canvas(clonedCard, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });

            // Remove temp container
            document.body.removeChild(tempContainer);

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

            const fileName = `donation-receipt-${Date.now()}.pdf`;
            pdf.save(fileName);
        } catch (err) {
            alert('Failed to generate PDF');
        }
    };

    if (loading) {
        return (
            <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
                <Sidebar currentView="donation_history" onLogout={onLogout} />
                <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden items-center justify-center">
                    <div className="text-slate-600">Loading donation details...</div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
                <Sidebar currentView="donation_history" onLogout={onLogout} />
                <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden items-center justify-center">
                    <div className="text-red-600">{error}</div>
                </main>
            </div>
        );
    }

    if (!donation) {
        return (
            <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
                <Sidebar currentView="donation_history" onLogout={onLogout} />
                <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden items-center justify-center">
                    <div className="text-slate-600">Donation not found</div>
                </main>
            </div>
        );
    }

    const statusStyle = getStatusStyle(donation.status);

    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar currentView="donation_history" onLogout={onLogout} />
            {/* Main Content Area */}
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                <div className="sticky top-0 bg-[#F8FAFC] px-8 pt-6 pb-2 z-10 border-b border-slate-200">
                    <Back to={'/coordinator/donation_history'} />
                </div>
                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} p-8 bg-[#F8FAFC]`}>
                    <div className="max-w-8xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">Donation Transaction Details</h2>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8" ref={donationCardRef}>
                            <div className="h-2 bg-[#FF3D00] w-full"></div>
                            <div className="p-8 md:p-12">
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-1">Transaction Receipt</h3>
                                        <p className="text-sm text-slate-500">Official record for this donation contribution</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`${statusStyle.bgColor} ${statusStyle.textColor} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}>
                                            {statusStyle.label}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Donor Name</label>
                                        <p className="text-base font-bold text-slate-900">{donation.user?.name || 'Unknown'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Donor Email</label>
                                        <p className="text-base font-bold text-slate-900">{donation.user?.email || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cause</label>
                                        <p className="text-base font-bold text-slate-900">{donation.purpose}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Payment Type</label>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-blue-500 text-xl">account_balance_wallet</span>
                                            <p className="text-base font-bold text-slate-900">Online (Razorpay)</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Order ID</label>
                                        <p className="text-base font-bold text-slate-900 font-mono">{donation.razorpayOrderId || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Payment ID</label>
                                        <p className="text-base font-bold text-slate-900 font-mono">{donation.razorpayPaymentId || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Amount</label>
                                        <p className="text-3xl font-bold text-slate-900">{formatAmount(donation.amount)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Transaction Date</label>
                                        <p className="text-base font-bold text-slate-900">
                                            {donation.paidAt ? formatDate(donation.paidAt) : formatDate(donation.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                <div className="my-10 border-t border-dashed border-slate-200"></div>

                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-[#FF3D00]">
                                            <span className="material-symbols-outlined">verified</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 leading-relaxed">This is a system-generated document. <br />K.S.R College of Engineering Alumni Portal.</p>
                                        </div>
                                    </div>
                                    <div className={`flex gap-3 ${styles.noPrint}`}>
                                        <button onClick={handlePrint} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                                            <span className="material-symbols-outlined">print</span>
                                        </button>
                                        <button onClick={handleShare} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                                            <span className="material-symbols-outlined">share</span>
                                        </button>
                                        <button onClick={handleDownload} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
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

export default CoordinatorViewDonation;
