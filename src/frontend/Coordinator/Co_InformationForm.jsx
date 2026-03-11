import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Co_InformationForm.module.css';
import ksrLogo from '../../assets/KSR_College_Logo.svg';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from './Components/BackButton/Back';
import { DateInput } from '../../components/Calendar';


const CoordinatorInformationForm = ( { onLogout } ) => {
    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar currentView="mail" onLogout={onLogout} />
            {/* Main Content Area */}
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                {/* Header */}
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

                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} p-8 pb-20`}>
                <Back to={'/coordinator/mail'} />
                    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-8 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="text-[#FF3D00]">
                                <span className="material-symbols-outlined">notifications</span>
                            </div>
                            <div>
                                <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-[#FF3D00] text-white rounded uppercase mr-2">Update</span>
                                <span className="text-sm font-bold text-slate-700">From: Alumni Office</span>
                                <span className="mx-2 text-slate-300">|</span>
                                <span className="text-sm text-slate-500 italic">Invitation: Virtual Networking Session</span>
                            </div>
                        </div>
                        <button className="text-slate-400"><span className="material-symbols-outlined">expand_more</span></button>
                    </div>

                    <div className="w-full space-y-8">
                        {/* Registration Status */}
                        <section className={styles.formCard}>
                            <h2 className={styles.formSectionTitle}>Registration Status</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-3">Already a Member</label>
                                    <div className="flex items-center gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input className="w-4 h-4 text-[#FF3D00] border-slate-300 focus:ring-[#FF3D00]" name="member" type="radio" />
                                            <span className="text-sm text-slate-700">Yes</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input className="w-4 h-4 text-[#FF3D00] border-slate-300 focus:ring-[#FF3D00]" name="member" type="radio" />
                                            <span className="text-sm text-slate-700">No</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">New Registration</label>
                                    <input className={styles.inputField} type="text" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2">Alumni Registration Number</label>
                                    <input className={styles.inputField} type="text" />
                                </div>
                            </div>
                        </section>

                        {/* Personal Details */}
                        <section className={styles.formCard}>
                            <h2 className={styles.formSectionTitle}>Section 1: Personal Details</h2>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">Full Name</label>
                                        <input className={styles.inputField} placeholder="e.g. Alexander Pierce" type="text" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">Father/Guardian Name</label>
                                        <input className={styles.inputField} placeholder="e.g. Robert Pierce" type="text" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">Date of Birth</label>
                                        <DateInput theme="coordinator" className={styles.inputField} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">Years of Study (From)</label>
                                        <select className={styles.selectField}>
                                            <option>Select Year</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">(To)</label>
                                        <select className={styles.selectField}>
                                            <option>Select Year</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">Course / Branch</label>
                                        <input className={styles.inputField} placeholder="e.g. B.E Computer Science and Engineering" type="text" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">Nick name (optional)</label>
                                        <input className={styles.inputField} placeholder="e.g. Alex" type="text" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    <div className={styles.addressBox}>
                                        <div className="flex items-center gap-2 mb-4 text-slate-700">
                                            <span className="material-symbols-outlined text-lg text-[#FF3D00]">location_on</span>
                                            <span className="text-sm font-bold">Present Address</span>
                                        </div>
                                        <div className="space-y-4">
                                            <input className={styles.inputField} placeholder="Street Address" type="text" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <input className={styles.inputField} placeholder="City" type="text" />
                                                <input className={styles.inputField} placeholder="PIN Code" type="text" />
                                            </div>
                                            <input className={styles.inputField} placeholder="Mobile Number" type="text" />
                                            <input className={styles.inputField} placeholder="Email Address" type="email" />
                                        </div>
                                    </div>
                                    <div className={styles.addressBox}>
                                        <div className="flex items-center gap-2 mb-4 text-slate-700">
                                            <span className="material-symbols-outlined text-lg text-[#FF3D00]">home</span>
                                            <span className="text-sm font-bold">Permanent Address</span>
                                        </div>
                                        <div className="space-y-4">
                                            <input className={styles.inputField} placeholder="Street Address" type="text" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <input className={styles.inputField} placeholder="City" type="text" />
                                                <input className={styles.inputField} placeholder="PIN Code" type="text" />
                                            </div>
                                            <input className={styles.inputField} placeholder="Mobile Number" type="text" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Qualifications & Employment */}
                        <section className={styles.formCard}>
                            <h2 className={styles.formSectionTitle}>Section 2: Qualifications & Employment</h2>
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-3">Competitive Exams Cleared</label>
                                    <div className="flex items-center gap-6 mb-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input className="w-4 h-4 text-[#FF3D00] border-slate-300 focus:ring-[#FF3D00]" name="exam_cleared" type="radio" />
                                            <span className="text-sm text-slate-700">Yes</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input className="w-4 h-4 text-[#FF3D00] border-slate-300 focus:ring-[#FF3D00]" name="exam_cleared" type="radio" />
                                            <span className="text-sm text-slate-700">No</span>
                                        </label>
                                    </div>
                                    <div className="space-y-4 mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Exams and Marks/Score</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
                                            {['GRE', 'TOEFL', 'UPSC', 'GATE', 'IAS', 'Others'].map(exam => (
                                                <div key={exam} className="flex items-center gap-3">
                                                    <span className="text-sm text-slate-700 min-w-[60px]">{exam}</span>
                                                    <input className="h-8 w-24 border-slate-200 rounded text-xs px-2 focus:ring-1 focus:ring-[#FF3D00] focus:border-[#FF3D00]" placeholder="Marks" type="text" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-3">College Qualifications</label>
                                    <div className={styles.tableContainer}>
                                        <table className="w-full text-left text-sm">
                                            <thead className={styles.tableHeader}>
                                                <tr>
                                                    <th className="p-3 font-semibold text-slate-700">Course</th>
                                                    <th className="p-3 font-semibold text-slate-700">Institution</th>
                                                    <th className="p-3 font-semibold text-slate-700">Year of Passing</th>
                                                    <th className="p-3 font-semibold text-slate-700">% of Marks</th>
                                                    <th className="p-3 font-semibold text-slate-700">Board / University</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                <tr>
                                                    <td className="p-3"><input className="w-full bg-transparent border-none text-slate-500 text-sm focus:ring-0" type="text" defaultValue="e.g. B.E" /></td>
                                                    <td className="p-3"><input className="w-full bg-transparent border-none text-slate-500 text-sm focus:ring-0" type="text" defaultValue="KSRCE" /></td>
                                                    <td className="p-3"><input className="w-full bg-transparent border-none text-slate-500 text-sm focus:ring-0" type="text" defaultValue="2018" /></td>
                                                    <td className="p-3"><input className="w-full bg-transparent border-none text-slate-500 text-sm focus:ring-0" type="text" defaultValue="85%" /></td>
                                                    <td className="p-3"><input className="w-full bg-transparent border-none text-slate-500 text-sm focus:ring-0" type="text" defaultValue="Anna University" /></td>
                                                </tr>
                                                <tr>
                                                    <td className="p-3"><input className="w-full bg-transparent border-none text-sm focus:ring-0" placeholder="..." type="text" /></td>
                                                    <td className="p-3"><input className="w-full bg-transparent border-none text-sm focus:ring-0" placeholder="..." type="text" /></td>
                                                    <td className="p-3"><input className="w-full bg-transparent border-none text-sm focus:ring-0" placeholder="..." type="text" /></td>
                                                    <td className="p-3"><input className="w-full bg-transparent border-none text-sm focus:ring-0" placeholder="..." type="text" /></td>
                                                    <td className="p-3"><input className="w-full bg-transparent border-none text-sm focus:ring-0" placeholder="..." type="text" /></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">Employment Details</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-3 uppercase">Placement Type</label>
                                            <div className="flex flex-wrap items-center gap-4">
                                                {['On-campus', 'Off-campus', 'Others', 'To be employed'].map(type => (
                                                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                                                        <input className="w-4 h-4 text-[#FF3D00] border-slate-300 focus:ring-[#FF3D00]" name="placement" type="radio" />
                                                        <span className="text-sm text-slate-700">{type}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Designation</label>
                                            <input className={styles.inputField} placeholder="e.g. Software Engineer" type="text" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Company Address</label>
                                            <textarea className={styles.textArea} placeholder="Organization name and full address..." rows="3"></textarea>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Remarks</label>
                                            <textarea className={styles.textArea} placeholder="Any specific remarks about employment..." rows="3"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Additional Info */}
                        <section className={styles.formCard}>
                            <h2 className={styles.formSectionTitle}>Section 3: Additional Info</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-3">Have you become an entrepreneur?</label>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input className="w-4 h-4 text-[#FF3D00] border-slate-300 focus:ring-[#FF3D00]" name="entrepreneur" type="radio" />
                                                <span className="text-sm text-slate-700">Yes</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input className="w-4 h-4 text-[#FF3D00] border-slate-300 focus:ring-[#FF3D00]" name="entrepreneur" type="radio" />
                                                <span className="text-sm text-slate-700">No</span>
                                            </label>
                                        </div>
                                    </div>
                                    <input className={styles.inputField} placeholder="Name and Address of Organization" type="text" />
                                    <input className={styles.inputField} placeholder="Nature of work / Product" type="text" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input className={styles.inputField} placeholder="Annual Turnover" type="text" />
                                        <input className={styles.inputField} placeholder="No. of Employees" type="text" />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-3">Marital Status</label>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input className="w-4 h-4 text-[#FF3D00] border-slate-300 focus:ring-[#FF3D00]" name="marital" type="radio" />
                                                <span className="text-sm text-slate-700">Single</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input className="w-4 h-4 text-[#FF3D00] border-slate-300 focus:ring-[#FF3D00]" name="marital" type="radio" />
                                                <span className="text-sm text-slate-700">Married</span>
                                            </label>
                                        </div>
                                    </div>
                                    <input className={styles.inputField} placeholder="Spouse Name" type="text" />
                                    <input className={styles.inputField} placeholder="Spouse Qualification" type="text" />
                                    <input className={styles.inputField} placeholder="No. of Children" type="text" />
                                </div>
                            </div>
                            <div className="mt-10">
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Extra-Curricular Activities</label>
                                <textarea className={styles.textArea} placeholder="List your activities and achievements during or after college..." rows="4"></textarea>
                            </div>
                            <div className="mt-10">
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Any Other Relevant Information</label>
                                <textarea className={styles.textArea} placeholder="Provide any additional details you would like to share..." rows="4"></textarea>
                            </div>
                        </section>

                        <div className="flex justify-center pt-8">
                            <button className={styles.submitBtn} type="submit">
                                Submit Information
                                <span className="material-symbols-outlined text-xl">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoordinatorInformationForm;
