import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styles from './Co_Donation_History.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from './Components/BackButton/Back';
import { DateInput } from '../../components/Calendar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatAmount = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getInitials = (name) => {
    if (!name) return 'NA';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

const CoordinatorDonationHistory = ({ onLogout }) => {
    const { user } = useAuth();
    const [donationData, setDonationData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [latestDonor, setLatestDonor] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchPayments = async () => {
            if (!user?.token) {
                setError('Please login to view donations');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/api/payments/all`, {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch donations');
                }

                const data = await response.json();

                if (data.success && data.payments) {
                    const formattedData = data.payments
                        .filter(payment => payment.status === 'paid')
                        .map((payment, index) => ({
                            id: payment._id,
                            sno: index + 1,
                            name: payment.user?.name || 'Unknown',
                            initials: getInitials(payment.user?.name),
                            details: payment.purpose,
                            amount: formatAmount(payment.amount),
                            rawAmount: payment.amount,
                            date: formatDate(payment.paidAt || payment.createdAt),
                            type: 'Online',
                        }));

                    setDonationData(formattedData);
                    setFilteredData(formattedData);

                    // Set latest donor for banner
                    if (formattedData.length > 0) {
                        setLatestDonor({
                            name: formattedData[0].name,
                            amount: formattedData[0].amount,
                        });
                    }
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [user]);

    // Filter data based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredData(donationData);
        } else {
            const term = searchTerm.toLowerCase();
            const filtered = donationData.filter(item =>
                item.name.toLowerCase().includes(term) ||
                item.details.toLowerCase().includes(term)
            );
            setFilteredData(filtered);
        }
        setCurrentPage(1);
    }, [searchTerm, donationData]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    const paginatedData = filteredData.slice(startIndex, endIndex);

    const handlePreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePageClick = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const getTypeStyle = (type) => {
        switch (type) {
            case 'UPI': return styles.typeUpi;
            case 'Net Banking': return styles.typeNetBanking;
            case 'Credit Card': return styles.typeCreditCard;
            case 'Debit Card': return styles.typeDebitCard;
            default: return styles.typeUpi;
        }
    };

    if (loading) {
        return (
            <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
                <Sidebar onLogout={onLogout} currentView="donation_history" />
                <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden items-center justify-center">
                    <div className="text-slate-600">Loading donations...</div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
                <Sidebar onLogout={onLogout} currentView="donation_history" />
                <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden items-center justify-center">
                    <div className="text-red-600">{error}</div>
                </main>
            </div>
        );
    }

    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar onLogout={onLogout} currentView="donation_history" />
            {/* Main Content Area */}
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} p-8 bg-[#F8FAFC]`}>
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">Alumni Donations Tracking</h2>
                            <button className="bg-[#FF3D00] hover:bg-red-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-sm shadow-red-500/10">
                                <span className="material-symbols-outlined text-lg">file_download</span>
                                Export Report
                            </button>
                        </div>

                        {/* Search & Filter */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 mb-6">
                            <div className="flex-1 min-w-[300px]">
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-[#FF3D00]/20 text-sm"
                                        placeholder="Search by donor name or cause..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <DateInput
                                    theme="coordinator"
                                    className="bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-[#FF3D00]/20 text-sm px-4 py-2"
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-200">
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">S.NO</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Donor Name</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cause</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Type</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedData.length > 0 ? (
                                            paginatedData.map((item, index) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{startIndex + index + 1}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-xs">
                                                                {item.initials}
                                                            </div>
                                                            <span className="font-medium text-slate-900">{item.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{item.details}</td>
                                                    <td className="px-6 py-4 font-bold text-[#FF3D00]">{item.amount}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{item.date}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`${styles.typePill} ${getTypeStyle(item.type)}`}>
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Link className="text-slate-400 hover:text-[#FF3D00] transition-colors p-1" to={`/coordinator/View_donation/${item.id}`}>
                                                            <span className="material-symbols-outlined">visibility</span>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                                    No donations found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {filteredData.length > 0 && (
                                <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-white">
                                    <p className="text-sm text-slate-500">Showing {startIndex + 1} to {endIndex} of {filteredData.length} entries</p>
                                    <div className="flex gap-2">
                                        <button
                                            className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                            onClick={handlePreviousPage}
                                            disabled={currentPage === 1}
                                        >
                                            Previous
                                        </button>
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((pageNum) => (
                                            <button
                                                key={pageNum}
                                                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                                                    currentPage === pageNum
                                                        ? 'bg-[#FF3D00] text-white'
                                                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                                onClick={() => handlePageClick(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        ))}
                                        <button
                                            className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                            onClick={handleNextPage}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoordinatorDonationHistory;
