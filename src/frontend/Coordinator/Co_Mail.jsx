import { Link } from 'react-router-dom';
import styles from './Co_Mail.module.css';
import ksrLogo from '../../assets/KSR_College_Logo.svg';
import Sidebar from './Components/Sidebar/Sidebar';

const CoordinatorMail = ( { onLogout } ) => {
    const mailHistory = [
        { sender: "Admin Office", type: "Update", message: "System-wide update regarding the new alumni membership tiers and benefits for 2025.", time: "10:45 AM", btnClass: styles.btnViewGreyOutline },
        { sender: "Alumni Office", type: "", message: "Invitation: Virtual Networking Session for Technology Professionals scheduled for next Friday. Register via the link.", time: "09:12 AM", btnClass: styles.btnViewGreenOutline },
        { sender: "Admin Portal", type: "", message: "Your profile verification has been completed successfully. Welcome to the official KSRCE network.", time: "Oct 24", btnClass: styles.btnViewRedOutline },
        { sender: "Placement Cell", type: "", message: "New Internship guidelines for alumni-led startups are now available for download.", time: "Oct 20", btnClass: styles.btnViewGreyOutline },
        { sender: "Career Cell", type: "", message: "Exciting news! We have three new SDE-1 openings at top product firms specifically looking for our alumni.", time: "Oct 18", btnClass: styles.btnViewGreenOutline },
        { sender: "Events Team", type: "", message: "Early bird registration for Grand Reunion 2024 is now open. Book your tickets before Nov 1st.", time: "Oct 15", btnClass: styles.btnViewRedOutline },
        { sender: "Scholarship Board", type: "", message: "Applications for the Merit Scholarship 2025 are now being accepted. Refer potential candidates.", time: "Oct 12", btnClass: styles.btnViewGreyOutline },
        { sender: "Library Admin", type: "", message: "Alumni access to digital library archives has been extended for another year.", time: "Oct 10", btnClass: styles.btnViewGreenOutline },
        { sender: "Tech Support", type: "", message: "Maintenance notice: The alumni portal will be undergoing scheduled updates this Sunday.", time: "Oct 05", btnClass: styles.btnViewRedOutline },
        { sender: "Alumni Survey", type: "", message: "Help us improve! Please fill out the 5-minute career growth survey.", time: "Sep 28", btnClass: styles.btnViewGreyOutline },
        { sender: "Sports Dept", type: "", message: "Invitation: Annual Alumni vs Students Cricket Match this Sunday at the Main Ground.", time: "Sep 25", btnClass: styles.btnViewGreenOutline },
        { sender: "Chapter Meet", type: "", message: "The Bangalore Chapter is hosting a dinner meet at Indiranagar this Friday. RSVP now.", time: "Sep 20", btnClass: styles.btnViewRedOutline },
        { sender: "Health & Wellness", type: "", message: "Join the Alumni Yoga Retreat this weekend. Limited spots available.", time: "Sep 15", btnClass: styles.btnViewGreyOutline },
        { sender: "Career Mentorship", type: "", message: "Final call for mentor applications for the 2024-25 academic year mentoring program.", time: "Sep 10", btnClass: styles.btnViewGreenOutline },
        { sender: "Notice Board", type: "", message: "Archive updates: Old graduation photos are being digitized for the portal gallery.", time: "Sep 05", btnClass: styles.btnViewRedOutline },
    ];

    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar currentView="mail" onLogout={onLogout} />
            {/* Main Content Area */}
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1 className={`${styles.collegeName} hidden md:block`}>K.S.R College of Engineering</h1>
                    </div>
                    <div className="flex items-center gap-6">
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

                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable}`}>
                    <div className="w-full p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-[#001E2B]">Mail History</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative hidden sm:block">
                                    <input className="w-72 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3D00] focus:border-transparent" placeholder="Search mail..." type="text" />
                                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
                                </div>
                                <button className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-[#FF3D00] hover:border-[#FF3D00] rounded-lg transition-all">
                                    <span className="material-symbols-outlined">refresh</span>
                                </button>
                            </div>
                        </div>

                        <div className={`${styles.mailGrid} pb-12`}>
                            {mailHistory.map((mail, index) => (
                                <div key={index} className={styles.mailCard}>
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="font-bold text-[#001E2B] text-lg">{mail.sender}</span>
                                            {mail.type && (
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-full uppercase">{mail.type}</span>
                                            )}
                                        </div>
                                        <p className="text-slate-600 text-base line-clamp-3 leading-relaxed">{mail.message}</p>
                                    </div>
                                    <div className="mt-auto flex flex-col items-center gap-3">
                                        <span className="text-xs font-bold text-slate-400">{mail.time}</span>
                                        <Link to="/coordinator/info-form" className={`${styles.btnView} ${mail.btnClass}`}>View</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoordinatorMail;
