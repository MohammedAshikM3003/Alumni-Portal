import { Link } from 'react-router-dom';
import styles from './Co_Profile.module.css';
import ksrLogo from '../../assets/KSR_College_Logo.svg';
import Sidebar from './Components/Sidebar/Sidebar';

const CoordinatorProfile = ( { onLogout } ) => {
    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar currentView="profile" onLogout={onLogout} />
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
                    <div className="w-full">
                        <div className="mb-10">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Coordinator Profile</h2>
                            <p className="text-slate-500 mt-2">Manage your personal and institutional information</p>
                        </div>

                        {/* Profile cards arranged in a row on larger screens */}
                        <div className="flex flex-col lg:flex-row items-stretch gap-8">
                            {/* Contact Info Section */}
                            <div className="w-full lg:w-1/2 flex flex-col">
                                <div className={`${styles.card} flex-1 flex flex-col`}>
                                    <div className={styles.cardHeader}>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#FF3D00]">contact_page</span>
                                            <h3 className="text-lg font-bold text-slate-900">Contact Information</h3>
                                        </div>
                                        <button className={styles.btnPrimary}>Edit Profile</button>
                                    </div>
                                    <div className="p-0">
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Name</span>
                                            </div>
                                            <div className="w-2/3">
                                                <span className="text-sm font-semibold text-slate-900">Mohammed Ashik M</span>
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Designation</span>
                                            </div>
                                            <div className="w-2/3">
                                                <span className="text-sm font-semibold text-slate-900">Coordinator</span>
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Personal Email</span>
                                            </div>
                                            <div className="w-2/3">
                                                <span className="text-sm font-semibold text-slate-900">ashik@example.com</span>
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Domain Email</span>
                                            </div>
                                            <div className="w-2/3">
                                                <span className="text-sm font-semibold text-slate-900">m.ashik@ksrce.ac.in</span>
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Branch</span>
                                            </div>
                                            <div className="w-2/3">
                                                <span className="text-sm font-semibold text-slate-900">Computer Science</span>
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Mobile No</span>
                                            </div>
                                            <div className="w-2/3">
                                                <span className="text-sm font-semibold text-slate-900">+91 98765 43210</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-end gap-3">
                                    <button className={styles.btnSecondary}>Discard</button>
                                    <button className={styles.btnPrimary}>Save</button>
                                </div>
                            </div>

                            {/* Administrative Info Section */}
                            <div className="w-full lg:w-1/2 flex flex-col">
                                <div className={`${styles.card} flex-1 flex flex-col`}>
                                    <div className={styles.cardHeader}>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#FF3D00]">admin_panel_settings</span>
                                            <h3 className="text-lg font-bold text-slate-900">Administrative Info</h3>
                                        </div>
                                    </div>
                                    <div className="p-0">
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Cabin No</span>
                                            </div>
                                            <div className="w-2/3">
                                                <span className="text-sm font-semibold text-slate-900">C-204</span>
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Staff ID</span>
                                            </div>
                                            <div className="w-2/3">
                                                <span className="text-sm font-semibold text-slate-900">KSRCE-882</span>
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Department</span>
                                            </div>
                                            <div className="w-2/3">
                                                <span className="text-sm font-semibold text-slate-900">CSE</span>
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Role</span>
                                            </div>
                                            <div className="w-2/3">
                                                <span className="text-sm font-semibold text-slate-900">Alumni Coordinator</span>
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Joining Date</span>
                                            </div>
                                            <div className="w-2/3">
                                                <span className="text-sm font-semibold text-slate-900">12 Aug 2018</span>
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Status</span>
                                            </div>
                                            <div className="w-2/3">
                                                <span className="text-sm font-bold text-emerald-600">Active</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-end gap-3">
                                    <button className={styles.btnSecondary}>Discard</button>
                                    <button className={styles.btnPrimary}>Save</button>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoordinatorProfile;
