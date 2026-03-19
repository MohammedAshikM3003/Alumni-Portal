import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './Co_View_Invitation.module.css';
import Back from './Components/BackButton/Back';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const CoordinatorViewInvitation = ({ onLogout }) => {
    const { id } = useParams();
    const { user } = useAuth();
    const [invitation, setInvitation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInvitation = async () => {
            if (!user?.token) {
                setError('Please login to view invitation');
                setLoading(false);
                return;
            }

            if (!id) {
                setError('Invitation ID not provided');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/api/invitations/${id}`, {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch invitation');
                }

                const data = await response.json();
                if (data.success && data.invitation) {
                    setInvitation(data.invitation);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchInvitation();
    }, [user, id]);

    if (loading) {
        return (
            <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden font-sans">
                <Sidebar currentView="invitations" onLogout={onLogout} />
                <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-slate-500">Loading invitation...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !invitation) {
        return (
            <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden font-sans">
                <Sidebar currentView="invitations" onLogout={onLogout} />
                <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                    <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} ${styles.dottedBg} min-h-screen`}>
                        <Back to={'/coordinator/invitations'} />
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-red-500">{error || 'Invitation not found'}</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const flyerUrl = invitation.flyer ? `${API_BASE}/api/invitations/image/${invitation.flyer}` : null;

    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden font-sans">
            {/* Sidebar */}
            <Sidebar currentView="invitations" onLogout={onLogout} />
            {/* Main Content Area */}
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} ${styles.dottedBg} min-h-screen`}>
                    <Back to={'/coordinator/invitations'} />
                    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-stretch pb-20">
                        <div className="w-full lg:w-1/3 min-h-[600px] bg-gradient-to-br from-[#FF3D00] to-[#C42E00] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col items-center justify-between py-16 px-8 text-center text-white">
                            <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                                <svg className="absolute -top-20 -left-20 w-[150%] h-[150%]" preserveAspectRatio="none" viewBox="0 0 100 100">
                                    <path d="M0,50 C20,20 40,80 60,50 C80,20 100,80 100,50 L100,100 L0,100 Z" fill="white"></path>
                                </svg>
                            </div>
                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-8 border border-white/30 text-white">
                                    <span className="material-symbols-outlined text-4xl">auto_awesome</span>
                                </div>
                                <h2 className="text-4xl font-bold leading-tight mb-4 tracking-tight uppercase">{invitation.subject}</h2>
                                <div className="w-16 h-1 bg-white/50 mx-auto rounded-full mb-8"></div>
                                <p className="text-xl font-medium opacity-90">{formatEventDate(invitation.eventDate)}</p>
                                <p className="text-lg opacity-75 font-light">{invitation.venue}</p>
                            </div>
                            <div className="relative z-10 mt-auto">
                                <span className="text-sm font-bold tracking-[0.2em] opacity-60 uppercase">From: {invitation.sender}</span>
                            </div>
                        </div>

                        <div className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-100 p-12 flex flex-col overflow-y-auto max-h-[calc(100vh-120px)]">
                            <div>
                                <span className="inline-block px-4 py-1.5 bg-[#FF3D00]/10 text-[#FF3D00] text-xs font-bold tracking-wider uppercase rounded-full mb-6">EVENT INVITATION</span>
                                <h1 className="text-4xl font-extrabold text-slate-900 mb-10">{invitation.subject}</h1>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                                    <div className="flex items-center space-x-4 group">
                                        <div className="w-12 h-12 rounded-2xl bg-[#FF3D00]/10 flex items-center justify-center text-[#FF3D00] transition-transform group-hover:scale-110 shrink-0">
                                            <span className="material-symbols-outlined">calendar_today</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                                            <p className="font-semibold text-slate-800">{formatEventDate(invitation.eventDate)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 group">
                                        <div className="w-12 h-12 rounded-2xl bg-[#FF3D00]/10 flex items-center justify-center text-[#FF3D00] transition-transform group-hover:scale-110 shrink-0">
                                            <span className="material-symbols-outlined">schedule</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</p>
                                            <p className="font-semibold text-slate-800">{invitation.eventTime}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 group">
                                        <div className="w-12 h-12 rounded-2xl bg-[#FF3D00]/10 flex items-center justify-center text-[#FF3D00] transition-transform group-hover:scale-110 shrink-0">
                                            <span className="material-symbols-outlined">location_on</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
                                            <p className="font-semibold text-slate-800">{invitation.venue}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-slate-900">About the Event</h3>
                                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                                        {invitation.description}
                                    </p>
                                </div>
                            </div>
                            {flyerUrl && (
                                <div className="mt-12">
                                    <h3 className="text-lg font-bold text-slate-900 mb-6">Event Flyer</h3>
                                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                        <img
                                            src={flyerUrl}
                                            alt="Event Flyer"
                                            className="w-full h-auto object-contain"
                                        />
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

export default CoordinatorViewInvitation;
