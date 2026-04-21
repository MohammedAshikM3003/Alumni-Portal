import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Co_Invitations.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from './Components/BackButton/Back';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

const CoordinatorInvitations = ({ onLogout }) => {
    const { user } = useAuth();
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInvitations = async () => {
            if (!user?.token) {
                setError('Please login to view invitations');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/api/invitations/all`, {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch invitations');
                }

                const data = await response.json();
                if (data.success && data.invitations) {
                    setInvitations(data.invitations);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchInvitations();
    }, [user]);

    if (loading) {
        return (
            <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
                <Sidebar currentView="invitations" onLogout={onLogout} />
                <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-slate-500">Loading invitations...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
                <Sidebar currentView="invitations" onLogout={onLogout} />
                <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-red-500">{error}</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar currentView="invitations" onLogout={onLogout} />
            {/* Main Content Area */}
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                <div className="sticky top-0 bg-[#F8FAFC] px-8 pt-6 pb-2 z-10 border-b border-slate-200">
                    <Back to={'/coordinator/dashboard'} />
                </div>
                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} p-7 bg-[#F9FAFB]`}>
                    <div className="max-w-7xl mx-auto">
                        <header className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900">Welcome back, Coordinator!</h2>
                                <p className="text-slate-500 mt-2">Check out what's happening in your alma mater today.</p>
                            </div>
                        </header>

                        <section className="pb-10">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center space-x-2 text-[#FF3D00]">
                                    <span className="material-symbols-outlined">email</span>
                                    <h3 className="font-bold text-lg text-slate-900">Received Emails</h3>
                                </div>
                            </div>
                            <div className="space-y-4">
                            {invitations.length > 0 ? (
                                invitations.map((invitation) => (
                                    <div key={invitation._id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                {getInitials(invitation.sender)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{invitation.sender || 'Unknown Sender'}</h4>
                                                <p className="text-sm text-slate-500 mt-0.5">
                                                    {invitation.subject || 'No subject'} - {(invitation.description || '').substring(0, 50)}...
                                                    <span className="text-slate-400 ml-1">• {formatDate(invitation.createdAt)}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <Link className="bg-[#FF3D00] hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-sm shadow-lg shadow-red-500/20" to={`/coordinator/view_invitations/${invitation._id}`}>
                                            View Details
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white p-10 rounded-xl border border-slate-100 shadow-sm text-center">
                                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">mail</span>
                                    <p className="text-slate-500">No invitations received yet.</p>
                                </div>
                            )}
                        </div>
                    </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoordinatorInvitations;
