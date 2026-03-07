import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Co_Feedback.module.css';
import ksrLogo from '../../assets/KSR_College_Logo.svg';
import Sidebar from './Components/Sidebar/Sidebar';

const CoordinatorFeedbackHistory = ( { onLogout } ) => {
    const feedbackData = [
        { id: 1, name: "Arjun Mehta", content: '"The KSRCE portal has been instrumental in keeping our batch connected. The networking events organized through the platform are truly world-class."', date: "Oct 24" },
        { id: 2, name: "Sana Williams", content: '"I am thoroughly impressed by the mentorship initiatives. Giving back to my juniors at KSRCE has been a fulfilling experience facilitated by this portal."', date: "Oct 22" },
        { id: 3, name: "David Chen", content: '"The job board and reference system provided here are exceptional. It\'s a professional ecosystem that adds immense value to our alumni community."', date: "Oct 15" },
        { id: 4, name: "Priya Sharma", content: '"Attending the recent campus reunion reminded me of the strong foundation KSRCE provided. The portal made registration and coordination seamless."', date: "Oct 12" },
        { id: 5, name: "Michael Tan", content: '"The technical workshops hosted via the alumni portal are top-tier. It\'s great to see a commitment to lifelong learning within our network."', date: "Oct 10" },
        { id: 6, name: "Anjali Rao", content: '"The new infrastructure updates shared through the portal are amazing. Proud to be an alumnus of an institution that never stops evolving."', date: "Oct 05" },
        { id: 7, name: "Robert Brown", content: '"Efficient, professional, and engaging. This portal is the gold standard for how alumni relations should be managed in the modern era."', date: "Sep 28" },
        { id: 8, name: "Emily White", content: '"The scholarship donation process is transparent and easy to navigate. It\'s heartening to see our contributions making a real difference."', date: "Sep 25" },
        { id: 9, name: "Rajesh Kumar", content: '"From sports meets to industry seminars, the variety of engagement is fantastic. KSRCE truly knows how to value its alumni."', date: "Sep 20" },
    ];

    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar currentView="feedback" onLogout={onLogout} />
            {/* Main Content Area */}
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

                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} p-10 bg-[#F8FAFC]`}>
                    <header className="mb-8">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Alumni Feedback</h2>
                        <div className="h-1 w-20 mt-2 rounded-full bg-[#FF3D00]"></div>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {feedbackData.map((feedback) => (
                            <div key={feedback.id} className="bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-6 flex-1">
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{feedback.name}</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">{feedback.content}</p>
                                </div>
                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{feedback.date}</span>
                                    <Link className="text-xs font-bold uppercase tracking-widest flex items-center gap-1 text-[#FF3D00] hover:text-[#E63600]" to="/coordinator/view_feedback">
                                        View <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoordinatorFeedbackHistory;
