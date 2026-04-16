import {  useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styles from './Co_Mail.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from './Components/BackButton/Back';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CoordinatorMail = ({ onLogout }) => {
    const [mailHistory, setMailHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        console.log('User object:', user); // Debug log
        // Always fetch mails, regardless of user state
        fetchDepartmentMails();
    }, []);

    const fetchDepartmentMails = async () => {
        try {
            setLoading(true);

            let apiUrl;
            if (user?.department) {
                console.log('Fetching mails for department:', user.department); // Debug log
                apiUrl = `${API_BASE_URL}/api/mail/department/${encodeURIComponent(user.department)}`;
            } else {
                console.log('No department found, fetching all mails'); // Debug log
                apiUrl = `${API_BASE_URL}/api/mail/all`;
            }

            console.log('API URL:', apiUrl); // Debug log

            // Fetch mails for coordinator's department or all mails
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
                const transformedMails = data.mails.map((mail, index) => ({
                    id: mail._id,
                    sender: mail.senderName,
                    type: mail.isBroadcast ? "Broadcast" : "",
                    message: mail.content,
                    time: formatDate(mail.createdAt),
                    btnClass: getButtonClass(index),
                    dominantStatus: mail.dominantStatus || 'pending', // Add status for border coloring
                    responseStats: mail.responseStats || { total: 0, accepted: 0, rejected: 0, pending: mail.recipientCount || 0 },
                    mailData: mail // Keep original data for navigation
                }));

                console.log('Transformed mails:', transformedMails); // Debug log
                setMailHistory(transformedMails);
            } else {
                console.error('API returned success: false', data);
            }
        } catch (err) {
            console.error('Error fetching department mails:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setSearchQuery("");
        fetchDepartmentMails();
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

    const getButtonClass = (index) => {
        const classes = [
            styles.btnViewGreyOutline,
            styles.btnViewGreenOutline,
            styles.btnViewRedOutline
        ];
        return classes[index % classes.length];
    };

    // Function to get border color based on response status
    const getBorderColorByStatus = (status) => {
        switch (status) {
            case 'accept':
                return '3px solid #16a34a'; // Green border for accepted
            case 'reject':
                return '3px solid #dc2626'; // Red border for rejected
            case 'pending':
            default:
                return '3px solid #6b7280'; // Grey border for pending
        }
    };

    // Filter mails based on search query
    const filteredMails = mailHistory.filter(mail =>
        mail.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mail.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mail.type && mail.type.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleViewMail = (mail) => {
        // Navigate to coordinator mail view page with complete mail data including response info
        navigate('/coordinator/info-form', {
            state: {
                mailId: mail.mailData._id,
                mailData: {
                    ...mail.mailData,
                    dominantStatus: mail.dominantStatus,
                    responseStats: mail.responseStats
                }
            }
        });
    };

    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar currentView="mail" onLogout={onLogout} />
            {/* Main Content Area */}
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">

                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable}`}>
                    <Back to={'/coordinator/dashboard'} />
                    <div className="w-full p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-[#001E2B]">Mail History</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    {user?.department && (
                                        <p className="text-sm text-slate-500">Department: {user.department}</p>
                                    )}
                                    {user?.department && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                            Showing {user.department} responses only
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative hidden sm:block">
                                    <input
                                        className="w-72 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3D00] focus:border-transparent"
                                        placeholder="Search mail..."
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
                                </div>
                                <button
                                    className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-[#FF3D00] hover:border-[#FF3D00] rounded-lg transition-all"
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
                                <p className="text-slate-500">Loading mails...</p>
                            </div>
                        ) : filteredMails.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">mail</span>
                                <h3 className="text-lg font-semibold text-slate-600 mb-2">No mails found</h3>
                                <p className="text-slate-500">
                                    {searchQuery ? "Try adjusting your search query" : "No mails available for your department"}
                                </p>
                            </div>
                        ) : (
                            <div className={`${styles.mailGrid} pb-12`}>
                                {filteredMails.map((mail, index) => (
                                    <div
                                        key={mail.id}
                                        className={styles.mailCard}
                                        style={{ border: getBorderColorByStatus(mail.dominantStatus) }}
                                    >
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="font-bold text-[#001E2B] text-lg">{mail.sender}</span>
                                                <div className="flex items-center gap-2">
                                                    {mail.type && (
                                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-full uppercase">{mail.type}</span>
                                                    )}
                                                    {/* Response Statistics Badge */}
                                                    {mail.responseStats && mail.responseStats.total > 0 && (
                                                        <div className="flex items-center gap-1 text-[10px] font-bold">
                                                            {mail.responseStats.accepted > 0 && (
                                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                                                    ✓ {mail.responseStats.accepted}
                                                                </span>
                                                            )}
                                                            {mail.responseStats.rejected > 0 && (
                                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">
                                                                    ✗ {mail.responseStats.rejected}
                                                                </span>
                                                            )}
                                                            {mail.responseStats.pending > 0 && (
                                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                                                    ⏳ {mail.responseStats.pending}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-slate-600 text-base line-clamp-3 leading-relaxed">
                                                {mail.message.length > 150 ? mail.message.substring(0, 150) + '...' : mail.message}
                                            </p>
                                        </div>
                                        <div className="mt-auto flex flex-col items-center gap-3">
                                            <span className="text-xs font-bold text-slate-400">{mail.time}</span>
                                            <button
                                                onClick={() => handleViewMail(mail)}
                                                className={`${styles.btnView} ${mail.btnClass}`}
                                            >
                                                View
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoordinatorMail;
