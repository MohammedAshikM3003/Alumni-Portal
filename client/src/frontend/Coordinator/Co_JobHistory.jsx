import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Co_JobHistory.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from './Components/BackButton/Back';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

const CoordinatorJobHistory = ({ onLogout }) => {
    const { user } = useAuth();
    const [jobReferences, setJobReferences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJobReferences = async () => {
            if (!user?.token) {
                setError('Please login to view job references');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/api/jobs/all`, {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch job references');
                }

                const data = await response.json();
                if (data.success && data.jobReferences) {
                    setJobReferences(data.jobReferences);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchJobReferences();
    }, [user]);

    if (loading) {
        return (
            <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
                <Sidebar currentView="job_and_reference" onLogout={onLogout} />
                <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-slate-500">Loading job references...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
                <Sidebar currentView="job_and_reference" onLogout={onLogout} />
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
            <Sidebar currentView="job_and_reference" onLogout={onLogout} />
            {/* Main Content Area */}
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                <div className="sticky top-0 bg-[#F8FAFC] px-8 pt-6 pb-2 z-10 border-b border-slate-200">
                    <Back to={'/coordinator/dashboard'} />
                </div>
                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} p-6 bg-[#F8FAFC]`}>
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                                <span className="material-symbols-outlined text-[#FF3D00]">trending_up</span>
                                Job Referral Management
                            </h2>
                            <p className="text-slate-500 text-sm mt-0.5">Review and manage active job referral requests from alumni.</p>
                        </div>
                    </div>

                    {jobReferences.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                            {jobReferences.map((job) => (
                                <div key={job._id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl border-2 border-slate-50">
                                                {getInitials(job.submittedBy?.name)}
                                            </div>
                                            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${job.status === 'approved' ? 'bg-green-500' : job.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                        </div>
                                        <h3 className="mt-3 font-bold text-base text-slate-900">{job.submittedBy?.name || 'Unknown'}</h3>
                                        <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wide">Referrer</p>
                                        <div className="mt-4 w-full space-y-1">
                                            <p className="text-[#FF3D00] font-black text-sm uppercase">{job.companyName}</p>
                                            <p className="text-slate-600 font-medium text-xs">{job.role}</p>
                                        </div>
                                        <Link className="mt-4 w-full bg-[#FF3D00] hover:bg-red-600 text-white py-2.5 rounded-lg font-bold text-xs transition-all transform active:scale-95 shadow-md shadow-red-500/10 text-center flex items-center justify-center" to={`/coordinator/View_job_and_reference/${job._id}`}>
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-10 rounded-xl border border-slate-100 shadow-sm text-center">
                            <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">work</span>
                            <p className="text-slate-500">No job references found.</p>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default CoordinatorJobHistory;
