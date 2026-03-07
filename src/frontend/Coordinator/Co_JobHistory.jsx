import { Link } from 'react-router-dom';
import styles from './Co_JobHistory.module.css';
import ksrLogo from '../../assets/KSR_College_Logo.svg';
import Sidebar from './Components/Sidebar/Sidebar';

const CoordinatorJobHistory = ( { onLogout } ) => {
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

                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} p-6 bg-[#F8FAFC]`}>
                    <header className="bg-white border-b border-slate-200 p-3 flex items-center mb-6 rounded-xl shadow-sm">
                        <div className="flex items-center gap-4 w-full">
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

                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                                <span className="material-symbols-outlined text-[#FF3D00]">trending_up</span>
                                Job Referral Management
                            </h2>
                            <p className="text-slate-500 text-sm mt-0.5">Review and manage active job referral requests from alumni.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {[
                            { name: "Shamyuktha", company: "Microsoft", role: "Software Engineer", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDmsqR3HXO6JYmKoYRnbL0z_-N19i0SLsqqLWVMJTPAWyAVA5-RBlVjD4KNrRrh2avFj5OhxDg8t-EJ6tEhVfrlh3h8QaIh8EQNXyKotGOzrWG6sgXpAKt2pgedyXZj5kKSfAV-BSjX16ej8bXTT6qDgj5myVEf95H9feXH2toHh5Uqj_s_pvaNPmPR6Ql34XDQnleCD62orxYWzp_CpPrTjdS4kFsmxQgq6yVwlM0oP0S9n_fKmSFz157YvsNW-f6Mzadkzcq1rj_-" },
                            { name: "Pragathi", company: "Amazon", role: "Data Scientist", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbTHEOcjA4kmfcxnM7FPli3WRg0OkV-mjGV57f0llYA17ptT60dayzh_O3HuhGpptQdBCbxTu3PprmPogork7r2JvpPwyC-qSLxnekgDWhk6kf5ZsJIEAGQBMJmekkRcZKvJGHDnjA5h5t8PKdMN1oYKY6zAt2a5zB3tQ7VDKQLPAZdwpRq7srbiFC6ON9M-HJW2z0J4qT9PwlyBWQR_Se799fx9BSqaOzVqBZPaHxHsHyr9gw_775BPjVnhLmMDafeagiSlQnpeEy" },
                            { name: "Miruthula", company: "Meta", role: "Product Manager", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0vyD6puiSqCRFZBlGbMYJ8tPVHFzZdcSOYrEIGo_1QISGQ4UPKw9gMXJvPnQpE8GEhKxhcbpcFQ3HI1HPpXNaM7r5WUa3yZvrQnvCTogBTCx06a9e9WrEPrO-eNUuIFj2zvSxY6LrDDTdZDtzp5AMuvhP-Sglc5S4m1x4ZHbVjpL6afnykpN8q9msniyqAMqo788V0oK2T8TvxT6dKmeWnEHYAV1bcf_sKF_UETCJLFWwytMp7JtOebYKZDvPmmM6_fp3L2Dj0ykl" },
                            { name: "Yazhini", company: "Nvidia", role: "AI Engineer", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAKkDH5bifjpBSFjwFZoD1JPF25n6tp42HSQB_KLKe_cAtjWd1okBEVhjQe1oiqXaSjxlam2No9Xo2-hbYQPgsd2HWfby8EN-1zKlaxty19S1JX2vZIUkadNLjmJvRCay6yXVY50b79IUMl6-SoOAtQ1wk0UX5M_EOrt9QuNDAcvzfpHRML8uUYkX1YXAgvMs8zZeyDYahEOmU_458WapVL5n9Y7LvtE1C7uwtofWFTVEiAaTdn6r4hf4o9PjdDZN9fS6bPUVAmHDIM" },
                            { name: "Vikram Singh", company: "Zoho", role: "Lead Developer", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDXEHISXxpd5updw0RT7WegkKxK86perOliKO5QPxFOpTE3GNZhDuUkTjwUFbj5ijM6SxBkruPo3iOs7RRTSX8OsknllLcZtpIH4C54ChtPr6a313F8zNDizd0g-Q1DtMWsujdNVXtqjmBAicNz_GBQtd8wHjolSvGmsZOktNVc2EeoCNUayMpnhZKbTjTU0coe-P9u8wBYZaXfaFAGZmNZcmSmDklV0-b3UMSYV7QUCBmrYC5TVf7Je7EjjAsT6iyKC89q_Prhtd5F" },
                            { name: "Ananya Iyer", company: "Stripe", role: "UX Architect", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCeeFRUULlDWeCJCTtEVk1ROH3XmIzhNTcrqzWIWm1LT3aMMNeFv772Mz451vuCzzAuL4NBlLrrZfRVxATK-9AIv32Wj-_DJX1yT0KUPqFGPVyQlPhc4bHToucmqejKo7mMts5oIrs-amrRPPeJvfEq2VzXTXN7rfsXPzB7RsjFERI_nzCpmF6VAzO1RAV-0FfXPQmcJ3SateWSvqtnkhQsftNooe9RpwC2zRd_UkzA0-KP2rLsGXpY_yr1OlpYLZN-ttRz-57OUhrS" },
                            { name: "Keerthi", company: "GOOGLE", role: "Product Designer", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAuyi4Q6S0CGdla3qD8nr2pr4SeZ5AywjiqNKsQ0oHYDIJgUhmlns3FCYEg-FePzrXqVjoAFaNzCNfc4bp-5g3aK4OL9uQBkMTTgTXCNRumjUaPMsbhln1waQ2aZaroQM8WIMx3JjUC57Iueh13wwPD3L87i9XZNUw1hgX6tPGwJPOE126ICAMUaD64W6gvs9ORYJXWlrNYow4GPOJxbyvcZ37O4rvSTluNjayuYduFJCTWkt2cFJTnLSria9P7Wu8neP8OZuYtdBdH" },
                            { name: "Ashik", company: "APPLE", role: "iOS Developer", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDbComZf_6Yq4kUIGkog3QrJkoFObLEsxVIsLPxmqFumlJSizAArFBmhuw3s9vcrbSJvU2YsrbsYysOCDccWztkW52URp3DW38W-8UACJC62B3fMp-V2Mgz5zR_D8OGR-oSybB2SReUPGWap3PDAH7gjeoPntYc1dK6tvNcbInstrjAL6eHK6GILSu-yg6gHhUui9xE09NG7IvGRSpD1yjyB2qJUvAm8bkvPZ4WSUNztVCxqYjcgpNp0PBkjDOAIx2Wv4oc26LFwYMU" },
                            { name: "Jeevan", company: "TESLA", role: "Automation Engineer", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHK5wMYUUiz2Uu-6lAAXhdBv-gXwMRB8NvfggzO463Db5DAMAmnXNbTVFNEZwesKy2Z2viqT6X1PTHXQCM1hNE3dW_LNoaUZYazt05lnybUDu4jCmibfiy2UUNALrRuGsFfxXo4_tlfi4Ygy2o3HHzz4cXxFGRRciJPeEyv9wurveylfMpbBYe6noTt_KiHTqF_5cdsztbcb271wF1IciOpq9wxEhQoqpulnR7OsJrqxxn2UvjPYtLI-3Q5CcRw1eG7Wdxidco3Rs5" }
                        ].map((referral, index) => (
                            <div key={index} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col items-center text-center">
                                    <div className="relative">
                                        <img alt={referral.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-50" src={referral.img} />
                                        <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                                    </div>
                                    <h3 className="mt-3 font-bold text-base text-slate-900">{referral.name}</h3>
                                    <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wide">Referrer</p>
                                    <div className="mt-4 w-full space-y-1">
                                        <p className="text-[#FF3D00] font-black text-sm uppercase">{referral.company}</p>
                                        <p className="text-slate-600 font-medium text-xs">{referral.role}</p>
                                    </div>
                                    <Link className="mt-4 w-full bg-[#FF3D00] hover:bg-red-600 text-white py-2.5 rounded-lg font-bold text-xs transition-all transform active:scale-95 shadow-md shadow-red-500/10 text-center flex items-center justify-center" to="/coordinator/View_job_and_reference">
                                        View Details
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

export default CoordinatorJobHistory;
