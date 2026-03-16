import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Co_Invitations.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from './Components/BackButton/Back';

const CoordinatorInvitations = ( { onLogout } ) => {
    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar currentView="invitations" onLogout={onLogout} />
            {/* Main Content Area */}
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} p-7 bg-[#F9FAFB]`}>
                    <Back to={'/coordinator/dashboard'} />
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
                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                        OR
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Office of Alumni Relations</h4>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            Invitation: Annual Networking Gala 2024 - Join us for a night of memories...
                                            <span className="text-slate-400 ml-1">• 2 hours ago</span>
                                        </p>
                                    </div>
                                </div>
                                <Link className="bg-[#FF3D00] hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-sm shadow-lg shadow-red-500/20" to="/coordinator/view_invitations">
                                    View Details
                                </Link>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-100">
                                        <img alt="Sarah Jenkins" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVoT9erMx-rowGU4vWVRI_lqLfJwzYRdszGnQRpJWF9W5p6XTyzTO6FHQ9kIfR3PcAKch245m7Llg6caZGe4RVSaSFk_3HkOH0OPy1u_8jsSWGtu8hSWIN_lxhacskZ1ThMuZkJUDWHerov7a6wmFrL28HVM8bghfWGX5PAVHifd_lB7XwQ_8Nve_fk3k-z2O_kG-WeEBOgilMroJyWZhrLbpBIfD2p0ffFFu85E96L5A8nIa8CGxBWeaOjod2XMKur7dWJS3tSQof" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Sarah Jenkins (Class of '15)</h4>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            Career Mentorship Inquiry - I saw your profile and was wondering if you...
                                            <span className="text-slate-400 ml-1">• Yesterday, 4:12 PM</span>
                                        </p>
                                    </div>
                                </div>
                                <Link className="bg-[#FF3D00] hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-sm shadow-lg shadow-red-500/20" to="/coordinator/view_invitations">
                                    View Details
                                </Link>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 font-bold">
                                        CS
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Career Services Center</h4>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            New Job Referrals based on your profile - We found 3 new matches today...
                                            <span className="text-slate-400 ml-1">• Nov 14, 2023</span>
                                        </p>
                                    </div>
                                </div>
                                <Link className="bg-[#FF3D00] hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-sm shadow-lg shadow-red-500/20" to="/coordinator/view_invitations">
                                    View Details
                                </Link>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                        OR
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Office of Alumni Relations</h4>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            Invitation: Annual Networking Gala 2024 - Join us for a night of memories...
                                            <span className="text-slate-400 ml-1">• 2 hours ago</span>
                                        </p>
                                    </div>
                                </div>
                                <Link className="bg-[#FF3D00] hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-sm shadow-lg shadow-red-500/20" to="/coordinator/view_invitations">
                                    View Details
                                </Link>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-100">
                                        <img alt="Sarah Jenkins" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVoT9erMx-rowGU4vWVRI_lqLfJwzYRdszGnQRpJWF9W5p6XTyzTO6FHQ9kIfR3PcAKch245m7Llg6caZGe4RVSaSFk_3HkOH0OPy1u_8jsSWGtu8hSWIN_lxhacskZ1ThMuZkJUDWHerov7a6wmFrL28HVM8bghfWGX5PAVHifd_lB7XwQ_8Nve_fk3k-z2O_kG-WeEBOgilMroJyWZhrLbpBIfD2p0ffFFu85E96L5A8nIa8CGxBWeaOjod2XMKur7dWJS3tSQof" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Sarah Jenkins (Class of '15)</h4>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            Career Mentorship Inquiry - I saw your profile and was wondering if you...
                                            <span className="text-slate-400 ml-1">• Yesterday, 4:12 PM</span>
                                        </p>
                                    </div>
                                </div>
                                <Link className="bg-[#FF3D00] hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-sm shadow-lg shadow-red-500/20" to="/coordinator/view_invitations">
                                    View Details
                                </Link>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 font-bold">
                                        CS
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Career Services Center</h4>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            New Job Referrals based on your profile - We found 3 new matches today...
                                            <span className="text-slate-400 ml-1">• Nov 14, 2023</span>
                                        </p>
                                    </div>
                                </div>
                                <Link className="bg-[#FF3D00] hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-sm shadow-lg shadow-red-500/20" to="/coordinator/view_invitations">
                                    View Details
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default CoordinatorInvitations;
