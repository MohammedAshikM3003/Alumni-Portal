import { Link } from 'react-router-dom';
import styles from './Co_Feedback_Form.module.css';
import ksrLogo from '../../assets/KSR_College_Logo.svg';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from './Components/BackButton/Back';

const CoordinatorFeedbackForm = ( { onLogout } ) => {
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

                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} bg-[#F8FAFC]`}>
                    <Back to={'/coordinator/feedback_history'} />
                    <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-10">
                        {/* Form Header */}
                        <div className="text-center mb-10 border-b border-slate-100 pb-10">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2 uppercase tracking-tight">K.S.R. COLLEGE OF ENGINEERING (Autonomous), TIRUCHENGODE – 637 215</h2>
                            <h3 className="text-lg font-semibold text-slate-700 mb-4 uppercase">DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING</h3>
                            <p className="text-[#FF3D00] font-bold text-lg mb-8">PROGRAM NAME: B.E. Computer Science and Engineering</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Reviewed By:</label>
                                    <input className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-700 focus:ring-[#FF3D00] focus:border-[#FF3D00]" readOnly type="text" value="Vadin Santhiya G" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Date:</label>
                                    <input className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-700 focus:ring-[#FF3D00] focus:border-[#FF3D00]" readOnly type="text" value="24/12/2025" />
                                </div>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Left Column (Reference) */}
                            <div className="space-y-10">
                                <section>
                                    <h4 className={styles.visionTitle}>Vision of the Institution</h4>
                                    <p className="italic text-slate-600 leading-relaxed text-sm">To become a globally prominent institution in engineering and management, offering value-based holistic education that fosters research, innovation and sustainable development.</p>
                                </section>
                                <section>
                                    <h4 className={styles.visionTitle}>Mission of the Institution</h4>
                                    <ul className="space-y-3 text-sm text-slate-600">
                                        <li className="flex items-start">
                                            <span className="font-bold mr-2 text-[#FF3D00]">1.</span>
                                            <span>To impart value-based quality education through modern pedagogy and state-of-the-art infrastructure.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-bold mr-2 text-[#FF3D00]">2.</span>
                                            <span>To enhance learning and managerial skills through cutting-edge laboratories and industry collaboration.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-bold mr-2 text-[#FF3D00]">3.</span>
                                            <span>To promote research and innovation through collaboration, social responsibility and commitment to sustainable development.</span>
                                        </li>
                                    </ul>
                                </section>
                                <section>
                                    <h4 className={styles.visionTitle}>Vision of the Department</h4>
                                    <p className="italic text-slate-600 leading-relaxed text-sm">To produce globally competent learners and innovators in Computer Science and Engineering, committed to ethical values and sustainable development.</p>
                                </section>
                                <section>
                                    <h4 className={styles.visionTitle}>Mission of the Department</h4>
                                    <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                                        <p><span className="font-bold text-[#FF3D00] mr-1">DM1:</span> To provide student-centric education;</p>
                                        <p><span class="font-bold text-[#FF3D00] mr-1">DM2:</span> To impart quality technical education;</p>
                                        <p><span class="font-bold text-[#FF3D00] mr-1">DM3:</span> To meet global industry demand;</p>
                                        <p><span class="font-bold text-[#FF3D00] mr-1">DM4:</span> To promote interdisciplinary innovation.</p>
                                    </div>
                                </section>
                                <section>
                                    <h4 className={styles.visionTitle}>Program Educational Objectives (PEOs)</h4>
                                    <div className="space-y-4 text-sm text-slate-600">
                                        <p><span className="font-bold text-[#FF3D00] mr-1">PEO1:</span> Graduates will integrate engineering fundamentals and computing to devise innovative solutions and effectively resolve complex problems.</p>
                                        <p><span class="font-bold text-[#FF3D00] mr-1">PEO2:</span> Graduates will drive sustainable and ethical solutions by engaging in lifelong learning and adapting to technological advancements.</p>
                                        <p><span class="font-bold text-[#FF3D00] mr-1">PEO3:</span> Graduates will enhance their careers through continuous learning, innovation, and research to meet the evolving needs of the industry.</p>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column (Assessments) */}
                            <div className="space-y-6">
                                {['Vision (IV)', 'Mission (IM)', 'Vision (DV)', 'Mission (DM)', 'PEOs'].map((section, idx) => (
                                    <div key={idx} className={styles.assessmentCard}>
                                        <h5 className="text-base font-bold text-slate-800 mb-4">Section: {section}</h5>
                                        <div className="flex flex-wrap gap-4 mb-5">
                                            {['Needs improvement', 'Satisfied', 'Best'].map((rating) => (
                                                <label key={rating} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`section_${idx}`}
                                                        className="w-5 h-5 text-[#FF3D00] focus:ring-[#FF3D00] border-slate-300"
                                                        defaultChecked={rating === 'Best'}
                                                    />
                                                    <span className="text-sm text-slate-600">{rating}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <textarea
                                            className="w-full border-slate-200 rounded-lg text-sm focus:ring-[#FF3D00] focus:border-[#FF3D00] p-3"
                                            placeholder="Comments/Suggestions"
                                            rows="2"
                                            defaultValue="The program objectives and institutional vision are well-aligned with industry standards."
                                        />
                                    </div>
                                ))}

                                {/* Signature */}
                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <div className="mb-6">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Digital Signature (E-Sign)</p>
                                        <div className="w-full border border-slate-200 rounded-xl h-32 flex items-center justify-center bg-slate-50">
                                            <span className={styles.digitalSignature}>Vadin S.</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button className="bg-[#FF3D00] hover:bg-red-600 text-white font-bold py-3 px-10 rounded-lg transition-all shadow-md active:scale-95 uppercase tracking-wider text-sm">
                                            Update Assessment
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

export default CoordinatorFeedbackForm;
