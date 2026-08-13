import { FC, useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styles from './Co_Donation_History.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';
import * as XLSX from 'xlsx';

const API_BASE = import.meta.env.VITE_API_URL;

interface User {
    name: string;
    email?: string;
    userId?: string;
}

interface ApiPayment {
    _id: string;
    status: string;
    user?: User;
    purpose: string;
    amount: number;
    paidAt?: string;
    createdAt: string;
}

interface DonationRecord {
    id: string;
    sno: number;
    name: string;
    initials: string;
    details: string;
    amount: string;
    rawAmount: number;
    date: string;
    rawDate: string;
    type: string;
}

interface LatestDonor {
    name: string;
    amount: string;
}

interface CoordinatorDonationHistoryProps {
    onLogout: () => void;
}

const formatDate = (dateString: string | number | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const getRawDate = (dateString: string | number | Date): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateStr: string): Date => {
    if (!dateStr || typeof dateStr !== 'string') return new Date();
    const parts = dateStr.split('-').map(Number);
    if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
};

const formatAmount = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getInitials = (name: string): string => {
    if (!name) return 'NA';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

interface DonationDateFilterProps {
    availableDates: Set<string>;
    selectedDate: string;
    onSelectDate: (date: string) => void;
}

const DonationDateFilter: FC<DonationDateFilterProps> = ({ availableDates, selectedDate, onSelectDate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'day' | 'month' | 'year'>('day');
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (selectedDate) {
                setCurrentDate(parseLocalDate(selectedDate));
            } else if (availableDates.size > 0) {
                const sorted = Array.from(availableDates).sort();
                const latest = sorted[sorted.length - 1];
                setCurrentDate(parseLocalDate(latest));
            } else {
                setCurrentDate(new Date());
            }
            setViewMode('day');
        }
    }, [isOpen, selectedDate, availableDates]);

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return 'Select date';
        const date = parseLocalDate(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    };

    const renderDayView = () => {
        const days = [];
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            days.push(
                <div key={`prev-${i}`} className="h-8 w-8 flex items-center justify-center text-xs text-slate-300 select-none cursor-default">
                    {prevMonthLastDay - i}
                </div>
            );
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isEnabled = availableDates.has(dateStr);
            const isSelected = selectedDate === dateStr;

            days.push(
                <button
                    type="button"
                    key={`curr-${day}`}
                    disabled={!isEnabled}
                    onClick={() => {
                        if (isEnabled) {
                            onSelectDate(dateStr);
                            setIsOpen(false);
                        }
                    }}
                    className={`h-8 w-8 flex flex-col items-center justify-center rounded-lg text-xs font-semibold transition-all ${isSelected
                            ? 'bg-[#FF3D00] text-white font-bold shadow-md shadow-orange-500/20'
                            : isEnabled
                                ? 'bg-orange-50/90 text-[#FF3D00] font-bold border border-[#FF3D00]/30 hover:bg-[#FF3D00] hover:text-white cursor-pointer'
                                : 'text-slate-300 bg-slate-50/40 cursor-not-allowed opacity-40'
                        }`}
                    title={isEnabled ? `Select ${dateStr}` : 'No donations on this date'}
                >
                    <span>{day}</span>
                    {isEnabled && !isSelected && (
                        <span className="w-1 h-1 rounded-full bg-[#FF3D00] mt-0.5"></span>
                    )}
                </button>
            );
        }

        const totalCells = days.length;
        const remainingCells = (totalCells % 7 === 0) ? 0 : (7 - (totalCells % 7));
        for (let day = 1; day <= remainingCells; day++) {
            days.push(
                <div key={`next-${day}`} className="h-8 w-8 flex items-center justify-center text-xs text-slate-300 select-none cursor-default">
                    {day}
                </div>
            );
        }

        return days;
    };

    const renderMonthView = () => {
        const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = currentDate.getFullYear();

        return (
            <div className="grid grid-cols-3 gap-2 p-3">
                {monthsShort.map((month, idx) => {
                    const monthStr = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
                    let hasDonation = false;
                    availableDates.forEach(d => {
                        if (d.startsWith(monthStr)) hasDonation = true;
                    });
                    const isCurrent = currentDate.getMonth() === idx;

                    return (
                        <button
                            type="button"
                            key={month}
                            onClick={() => {
                                setCurrentDate(new Date(currentYear, idx, 1));
                                setViewMode('day');
                            }}
                            className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center ${isCurrent
                                    ? 'bg-[#FF3D00] text-white shadow-sm'
                                    : hasDonation
                                        ? 'bg-orange-50 text-[#FF3D00] border border-orange-200 hover:bg-orange-100 font-bold'
                                        : 'text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            <span>{month}</span>
                            {hasDonation && !isCurrent && (
                                <span className="text-[9px] text-[#FF3D00] font-normal">Data</span>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    };

    const renderYearView = () => {
        const currentYear = currentDate.getFullYear();
        let startYear = currentYear - 6;
        let endYear = currentYear + 5;
        const years = [];
        for (let y = startYear; y <= endYear; y++) {
            years.push(y);
        }

        return (
            <div className="grid grid-cols-3 gap-2 p-3 max-h-56 overflow-y-auto">
                {years.map(year => {
                    let hasDonation = false;
                    availableDates.forEach(d => {
                        if (d.startsWith(`${year}-`)) hasDonation = true;
                    });
                    const isCurrent = currentYear === year;

                    return (
                        <button
                            type="button"
                            key={year}
                            onClick={() => {
                                setCurrentDate(new Date(year, currentDate.getMonth(), 1));
                                setViewMode('month');
                            }}
                            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${isCurrent
                                    ? 'bg-[#FF3D00] text-white shadow-sm'
                                    : hasDonation
                                        ? 'bg-orange-50 text-[#FF3D00] border border-orange-200 hover:bg-orange-100 font-bold'
                                        : 'text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            {year}
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200/60 hover:border-slate-300 transition-all">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium focus:outline-none"
                >
                    <span className="material-symbols-outlined text-slate-500 text-lg">calendar_today</span>
                    <span className={selectedDate ? 'text-[#FF3D00] font-bold' : 'text-slate-600'}>
                        {formatDisplayDate(selectedDate)}
                    </span>
                </button>
                {selectedDate && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectDate('');
                        }}
                        className="pr-3 pl-1 text-slate-400 hover:text-red-500 transition-colors flex items-center"
                        title="Clear date filter"
                    >
                        <span className="material-symbols-outlined text-base">close</span>
                    </button>
                )}
            </div>
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-[300px] bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden text-slate-800">
                    <div className="px-3 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                        <div className="flex gap-1 bg-slate-200/60 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setViewMode('day')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${viewMode === 'day' ? 'bg-white text-[#FF3D00] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Day
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('month')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${viewMode === 'month' ? 'bg-white text-[#FF3D00] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Month
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('year')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${viewMode === 'year' ? 'bg-white text-[#FF3D00] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Year
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors flex items-center justify-center"
                        >
                            <span className="material-symbols-outlined text-base">close</span>
                        </button>
                    </div>
                    {viewMode !== 'year' && (
                        <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 bg-white">
                            <button
                                type="button"
                                onClick={() => {
                                    if (viewMode === 'day') {
                                        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
                                    } else {
                                        setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
                                    }
                                }}
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            <span className="text-xs font-bold text-slate-800">
                                {viewMode === 'day'
                                    ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                    : currentDate.getFullYear()}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    if (viewMode === 'day') {
                                        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
                                    } else {
                                        setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
                                    }
                                }}
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                        </div>
                    )}
                    {viewMode === 'day' && (
                        <div className="p-2.5">
                            <div className="grid grid-cols-7 gap-1 mb-1">
                                {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(d => (
                                    <div key={d} className="text-center text-[10px] font-extrabold text-slate-400 py-1">
                                        {d}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {renderDayView()}
                            </div>
                        </div>
                    )}
                    {viewMode === 'month' && renderMonthView()}
                    {viewMode === 'year' && renderYearView()}
                    <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-500">
                            {availableDates.size} {availableDates.size === 1 ? 'date' : 'dates'} available
                        </span>
                        {selectedDate && (
                            <button
                                type="button"
                                onClick={() => {
                                    onSelectDate('');
                                    setIsOpen(false);
                                }}
                                className="text-[11px] font-bold text-[#FF3D00] hover:underline flex items-center gap-0.5"
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const CoordinatorDonationHistory: FC<CoordinatorDonationHistoryProps> = ({ onLogout }) => {
    const { user } = useAuth();
    const [donationData, setDonationData] = useState<DonationRecord[]>([]);
    const [filteredData, setFilteredData] = useState<DonationRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [minAmount, setMinAmount] = useState<string>('');
    const [maxAmount, setMaxAmount] = useState<string>('');
    const [latestDonor, setLatestDonor] = useState<LatestDonor | null>(null);
    const availableDates = useMemo(() => new Set(donationData.map(item => item.rawDate)), [donationData]);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        if (isExportMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExportMenuOpen]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const controller = new AbortController();
        const fetchPayments = async (): Promise<void> => {
            if (!user?.token) {
                setError('Please login to view donations');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/api/payments/department/all`, {
                    signal: controller.signal,
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch donations');
                }

                const data = await response.json();

                if (data.success && data.payments) {
                    const formattedData: DonationRecord[] = data.payments
                        .filter((payment: ApiPayment) => payment.status === 'paid')
                        .map((payment: ApiPayment, index: number) => ({
                            id: payment._id,
                            sno: index + 1,
                            name: payment.user?.name || 'Unknown',
                            initials: getInitials(payment.user?.name || 'Unknown'),
                            details: payment.purpose,
                            amount: formatAmount(payment.amount),
                            rawAmount: payment.amount,
                            date: formatDate(payment.paidAt || payment.createdAt),
                            rawDate: getRawDate(payment.paidAt || payment.createdAt),
                            type: 'Online',
                        }));

                    setDonationData(formattedData);
                    setFilteredData(formattedData);

                    // Set latest donor for banner
                    if (formattedData.length > 0) {
                        setLatestDonor({
                            name: formattedData[0].name,
                            amount: formattedData[0].amount,
                        });
                    }
                }
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                setError(err.message || 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();

        return () => controller.abort();
    }, [user]);

    // Filter data based on search term and selected date
    useEffect(() => {
        let filtered = donationData;

        if (selectedDate) {
            filtered = filtered.filter(item => item.rawDate === selectedDate);
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(term) ||
                item.details.toLowerCase().includes(term)
            );
        }

        if (minAmount !== '') {
            filtered = filtered.filter(item => item.rawAmount >= Number(minAmount));
        }

        if (maxAmount !== '') {
            filtered = filtered.filter(item => item.rawAmount <= Number(maxAmount));
        }

        setFilteredData(filtered);
        setCurrentPage(1);
    }, [searchTerm, selectedDate, minAmount, maxAmount, donationData]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    const paginatedData = filteredData.slice(startIndex, endIndex);

    const handlePreviousPage = (): void => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = (): void => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePageClick = (pageNumber: number): void => {
        setCurrentPage(pageNumber);
    };

    const handleExportExcel = (): void => {
        setIsExportMenuOpen(false);
        if (donationData.length === 0) {
            alert('No donation data to export');
            return;
        }

        // Prepare data for export
        const exportData = donationData.map((row) => ({
            'S.No': row.sno,
            'Donor Name': row.name,
            'Cause': row.details,
            'Amount': row.amount,
            'Date': row.date,
            'Type': row.type,
        }));

        // Create workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Donations');

        // Set column widths
        const colWidths = [8, 18, 20, 12, 12, 12];
        ws['!cols'] = colWidths.map(width => ({ wch: width }));

        // Generate filename with current date
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `Donations_Report_${currentDate}.xlsx`;

        // Download the file
        XLSX.writeFile(wb, filename);
    };

    const handleExportPDF = async (): Promise<void> => {
        setIsExportMenuOpen(false);
        if (donationData.length === 0) {
            alert('No donation data to export');
            return;
        }

        try {
            // @ts-ignore
            const html2pdfModule = await import('html2pdf.js');
            const html2pdf = (html2pdfModule.default || html2pdfModule) as any;

            const element = document.createElement('div');
            element.style.padding = '24px';
            element.style.fontFamily = 'Arial, sans-serif';
            element.style.color = '#1e293b';

            const currentDate = new Date().toISOString().split('T')[0];

            element.innerHTML = `
                <div style="margin-bottom: 20px; border-bottom: 2px solid #FF3D00; padding-bottom: 12px;">
                  <h2 style="color: #FF3D00; margin: 0 0 4px 0; font-size: 20px;">Alumni Donations Report</h2>
                  <p style="color: #64748b; margin: 0; font-size: 11px;">
                    Generated on: ${currentDate} · Total Records: ${donationData.length}
                  </p>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
                  <thead>
                    <tr style="background-color: #f1f5f9; color: #475569; border-bottom: 2px solid #cbd5e1;">
                      <th style="padding: 8px 10px; font-weight: 700;">S.No</th>
                      <th style="padding: 8px 10px; font-weight: 700;">Donor Name</th>
                      <th style="padding: 8px 10px; font-weight: 700;">Cause</th>
                      <th style="padding: 8px 10px; font-weight: 700;">Amount</th>
                      <th style="padding: 8px 10px; font-weight: 700;">Date</th>
                      <th style="padding: 8px 10px; font-weight: 700;">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${donationData.map((row, index) => `
                      <tr style="border-bottom: 1px solid #e2e8f0; ${index % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
                        <td style="padding: 8px 10px; color: #64748b;">${row.sno}</td>
                        <td style="padding: 8px 10px; font-weight: 600;">${row.name}</td>
                        <td style="padding: 8px 10px; color: #334155;">${row.details}</td>
                        <td style="padding: 8px 10px; font-weight: 700; color: #FF3D00;">${row.amount}</td>
                        <td style="padding: 8px 10px; color: #64748b;">${row.date}</td>
                        <td style="padding: 8px 10px;">${row.type}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
            `;

            const opt = {
                margin: [10, 10, 10, 10],
                filename: `Donations_Report_${currentDate}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save();
        } catch (err) {
            console.error('Error generating PDF:', err);
        }
    };

    const getTypeStyle = (type: string): string => {
        switch (type) {
            case 'UPI': return styles.typeUpi;
            case 'Net Banking': return styles.typeNetBanking;
            case 'Credit Card': return styles.typeCreditCard;
            case 'Debit Card': return styles.typeDebitCard;
            default: return styles.typeUpi;
        }
    };

    if (loading) {
        return (
            <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
                <Sidebar onLogout={onLogout} currentView="donation_history" />
                <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden items-center justify-center">
                    <div className="text-slate-600">Loading donations...</div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
                <Sidebar onLogout={onLogout} currentView="donation_history" />
                <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden items-center justify-center">
                    <div className="text-red-600">{error}</div>
                </main>
            </div>
        );
    }

    return (
        <div className="bg-[#F8FAFC] font-display text-slate-900 h-screen flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar onLogout={onLogout} currentView="donation_history" />
            {/* Main Content Area */}
            <main className="flex-1 ml-[70px] h-screen flex flex-col overflow-hidden">
                <div className={`flex-1 overflow-y-auto ${styles.mainScrollable} p-8 bg-[#F8FAFC]`}>
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">Alumni Donations Tracking</h2>
                            <div className="relative" ref={exportMenuRef}>
                                <button 
                                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} 
                                    className="bg-[#FF3D00] hover:bg-red-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-sm shadow-red-500/10"
                                >
                                    <span className="material-symbols-outlined text-lg">file_download</span>
                                    Export
                                    <span className="material-symbols-outlined text-sm">{isExportMenuOpen ? 'expand_less' : 'expand_more'}</span>
                                </button>
                                
                                {isExportMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                                        <div className="py-1">
                                            <button 
                                                onClick={handleExportExcel}
                                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-[#FF3D00] transition-colors flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">description</span>
                                                Excel
                                            </button>
                                            <button 
                                                onClick={handleExportPDF}
                                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-[#FF3D00] transition-colors flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                                                PDF
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Search & Filter */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 mb-6">
                            <div className="flex-1 min-w-[300px]">
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-[#FF3D00]/20 text-sm"
                                        placeholder="Search by donor name or cause..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 items-center flex-wrap">
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm text-slate-700"
                                            placeholder="Min ₹"
                                            value={minAmount}
                                            onChange={(e) => setMinAmount(e.target.value)}
                                            min="0"
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm text-slate-700"
                                            placeholder="Max ₹"
                                            value={maxAmount}
                                            onChange={(e) => setMaxAmount(e.target.value)}
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <DonationDateFilter
                                    availableDates={availableDates}
                                    selectedDate={selectedDate}
                                    onSelectDate={setSelectedDate}
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
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cause</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Type</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedData.length > 0 ? (
                                            paginatedData.map((item, index) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{startIndex + index + 1}</td>
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
                                                        <Link className="text-slate-400 hover:text-[#FF3D00] transition-colors p-1" to={`/coordinator/View_donation/${item.id}`}>
                                                            <span className="material-symbols-outlined">visibility</span>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                                    No donations found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {filteredData.length > 0 && (
                                <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-white">
                                    <p className="text-sm text-slate-500">Showing {startIndex + 1} to {endIndex} of {filteredData.length} entries</p>
                                    <div className="flex gap-2">
                                        <button
                                            className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                            onClick={handlePreviousPage}
                                            disabled={currentPage === 1}
                                        >
                                            Previous
                                        </button>
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((pageNum) => (
                                            <button
                                                key={pageNum}
                                                className={`px-4 py-2 rounded-lg text-sm font-semibold ${currentPage === pageNum
                                                        ? 'bg-[#FF3D00] text-white'
                                                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                onClick={() => handlePageClick(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        ))}
                                        <button
                                            className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                            onClick={handleNextPage}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoordinatorDonationHistory;
