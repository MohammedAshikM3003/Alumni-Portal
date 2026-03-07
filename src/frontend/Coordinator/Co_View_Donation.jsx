    import { Link } from 'react-router-dom';
import styles from './Co_View_Donation.module.css';
import Sidebar from './Components/Sidebar/Sidebar';

const CoordinatorViewDonation = ( { onLogout } ) => {
    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar currentView="donation_history" onLogout={onLogout} />
            {/* Main Content Area */}
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                {/* Header & Banner */}
                <header className="sticky top-0 z-10 shrink-0">
                    <div className="bg-red-50 border-b border-red-100 px-6 py-3 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                            <span>Recent: Suresh Kumar just donated ₹500 to the Alumni Fund!</span>
                        </div>
                    </div>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <h1 className={`${styles.collegeName} hidden md:block`}>K.S.R College of Engineering</h1>
                        </div>
                    </div>
                </header>

                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} p-8 bg-[#F8FAFC]`}>
                    <div className="max-w-8xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">Donation Transaction Details</h2>
                            <Link className="bg-[#FF3D00] hover:bg-red-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-sm shadow-red-500/10" to="/coordinator/donation_history">
                                <span className="material-symbols-outlined text-lg">arrow_back</span>
                                Back to List
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                            <div className="h-2 bg-[#FF3D00] w-full"></div>
                            <div className="p-8 md:p-12">
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-1">Transaction Receipt</h3>
                                        <p className="text-sm text-slate-500">Official record for your donation contribution</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Successful</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Donor Name</label>
                                        <p className="text-base font-bold text-slate-900">Priya Varma</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cause</label>
                                        <p className="text-base font-bold text-slate-900">Alumni Scholarship Fund</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Payment Type</label>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-blue-500 text-xl">account_balance_wallet</span>
                                            <p className="text-base font-bold text-slate-900">UPI</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Transaction ID</label>
                                        <p className="text-base font-bold text-slate-900 font-mono">#TRXN-98234102</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Amount</label>
                                        <p className="text-3xl font-bold text-slate-900">₹250.00</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Transaction Date</label>
                                        <p className="text-base font-bold text-slate-900">Oct 24, 2023</p>
                                    </div>
                                </div>

                                <div className="my-10 border-t border-dashed border-slate-200"></div>

                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-[#FF3D00]">
                                            <span className="material-symbols-outlined">verified</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 leading-relaxed">This is a system-generated document. <br />K.S.R College of Engineering Alumni Portal.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                                            <span className="material-symbols-outlined">print</span>
                                        </button>
                                        <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                                            <span className="material-symbols-outlined">share</span>
                                        </button>
                                        <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                                            <span className="material-symbols-outlined">download</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoordinatorViewDonation;
