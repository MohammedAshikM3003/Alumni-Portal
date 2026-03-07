import styles from './Co_View_Invitation.module.css';
import Back from './Components/BackButton/Back';
import Sidebar from './Components/Sidebar/Sidebar';


const CoordinatorViewInvitation = ( { onLogout } ) => {
    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden font-sans">
            {/* Sidebar */}
            <Sidebar currentView="invitations" onLogout={onLogout} />
            {/* Main Content Area */}
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1 className={`${styles.collegeName} hidden md:block`}>K.S.R College of Engineering</h1>
                    </div>
                </header>

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
                                <h2 className="text-4xl font-bold leading-tight mb-4 tracking-tight uppercase">40th<br />Anniversary<br />Alumni Gala</h2>
                                <div className="w-16 h-1 bg-white/50 mx-auto rounded-full mb-8"></div>
                                <p className="text-xl font-medium opacity-90">Dec 15, 2024</p>
                                <p className="text-lg opacity-75 font-light">Grand Ballroom</p>
                            </div>
                            <div className="relative z-10 mt-auto">
                                <span className="text-sm font-bold tracking-[0.2em] opacity-60 uppercase">Since 1984</span>
                            </div>
                        </div>

                        <div className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-100 p-12 flex flex-col justify-between">
                            <div>
                                <span className="inline-block px-4 py-1.5 bg-[#FF3D00]/10 text-[#FF3D00] text-xs font-bold tracking-wider uppercase rounded-full mb-6">UPCOMING EVENT</span>
                                <h1 className="text-4xl font-extrabold text-slate-900 mb-10">KSRCE 40th Anniversary Alumni Gala</h1>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                                    <div className="flex items-center space-x-4 group">
                                        <div className="w-12 h-12 rounded-2xl bg-[#FF3D00]/10 flex items-center justify-center text-[#FF3D00] transition-transform group-hover:scale-110 shrink-0">
                                            <span className="material-symbols-outlined">calendar_today</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                                            <p className="font-semibold text-slate-800">Dec 15, 2024</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 group">
                                        <div className="w-12 h-12 rounded-2xl bg-[#FF3D00]/10 flex items-center justify-center text-[#FF3D00] transition-transform group-hover:scale-110 shrink-0">
                                            <span className="material-symbols-outlined">schedule</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</p>
                                            <p className="font-semibold text-slate-800">8:00 PM onwards</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 group">
                                        <div className="w-12 h-12 rounded-2xl bg-[#FF3D00]/10 flex items-center justify-center text-[#FF3D00] transition-transform group-hover:scale-110 shrink-0">
                                            <span className="material-symbols-outlined">location_on</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
                                            <p className="font-semibold text-slate-800">Grand Ballroom</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-slate-900">About the Event</h3>
                                    <p className="italic text-slate-600 text-lg leading-relaxed">
                                        "A Night of Nostalgia & Networking. Join us for a special evening as we celebrate 40 years of academic excellence and alumni success."
                                    </p>
                                    <p className="text-slate-600 leading-relaxed">
                                        Gather with fellow graduates from across the decades to reminisce about your time at KSRCE. This landmark event features a keynote address from our distinguished founding members, a formal sit-down dinner, and plenty of opportunities to reconnect with old friends and expand your professional network.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 pt-10 mt-10 border-t border-slate-100">
                                <div className="flex items-center text-slate-700">
                                    <span className="material-symbols-outlined text-[#FF3D00] mr-3 text-xl">check_circle</span>
                                    <span className="font-medium">Gala Dinner & Cocktail Reception</span>
                                </div>
                                <div className="flex items-center text-slate-700">
                                    <span className="material-symbols-outlined text-[#FF3D00] mr-3 text-xl">check_circle</span>
                                    <span className="font-medium">Distinguished Alumni Awards</span>
                                </div>
                                <div className="flex items-center text-slate-700">
                                    <span className="material-symbols-outlined text-[#FF3D00] mr-3 text-xl">check_circle</span>
                                    <span className="font-medium">Live Jazz Performance</span>
                                </div>
                                <div className="flex items-center text-slate-700">
                                    <span className="material-symbols-outlined text-[#FF3D00] mr-3 text-xl">check_circle</span>
                                    <span className="font-medium">Networking Lounge Access</span>
                                </div>
                            </div>
                            <div className="mt-12 flex flex-col sm:flex-row gap-4">
                                <button className="flex-1 bg-[#FF3D00] hover:bg-[#E63700] text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1">
                                    Register for Event
                                </button>
                                <button className="px-8 py-4 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all">
                                    Invite Peers
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoordinatorViewInvitation;
