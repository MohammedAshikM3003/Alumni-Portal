import { Link } from 'react-router-dom';
import styles from './Co_Dashboard.module.css';
import Sidebar from './Components/Sidebar/Sidebar';

const Coordinator_Dashboard = ( { onLogout } ) => {
    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 min-h-screen flex overflow-hidden font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
            <Sidebar currentView="dashboard" onLogout={onLogout} />
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1 className={`${styles.collegeName} hidden md:block`}>K.S.R College of Engineering</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative hidden sm:block">
                            <input className="w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3D00] focus:border-transparent" placeholder="Search alumni, jobs..." type="text" />
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
                                <span className="material-symbols-outlined">notifications</span>
                                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
                            </button>
                            <div className="h-8 w-[1px] bg-slate-200"></div>
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden lg:block">
                                    <p className="text-sm font-bold text-[#001E2B]">Mohammed Ashik M</p>
                                    <p className="text-xs text-slate-500">Class of 2018</p>
                                </div>
                                <div className="size-10 rounded-full bg-slate-100 border-2 border-[#FF3D00] overflow-hidden">
                                    <img alt="User profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCy29l1WzunyAjiRD6SzVOveOoOJ4sRZWjusYjhMmBN8mEcEU612GP9-RWaw7OPzq_9vdwrx7a-_tRk7usal0ltsyGKefbK7NlKRwNMKlx5dyAsY_t6_9foDZay8Za9LYG4PLA2ZOORrD_AKThNfSBNKXRXR0GqVHV49AkIoLI4Z42dUOGQn1S5Do6x-CeFLH6R9seCFXLyF2BGuBd2sm2dDHuA1ffwbhc-f8KrfvnqpWMrPvcTMvaeWMqC26-CypNOPXTK_hzGfbPX" />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                <div className={`flex-1 overflow-y-auto ${styles.mainContentScrollbar}`}>
                    <div className="p-[26px] space-y-6 pb-12">
                        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="p-1 -mt-1 bg-blue-50 rounded-lg">
                                        <span className="material-symbols-outlined text-blue-600">mail</span>
                                    </div>
                                    <span className="px-2 py-1 text-blue-600 text-xs font-bold rounded-full bg-blue-50">2 New</span>
                                </div>
                                <h3 className="text-lg font-bold text-[#001E2B] mb-4">Latest Messages</h3>
                                <div className="space-y-3 mb-6 flex-grow">
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer">
                                        <p className="text-xs font-bold text-[#FF3D00] mb-0.5">Admin</p>
                                        <p className="text-sm font-medium text-[#001E2B] truncate">Welcome to the network, Mohammed!</p>
                                        <p className="text-[10px] text-slate-400 mt-1">2 hours ago</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer">
                                        <p className="text-xs font-bold text-emerald-600 mb-0.5">Career Cell</p>
                                        <p className="text-sm font-medium text-[#001E2B] truncate">New job referral available for SDE-1...</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Yesterday</p>
                                    </div>
                                </div>
                                <Link className="w-full py-2 bg-slate-100 text-slate-800 rounded-lg font-bold hover:bg-slate-200 transition-colors mt-auto text-center block" to="/coordinator/mail">Go to Inbox</Link>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="p-1 -mt-1 bg-emerald-50 rounded-lg">
                                        <span className="material-symbols-outlined text-emerald-600">work_outline</span>
                                    </div>
                                    <span className="text-xs text-slate-500 font-bold">12 active postings</span>
                                </div>
                                <h3 className="text-lg font-bold text-[#001E2B] mb-4">Career Hub</h3>
                                <div className="space-y-3 mb-6 flex-grow">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-[#FF3D00]/40 transition-colors cursor-pointer">
                                        <div>
                                            <p className="text-sm font-bold text-[#001E2B]">Senior Dev, Google</p>
                                            <p className="text-xs text-slate-500">Referral by Rahul S.</p>
                                        </div>
                                        <span className="material-symbols-outlined text-[#FF3D00] text-xl">arrow_forward</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-[#FF3D00]/40 transition-colors cursor-pointer">
                                        <div>
                                            <p className="text-sm font-bold text-[#001E2B]">Lead Architect, IBM</p>
                                            <p className="text-xs text-slate-500">Open Referral</p>
                                        </div>
                                        <span className="material-symbols-outlined text-[#FF3D00] text-xl">arrow_forward</span>
                                    </div>
                                </div>
                                <Link className="w-full py-2 border-2 border-[#FF3D00]/30 hover:border-[#FF3D00] hover:bg-[#FF3D00] hover:text-white text-[#FF3D00] font-bold rounded-lg transition-all mt-auto text-center block" to="/coordinator/job_and_reference">Explore All Jobs</Link>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="p-1 -mt-1 bg-orange-50 rounded-lg">
                                        <span className="material-symbols-outlined text-orange-600">payments</span>
                                    </div>
                                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">Scholarship Goal</span>
                                </div>
                                <h3 className="text-lg font-bold text-[#001E2B] mb-2">Latest Department Donation</h3>
                                <div className="mb-2"><p className="text-4xl font-extrabold text-[#001E2B] tracking-tight">₹50,000</p><p className="text-sm font-medium text-slate-500">Computer Science Department</p></div>

                                <div className="space-y-3 mb-6"><div className="flex items-center gap-2 text-slate-400 mt-4">
                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                    <p className="text-xs font-medium">Received 2 hours ago</p>
                                </div>
                                </div>
                                <Link className="w-full py-2 bg-[#FF3D00] text-white rounded-lg font-bold hover:bg-[#FF3D00]/90 transition-all shadow-sm mt-auto text-center block" to="/coordinator/donation_history">View History</Link>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="p-1 -mt-1 bg-purple-50 rounded-lg">
                                        <span className="material-symbols-outlined text-purple-600">event_upcoming</span>
                                    </div>
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded uppercase">Upcoming</span>
                                </div>
                                <h3 className="text-lg font-bold text-[#001E2B] mb-2">Grand Reunion 2024</h3>
                                <p className="text-slate-600 text-sm mb-4 leading-relaxed">Join us for an evening of nostalgia and networking as we celebrate 40 years of excellence.</p>
                                <div className="flex items-center gap-2 text-slate-500 text-xs mb-8">
                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                    <span className="font-medium">Main Campus Auditorium</span>
                                </div>
                                <div className="flex justify-center items-center gap-4 mb-8 flex-grow">
                                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 py-4 rounded-xl border border-slate-100 min-w-[70px]">
                                        <p className="text-2xl font-bold text-[#001E2B]">14</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Days</p>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 py-4 rounded-xl border border-slate-100 min-w-[70px]">
                                        <p className="text-2xl font-bold text-[#001E2B]">08</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Hrs</p>
                                    </div>
                                </div>
                                <Link className="w-full py-2 bg-[#001E2B] text-white rounded-lg font-bold hover:bg-slate-800 transition-colors mt-auto text-center block" to="/coordinator/invitations">RSVP Today</Link>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full lg:col-span-2">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 rounded-lg bg-[#FF3D00]/10">
                                            <span className="material-symbols-outlined text-[#FF3D00] text-xl">military_tech</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-[#001E2B]">Achievements & News</h3>
                                    </div>
                                    <button className="text-xs font-bold text-[#FF3D00] hover:underline flex items-center gap-1">
                                        View All <span className="material-symbols-outlined text-xs">open_in_new</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                                    <div className="group border border-slate-100 p-4 rounded-xl hover:bg-slate-50 transition-all hover:border-[#FF3D00]/20 flex flex-col bg-slate-50/30">
                                        <p className="text-[10px] text-[#FF3D00] font-bold uppercase tracking-wider mb-1">Oct 24, 2023</p>
                                        <h4 className="text-sm font-bold text-[#001E2B] leading-snug mb-1 group-hover:text-[#FF3D00] transition-colors">Startup center secures ₹5Cr Funding</h4>
                                        <p className="text-xs text-slate-600 line-clamp-2 mb-3 flex-grow">Major grant to boost innovation hub, benefiting 50+ student startups.</p>
                                        <a className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF3D00] hover:text-[#001E2B] transition-colors" href="#">
                                            Read More <span className="material-symbols-outlined text-[10px]">arrow_forward_ios</span>
                                        </a>
                                    </div>
                                    <div className="group border border-slate-100 p-4 rounded-xl hover:bg-slate-50 transition-all hover:border-[#FF3D00]/20 flex flex-col bg-slate-50/30">
                                        <p className="text-[10px] text-[#FF3D00] font-bold uppercase tracking-wider mb-1">Oct 22, 2023</p>
                                        <h4 className="text-sm font-bold text-[#001E2B] leading-snug mb-1 group-hover:text-[#FF3D00] transition-colors">Dr. Arul wins "Outstanding Researcher"</h4>
                                        <p className="text-xs text-slate-600 line-clamp-2 mb-3 flex-grow">Honored for breakthrough contributions in Renewable Energy Systems.</p>
                                        <a className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF3D00] hover:text-[#001E2B] transition-colors" href="#">
                                            Read More <span className="material-symbols-outlined text-[10px]">arrow_forward_ios</span>
                                        </a>
                                    </div>
                                    <div className="group border border-slate-100 p-4 rounded-xl hover:bg-slate-50 transition-all hover:border-[#FF3D00]/20 flex flex-col bg-slate-50/30">
                                        <p className="text-[10px] text-[#FF3D00] font-bold uppercase tracking-wider mb-1">Oct 20, 2023</p>
                                        <h4 className="text-sm font-bold text-[#001E2B] leading-snug mb-1 group-hover:text-[#FF3D00] transition-colors">New Industry Partnership with Tech Corp</h4>
                                        <p className="text-xs text-slate-600 line-clamp-2 mb-3 flex-grow">MoU signed for internship programs and specialized training modules.</p>
                                        <a className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF3D00] hover:text-[#001E2B] transition-colors" href="#">
                                            Read More <span className="material-symbols-outlined text-[10px]">arrow_forward_ios</span>
                                        </a>
                                    </div>
                                    <div className="group border border-slate-100 p-4 rounded-xl hover:bg-slate-50 transition-all hover:border-[#FF3D00]/20 flex flex-col bg-slate-50/30">
                                        <p className="text-[10px] text-[#FF3D00] font-bold uppercase tracking-wider mb-1">Oct 18, 2023</p>
                                        <h4 className="text-sm font-bold text-[#001E2B] leading-snug mb-1 group-hover:text-[#FF3D00] transition-colors">Alumni Sports Meet Registration Open</h4>
                                        <p className="text-xs text-slate-600 line-clamp-2 mb-3 flex-grow">Join the annual football and cricket tournament at the campus grounds.</p>
                                        <a className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF3D00] hover:text-[#001E2B] transition-colors" href="#">
                                            Read More <span className="material-symbols-outlined text-[10px]">arrow_forward_ios</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Coordinator_Dashboard;
