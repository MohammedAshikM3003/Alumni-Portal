import { useState, useEffect } from 'react';
import styles from './Co_Profile.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from './Components/BackButton/Back';

const CoordinatorProfile = ( { onLogout } ) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [formData, setFormData] = useState({
        name: 'Mohammed Ashik M',
        designation: 'Coordinator',
        personalEmail: 'ashik@example.com',
        domainEmail: 'm.ashik@ksrce.ac.in',
        branch: 'Computer Science',
        mobileNo: '+91 98765 43210',
        cabinNo: 'C-204',
        staffId: 'KSRCE-882',
        department: 'CSE',
        role: 'Alumni Coordinator',
        joiningDate: '12 Aug 2018',
        status: 'Active',
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            setIsEditing(false);
            setShowSuccessModal(true);
        }, 2000);
    };

    const handleDiscard = () => {
        // Reset form data to original values
        setFormData({
            name: 'Mohammed Ashik M',
            designation: 'Coordinator',
            personalEmail: 'ashik@example.com',
            domainEmail: 'm.ashik@ksrce.ac.in',
            branch: 'Computer Science',
            mobileNo: '+91 98765 43210',
            cabinNo: 'C-204',
            staffId: 'KSRCE-882',
            department: 'CSE',
            role: 'Alumni Coordinator',
            joiningDate: '12 Aug 2018',
            status: 'Active',
        });
        setIsEditing(false);
    };

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && showSuccessModal) {
                setShowSuccessModal(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [showSuccessModal]);

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
                                        <button onClick={() => setIsEditing(!isEditing)} className={styles.btnPrimary}>{isEditing ? 'Cancel' : 'Edit Profile'}</button>
                                    </div>
                                    <div className="p-0">
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Name</span>
                                            </div>
                                            <div className="w-2/3">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3D00]"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-semibold text-slate-900">{formData.name}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Designation</span>
                                            </div>
                                            <div className="w-2/3">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="designation"
                                                        value={formData.designation}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3D00]"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-semibold text-slate-900">{formData.designation}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Personal Email</span>
                                            </div>
                                            <div className="w-2/3">
                                                {isEditing ? (
                                                    <input
                                                        type="email"
                                                        name="personalEmail"
                                                        value={formData.personalEmail}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3D00]"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-semibold text-slate-900">{formData.personalEmail}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Domain Email</span>
                                            </div>
                                            <div className="w-2/3">
                                                {isEditing ? (
                                                    <input
                                                        type="email"
                                                        name="domainEmail"
                                                        value={formData.domainEmail}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3D00]"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-semibold text-slate-900">{formData.domainEmail}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Branch</span>
                                            </div>
                                            <div className="w-2/3">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="branch"
                                                        value={formData.branch}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3D00]"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-semibold text-slate-900">{formData.branch}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Mobile No</span>
                                            </div>
                                            <div className="w-2/3">
                                                {isEditing ? (
                                                    <input
                                                        type="tel"
                                                        name="mobileNo"
                                                        value={formData.mobileNo}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3D00]"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-semibold text-slate-900">{formData.mobileNo}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
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
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="cabinNo"
                                                        value={formData.cabinNo}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3D00]"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-semibold text-slate-900">{formData.cabinNo}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Staff ID</span>
                                            </div>
                                            <div className="w-2/3">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="staffId"
                                                        value={formData.staffId}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3D00]"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-semibold text-slate-900">{formData.staffId}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Department</span>
                                            </div>
                                            <div className="w-2/3">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="department"
                                                        value={formData.department}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3D00]"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-semibold text-slate-900">{formData.department}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Role</span>
                                            </div>
                                            <div className="w-2/3">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="role"
                                                        value={formData.role}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3D00]"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-semibold text-slate-900">{formData.role}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Joining Date</span>
                                            </div>
                                            <div className="w-2/3">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="joiningDate"
                                                        value={formData.joiningDate}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3D00]"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-semibold text-slate-900">{formData.joiningDate}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow}>
                                            <div className="w-1/3">
                                                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Status</span>
                                            </div>
                                            <div className="w-2/3">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="status"
                                                        value={formData.status}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3D00]"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-bold text-emerald-600">{formData.status}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="mt-6 flex items-center justify-end gap-3">
                                <button onClick={handleDiscard} className={styles.btnSecondary}>Discard</button>
                                <button onClick={handleSave} disabled={isSaving} className={styles.btnPrimary}>{isSaving ? 'Saving...' : 'Save'}</button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Saving Popup */}
            {isSaving && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm">
                        <div className="w-16 h-16 rounded-full bg-[#FF3D00]/10 flex items-center justify-center animate-pulse">
                            <span className="material-symbols-outlined text-[#FF3D00] text-3xl">check_circle</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Saving...</h3>
                        <p className="text-center text-slate-600 text-sm">Your profile changes are being saved. Please wait.</p>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-6 max-w-sm animate-slideUp">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Saved!</h3>
                            <p className="text-slate-600 text-sm">Your profile has been updated successfully.</p>
                        </div>
                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full bg-[#FF3D00] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#E63946] transition-colors duration-200"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoordinatorProfile;
