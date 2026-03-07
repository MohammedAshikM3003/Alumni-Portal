import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Co_View_JobForm.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from './Components/BackButton/Back';

const CoordinatorViewJobForm = ( { onLogout } ) => {
    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar currentView="job_and_reference" onLogout={onLogout} />
            {/* Main Content Area */}
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1 className={`${styles.collegeName} hidden md:block`}>K.S.R College of Engineering</h1>
                    </div>
                </header>

                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} p-8 bg-[#F8FAFC]`}>
                    <header className="bg-white border-b border-slate-200 p-3 flex items-center mb-8 rounded-xl shadow-sm">
                        <div className="flex items-center gap-4 w-full px-4">
                            <div className="relative w-full">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">notifications</span>
                                <div className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm flex items-center overflow-hidden whitespace-nowrap">
                                    <span className="font-semibold text-[#FF3D00] mr-2">New:</span>
                                    <span className="text-slate-600">Rahul Sharma sent a referral for Senior Product Designer at Google...</span>
                                    <span className="ml-auto text-xs text-slate-400">2m ago</span>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="max-w-auto mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">View Job Reference</h2>
                            <Link className="bg-[#FF3D00] hover:bg-red-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-red-500/20" to="/coordinator/job_and_reference">
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                                Back
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Company Name</label>
                                        <p className="text-lg font-bold text-slate-900">Google</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Role / Position</label>
                                        <p className="text-lg font-bold text-slate-900">Senior Product Designer</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Target Branch / Department</label>
                                        <p className="text-lg font-bold text-slate-900">Computer Science / Information Technology</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Number of Vacancies</label>
                                        <p className="text-lg font-bold text-slate-900">05</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 px-8 py-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                    <span className="material-symbols-outlined text-sm">info</span>
                                    Posted by Rahul Sharma • Last updated 2 mins ago
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
