import { Link } from 'react-router-dom';
import styles from './Co_Profile.module.css';
import ksrLogo from '../../assets/KSR_College_Logo.svg';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from './Components/BackButton/Back';

const CoordinatorProfile = ( { onLogout } ) => {
    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar currentView="profile" onLogout={onLogout} />
            {/* Main Content Area */}
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} p-10 bg-[#F8FAFC]`}>
                    <Back to={'/coordinator/dashboard'} />
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
