import { Link } from 'react-router-dom';
import styles from './Co_Donation_History.module.css';
import ksrLogo from '../../assets/KSR_College_Logo.svg';
import Sidebar from './Components/Sidebar/Sidebar';
import { DateInput } from '../../components/Calendar';

const CoordinatorDonationHistory = ( { onLogout } ) => {
    const donationData = [
        { id: 1, name: "Priya Varma", initials: "PV", details: "Class of 2018 - CSE", amount: "₹250.00", date: "Oct 24, 2023", type: "UPI" },
        { id: 2, name: "Rahul Krishnan", initials: "RK", details: "Class of 2015 - MECH", amount: "₹1,200.00", date: "Oct 22, 2023", type: "Net Banking" },
        { id: 3, name: "Ananya Singh", initials: "AS", details: "Class of 2020 - ECE", amount: "₹5,000.00", date: "Oct 20, 2023", type: "Credit Card" },
        { id: 4, name: "James Michael", initials: "JM", details: "Class of 2012 - CIVIL", amount: "₹750.00", date: "Oct 18, 2023", type: "Debit Card" },
        { id: 5, name: "Suresh Kumar", initials: "SK", details: "Class of 2022 - IT", amount: "₹500.00", date: "Oct 15, 2023", type: "UPI" }
    ];

    const getTypeStyle = (type) => {
        switch (type) {
            case 'UPI': return styles.typeUpi;
            case 'Net Banking': return styles.typeNetBanking;
            case 'Credit Card': return styles.typeCreditCard;
            case 'Debit Card': return styles.typeDebitCard;
            default: return styles.typeUpi;
        }
    };

    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar onLogout={onLogout} currentView="donation_history" />
            {/* Main Content Area */}
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                {/* Fixed Banner & Header */}
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
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">Alumni Donations Tracking</h2>
                            <button className="bg-[#FF3D00] hover:bg-red-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-sm shadow-red-500/10">
                                <span className="material-symbols-outlined text-lg">file_download</span>
                                Export Report
                            </button>
                        </div>

                        {/* Search & Filter */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 mb-6">
                            <div className="flex-1 min-w-[300px]">
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-[#FF3D00]/20 text-sm"
                                        placeholder="Search by donor name, batch or department..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <DateInput
                                    theme="coordinator"
                                    className="bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-[#FF3D00]/20 text-sm px-4 py-2"
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-200">
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">S.NO</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Donor Name</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Batch/Class</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Type</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {donationData.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-slate-500">{item.id}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-xs">
                                                            {item.initials}
                                                        </div>
                                                        <span className="font-medium text-slate-900">{item.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{item.details}</td>
                                                <td className="px-6 py-4 font-bold text-[#FF3D00]">{item.amount}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{item.date}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`${styles.typePill} ${getTypeStyle(item.type)}`}>
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link className="text-slate-400 hover:text-[#FF3D00] transition-colors p-1" to="/coordinator/View_donation">
                                                        <span className="material-symbols-outlined">visibility</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-white">
                                <p className="text-sm text-slate-500">Showing 1 to 5 of 128 entries</p>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">Previous</button>
                                    <button className="px-4 py-2 bg-[#FF3D00] text-white rounded-lg text-sm font-semibold">1</button>
                                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">2</button>
                                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Next</button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoordinatorDonationHistory;
