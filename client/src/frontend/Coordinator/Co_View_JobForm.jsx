import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './Co_View_JobForm.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from './Components/BackButton/Back';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const CoordinatorViewJobForm = ({ onLogout }) => {
    const { id } = useParams();
    const { user } = useAuth();
    const [jobReference, setJobReference] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJobReference = async () => {
            if (!user?.token) {
                setError('Please login to view job reference');
                setLoading(false);
                return;
            }

            if (!id) {
                setError('Job reference ID not provided');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/api/jobs/${id}`, {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch job reference');
                }

                const data = await response.json();
                if (data.success && data.jobReference) {
                    setJobReference(data.jobReference);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchJobReference();
    }, [user, id]);

    if (loading) {
        return (
            <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
                <Sidebar currentView="job_and_reference" onLogout={onLogout} />
                <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-slate-500">Loading job reference...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !jobReference) {
        return (
            <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
                <Sidebar currentView="job_and_reference" onLogout={onLogout} />
                <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                    <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} p-8 bg-[#F8FAFC]`}>
                        <Back to={'/coordinator/job_and_reference'} />
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-red-500">{error || 'Job reference not found'}</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar currentView="job_and_reference" onLogout={onLogout} />
            {/* Main Content Area */}
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} p-8 bg-[#F8FAFC]`}>
                    <Back to={'/coordinator/job_and_reference'} />
                    <header className="bg-white border-b border-slate-200 p-3 flex items-center mb-8 rounded-xl shadow-sm">
                        <div className="flex items-center gap-4 w-full px-4">
                            <div className="relative w-full">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">notifications</span>
                                <div className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm flex items-center overflow-hidden whitespace-nowrap">
                                    <span className="font-semibold text-[#FF3D00] mr-2">New:</span>
                                    <span className="text-slate-600">{jobReference.submittedBy?.name || 'Alumni'} sent a referral for {jobReference.role} at {jobReference.companyName}...</span>
                                    <span className="ml-auto text-xs text-slate-400">{formatDate(jobReference.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="max-w-auto mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">View Job Reference</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${jobReference.status === 'approved' ? 'bg-green-100 text-green-700' : jobReference.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {jobReference.status}
                            </span>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Company Name</label>
                                        <p className="text-lg font-bold text-slate-900">{jobReference.companyName}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Role / Position</label>
                                        <p className="text-lg font-bold text-slate-900">{jobReference.role}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Target Branch / Department</label>
                                        <p className="text-lg font-bold text-slate-900">{jobReference.targetBranch}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Number of Vacancies</label>
                                        <p className="text-lg font-bold text-slate-900">{String(jobReference.vacancies).padStart(2, '0')}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Location</label>
                                        <p className="text-lg font-bold text-slate-900">{jobReference.location}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Work Mode</label>
                                        <p className="text-lg font-bold text-slate-900 capitalize">{jobReference.workMode}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 px-8 py-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                    <span className="material-symbols-outlined text-sm">info</span>
                                    Posted by {jobReference.submittedBy?.name || 'Alumni'} • Last updated {formatDate(jobReference.updatedAt)}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoordinatorViewJobForm;
