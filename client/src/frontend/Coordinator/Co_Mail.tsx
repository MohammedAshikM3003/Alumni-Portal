import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Co_Mail.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface ResponseStats {
    total: number;
    accepted: number;
    rejected: number;
    pending: number;
}

interface ApiMail {
    _id: string;
    senderName: string;
    title?: string;
    isBroadcast: boolean;
    content: string;
    createdAt: string;
    dominantStatus?: string;
    responseStats?: ResponseStats;
    recipientCount?: number;
}

interface MailItem {
    id: string;
    sender: string;
    title: string;
    type: string;
    message: string;
    date: Date;
    dominantStatus: string;
    responseStats: ResponseStats;
    mailData: ApiMail;
}

interface CoordinatorMailProps {
    onLogout: () => void;
}

const CoordinatorMail: FC<CoordinatorMailProps> = ({ onLogout }) => {
    const [mailHistory, setMailHistory] = useState<MailItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [resolvedDepartment, setResolvedDepartment] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accept' | 'reject'>('all');
    const [draftCount, setDraftCount] = useState<number>(0);
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchDepartmentMails = async (signal?: AbortSignal): Promise<void> => {
        try {
            setLoading(true);
            setMailHistory([]);
            setResolvedDepartment("");

            if (!user?.token || !user?.department) {
                setMailHistory([]);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/mail/department/${encodeURIComponent(user.department)}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                signal,
            });

            const data = await response.json();

            if (data.success) {
                setResolvedDepartment(data.department || "");
                const transformedMails: MailItem[] = data.mails.map((mail: ApiMail) => ({
                    id: mail._id,
                    sender: mail.senderName,
                    title: mail.title || 'No Subject',
                    type: mail.isBroadcast ? "Broadcast" : "",
                    message: mail.content,
                    date: new Date(mail.createdAt),
                    dominantStatus: mail.dominantStatus || 'pending',
                    responseStats: mail.responseStats || { total: 0, accepted: 0, rejected: 0, pending: mail.recipientCount || 0 },
                    mailData: mail
                }));

                setMailHistory(transformedMails);
            } else {
                setMailHistory([]);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            setMailHistory([]);
            console.error('Error fetching department mails:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        if (user?.token) {
            fetchDepartmentMails(controller.signal);
            
            // Fetch draft count
            fetch(`${API_BASE_URL}/api/drafts/count`, {
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setDraftCount(data.count);
                }
            })
            .catch(err => {
                if (err.name !== 'AbortError') console.error('Error fetching draft count:', err);
            });
        } else {
            setLoading(false);
        }

        return () => controller.abort();
    }, [user?.token]);

    const handleRefresh = () => {
        setSearchQuery("");
        fetchDepartmentMails();
    };

    const formatDate = (date: Date): string => {
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

    const counts = {
        all: mailHistory.length,
        pending: mailHistory.filter(m => m.dominantStatus === 'pending').length,
        accepted: mailHistory.filter(m => m.dominantStatus === 'accept').length,
        rejected: mailHistory.filter(m => m.dominantStatus === 'reject').length,
    };

    const filteredMails = mailHistory.filter(mail => {
        const matchesSearch = mail.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
            mail.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            mail.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (mail.type && mail.type.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        if (filterStatus === 'all') return true;
        return mail.dominantStatus === filterStatus;
    });

    const handleViewMail = (mail: MailItem) => {
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
            <Sidebar currentView="mail" onLogout={onLogout} />
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable}`}>
                    <div className="w-full p-8">
                        <div className="flex items-end justify-between mb-8">
                            <div className="flex flex-col items-start gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-[#001E2B]">Mail History</h2>
                                    <p className="text-sm text-slate-500 mt-1 mb-2">View, track, and manage all sent mail broadcasts and invitation threads</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {(resolvedDepartment || user?.department) && (
                                            <p className="text-sm text-slate-500">Department: {resolvedDepartment || user?.department}</p>
                                        )}
                                        {(resolvedDepartment || user?.department) && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                                Showing only {(resolvedDepartment || user?.department)} alumni mails
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex items-center flex-wrap gap-4 mt-2">
                                    <button className="bg-[#ff3d00] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm">
                                        <span className="material-symbols-outlined text-sm">add</span>
                                        Compose Mail
                                    </button>
                                    
                                    <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                                        <span className="material-symbols-outlined text-sm">drafts</span>
                                        Drafts
                                        <span className="bg-slate-100 text-slate-600 text-xs py-0.5 px-2 rounded-full font-bold">{draftCount}</span>
                                    </button>

                                    <div className="flex bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                                        {[
                                            { id: 'all', label: 'All', count: counts.all },
                                            { id: 'pending', label: 'Pending', count: counts.pending },
                                            { id: 'accept', label: 'Accepted', count: counts.accepted },
                                            { id: 'reject', label: 'Rejected', count: counts.rejected }
                                        ].map(filter => (
                                            <button 
                                                key={filter.id}
                                                onClick={() => setFilterStatus(filter.id as any)}
                                                className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-colors border-r border-slate-200 last:border-r-0 ${filterStatus === filter.id ? 'bg-[#ff3d00]/10 text-[#ff3d00]' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                {filter.label}
                                                <span className={`text-xs py-0.5 px-2 rounded-full font-bold ${filterStatus === filter.id ? 'bg-[#ff3d00]/20 text-[#ff3d00]' : 'bg-slate-100 text-slate-500'}`}>
                                                    {filter.count}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
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
                            <div className={styles.tableWrapper}>
                                <table className={styles.mailTable}>
                                    <thead>
                                        <tr>
                                            <th className={styles.thSender}>From</th>
                                            <th className={styles.thSubject}>Subject</th>
                                            <th className={styles.thDate}>Date</th>
                                            <th className={styles.thStats}>Response Status</th>
                                            <th className={styles.thAction}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMails.map((mail) => (
                                            <tr key={mail.id} className={styles.mailRow}>
                                                <td className={styles.tdSender}>
                                                    <div className={styles.senderCell}>
                                                        <span className={styles.senderName}>{mail.sender}</span>
                                                        {mail.type && <span className={styles.badge}>{mail.type}</span>}
                                                    </div>
                                                </td>
                                                <td className={styles.tdSubject}>
                                                    <div className={styles.subjectCell}>
                                                        {mail.message.length > 100 ? mail.message.substring(0, 100) + '...' : mail.message}
                                                    </div>
                                                </td>
                                                <td className={styles.tdDate}>{formatDate(mail.date)}</td>
                                                <td className={styles.tdStats}>
                                                    <div className={styles.statsContainer}>
                                                        {mail.responseStats.accepted > 0 && (
                                                            <span className={styles.statAccepted}>
                                                                ✓ {mail.responseStats.accepted}
                                                            </span>
                                                        )}
                                                        {mail.responseStats.rejected > 0 && (
                                                            <span className={styles.statRejected}>
                                                                ✗ {mail.responseStats.rejected}
                                                            </span>
                                                        )}
                                                        {mail.responseStats.pending > 0 && (
                                                            <span className={styles.statPending}>
                                                                ⏳ {mail.responseStats.pending}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={styles.tdAction}>
                                                    <button
                                                        className={styles.viewButton}
                                                        onClick={() => handleViewMail(mail)}
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoordinatorMail;
