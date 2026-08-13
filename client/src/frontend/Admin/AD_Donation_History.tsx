import { useState, useEffect, useRef } from 'react';
import Sidebar from './Components/Sidebar/Sidebar';
import styles from './AD_Donation_History.module.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext/authContext';
import { formatBranchName } from '../../utils/formatters';
import { Eye } from 'lucide-react';
import * as XLSX from 'xlsx';

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatAmount = (amount: number) => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatCompact = (amount: number): string => {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
};

const getInitials = (name: string | undefined | null) => {
  if (!name) return 'NA';
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

interface DonationRecord {
  id: string;
  initials: string;
  name: string;
  department: string;
  batch: string;
  amount: string;
  rawAmount: number;
  date: string;
  rawDate: Date;
  type: string;
  typeClass: string;
}

interface ApiPayment {
  _id: string;
  status: string;
  amount: number;
  paidAt?: string;
  createdAt: string;
  purpose?: string;
  department?: string;
  user?: {
    name?: string;
    email?: string;
  };
}

interface DepartmentItem {
  _id: string;
  branch: string;
  deptCode: string;
}

const CARD_COLORS = ['#228B22', '#2563eb', '#ea580c', '#9333ea'];

const Admin_Donation_History = ({ onLogout }: { onLogout?: () => void }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [donationsData, setDonationsData] = useState<DonationRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  // Export dropdown
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const entriesPerPage = 7;

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      if (!user?.token) {
        setError('Please login to view donations');
        setLoading(false);
        return;
      }

      try {
        const [paymentsRes, deptRes] = await Promise.all([
          fetch(`${API_BASE}/api/payments/all`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          fetch(`${API_BASE}/api/departments`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${user.token}` },
          })
        ]);

        if (!paymentsRes.ok) throw new Error('Failed to fetch donations');

        const data = await paymentsRes.json();
        if (data.success && data.payments) {
          const formattedData: DonationRecord[] = (data.payments as ApiPayment[])
            .filter(payment => payment.status === 'paid')
            .map((payment) => ({
              id: payment._id,
              initials: getInitials(payment.user?.name),
              name: payment.user?.name || 'Unknown',
              department: payment.department || 'General',
              batch: payment.purpose || 'General Donation',
              amount: formatAmount(payment.amount),
              rawAmount: payment.amount,
              date: formatDate(payment.paidAt || payment.createdAt),
              rawDate: new Date(payment.paidAt || payment.createdAt),
              type: 'Online',
              typeClass: styles.typeUpi,
            }));

          setDonationsData(formattedData);
        }

        if (deptRes.ok) {
          const deptJson = await deptRes.json();
          if (deptJson.success && deptJson.departments) {
            setDepartments(deptJson.departments);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [user]);

  // ─── METRICS & CHART DATA ─────────────────────────────────
  const totalRevenue = donationsData.reduce((acc, d) => acc + d.rawAmount, 0);
  const totalDonors = donationsData.length;
  const highestDonation = donationsData.reduce((max, d) => Math.max(max, d.rawAmount), 0);
  const avgDonation = totalDonors > 0 ? totalRevenue / totalDonors : 0;

  // Department revenue breakdown
  const deptRevenue: Record<string, number> = {};
  donationsData.forEach(d => {
    const dept = d.department?.trim() || 'General';
    deptRevenue[dept] = (deptRevenue[dept] || 0) + d.rawAmount;
  });
  const sortedDeptRevenue = Object.entries(deptRevenue).sort((a, b) => b[1] - a[1]);
  const topDeptRevenue = sortedDeptRevenue[0] ? sortedDeptRevenue[0][1] : 0;

  // Monthly trend with REAL labels (last 6 months)
  const MONTH_LABELS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyTrendData: { label: string; value: number; count: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthDonations = donationsData.filter(d => d.rawDate >= monthStart && d.rawDate <= monthEnd);
    const sum = monthDonations.reduce((acc, d) => acc + d.rawAmount, 0);
    monthlyTrendData.push({
      label: MONTH_LABELS_SHORT[monthStart.getMonth()],
      value: sum,
      count: monthDonations.length,
    });
  }
  const monthlyTrend = monthlyTrendData.map(m => m.value);
  const maxMonthly = Math.max(...monthlyTrend, 1);

  // ─── SVG SPARKLINE HELPERS ────────────────────────────────
  const getSparklinePoints = (data: number[], width: number, height: number, padX: number = 12, padTop: number = 14, padBot: number = 18) => {
    if (data.length < 2) return [];
    const max = Math.max(...data, 1);
    const step = (width - padX * 2) / (data.length - 1);
    return data.map((v, i) => ({
      x: padX + i * step,
      y: padTop + (height - padTop - padBot) * (1 - v / max),
    }));
  };

  const buildSparklinePath = (data: number[], width: number, height: number, padX: number = 12, padTop: number = 14, padBot: number = 18): string => {
    const points = getSparklinePoints(data, width, height, padX, padTop, padBot);
    if (points.length < 2) return '';
    return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  };

  const buildAreaPath = (data: number[], width: number, height: number, padX: number = 12, padTop: number = 14, padBot: number = 18): string => {
    const linePath = buildSparklinePath(data, width, height, padX, padTop, padBot);
    if (!linePath) return '';
    const points = getSparklinePoints(data, width, height, padX, padTop, padBot);
    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    const bottomY = height - padBot;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // ─── FILTERED DATA ────────────────────────────────────────
  const filteredData = donationsData.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      item.name.toLowerCase().includes(term) ||
      item.batch.toLowerCase().includes(term) ||
      item.department.toLowerCase().includes(term);

    const matchesDept = !selectedDept || item.department.toLowerCase() === selectedDept.toLowerCase();

    const min = minAmount !== '' ? Number(minAmount) : null;
    const max = maxAmount !== '' ? Number(maxAmount) : null;
    const matchesMin = min === null || item.rawAmount >= min;
    const matchesMax = max === null || item.rawAmount <= max;

    return matchesSearch && matchesDept && matchesMin && matchesMax;
  }).sort((a, b) => {
    if (sortBy === 'amount_desc') return b.rawAmount - a.rawAmount;
    if (sortBy === 'amount_asc') return a.rawAmount - b.rawAmount;
    if (sortBy === 'date_asc') return a.rawDate.getTime() - b.rawDate.getTime();
    return b.rawDate.getTime() - a.rawDate.getTime();
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDept('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('date_desc');
    setCurrentPage(1);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;

    const exportData = filteredData.map((row, index) => ({
      'S.No': index + 1,
      'Donor Name': row.name,
      'Department': row.department,
      'Cause / Purpose': row.batch,
      'Amount': row.amount,
      'Date': row.date,
      'Type': row.type
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Donations');

    const colWidths = [8, 25, 30, 25, 15, 15, 12];
    ws['!cols'] = colWidths.map(width => ({ wch: width }));

    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Alumni_Donations_Report_${currentDate}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const handleExportPDF = async () => {
    if (filteredData.length === 0) return;

    try {
      // @ts-ignore
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule.default || html2pdfModule) as any;

      const element = document.createElement('div');
      element.style.padding = '24px';
      element.style.fontFamily = 'Arial, sans-serif';
      element.style.color = '#1e293b';

      element.innerHTML = `
        <div style="margin-bottom: 20px; border-bottom: 2px solid #228B22; padding-bottom: 12px;">
          <h2 style="color: #228B22; margin: 0 0 4px 0; font-size: 20px;">Alumni Donations Report</h2>
          <p style="color: #64748b; margin: 0; font-size: 11px;">
            Generated on ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} · Total Records: ${filteredData.length}
          </p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #475569; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 8px 10px; font-weight: 700;">S.NO</th>
              <th style="padding: 8px 10px; font-weight: 700;">DONOR NAME</th>
              <th style="padding: 8px 10px; font-weight: 700;">DEPARTMENT</th>
              <th style="padding: 8px 10px; font-weight: 700;">CAUSE</th>
              <th style="padding: 8px 10px; font-weight: 700;">AMOUNT</th>
              <th style="padding: 8px 10px; font-weight: 700;">DATE</th>
              <th style="padding: 8px 10px; font-weight: 700;">TYPE</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map((row, index) => `
              <tr style="border-bottom: 1px solid #e2e8f0; ${index % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
                <td style="padding: 8px 10px; color: #64748b;">${index + 1}</td>
                <td style="padding: 8px 10px; font-weight: 600;">${row.name}</td>
                <td style="padding: 8px 10px; color: #334155;">${row.department}</td>
                <td style="padding: 8px 10px; color: #475569;">${row.batch}</td>
                <td style="padding: 8px 10px; font-weight: 700; color: #15803d;">${row.amount}</td>
                <td style="padding: 8px 10px; color: #64748b;">${row.date}</td>
                <td style="padding: 8px 10px;">${row.type}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Alumni_Donations_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedDonations = filteredData.slice(startIndex, startIndex + entriesPerPage);
  const rangeStart = totalEntries === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + entriesPerPage, totalEntries);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // ─── SHARED INLINE STYLES ────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: '#fff',
    padding: '1.25rem 1.5rem',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '140px',
    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
    cursor: 'default',
    position: 'relative',
    overflow: 'hidden',
  };

  const filterInputStyle: React.CSSProperties = {
    padding: '0.5rem 0.85rem',
    borderRadius: '0.5rem',
    border: '1px solid #e2e8f0',
    background: '#fff',
    fontSize: '0.85rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    color: '#1e293b',
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'donation_history'} />
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <div className={styles.loadingState}>
              <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#228B22', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Loading donations...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'donation_history'} />
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <div className={styles.errorState}>
              <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>error_outline</span>
              <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Sidebar onLogout={onLogout} currentView={'donation_history'} />
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>

          {/* ─── HEADER ──────────────────────────────────────── */}
          <div className={styles.pageHeader} style={{ marginBottom: '1.75rem' }}>
            <div>
              <h2 className={styles.pageTitle}>Alumni Donations Tracking</h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.35rem 0 0 0', fontWeight: 400 }}>
                Comprehensive donation analytics across all college departments.
              </p>
            </div>
            <div className={styles.exportDropdownWrapper} ref={dropdownRef}>
              <button
                className={styles.exportBtn}
                onClick={() => setShowExportDropdown(prev => !prev)}
              >
                <span className="material-symbols-outlined">file_download</span>
                Export
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '1.1rem',
                    marginLeft: '-2px',
                    transform: showExportDropdown ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  expand_more
                </span>
              </button>

              {showExportDropdown && (
                <div className={styles.exportDropdownMenu}>
                  <button
                    className={styles.exportDropdownItem}
                    onClick={() => {
                      setShowExportDropdown(false);
                      handleExportExcel();
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: '1.2rem' }}>table_chart</span>
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    className={styles.exportDropdownItem}
                    onClick={() => {
                      setShowExportDropdown(false);
                      handleExportPDF();
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: '1.2rem' }}>picture_as_pdf</span>
                    <span>PDF (.pdf)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─── METRIC CARDS WITH VISUALS ────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>

            {/* Card 1: Total Revenue + Monthly Trend Chart with Real Data Labels */}
            <div
              style={cardStyle}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(34,139,34,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Total Revenue</p>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d', margin: '0.3rem 0 0 0', letterSpacing: '-0.02em' }}>{formatCompact(totalRevenue)}</h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500, margin: '0.15rem 0 0 0' }}>{formatAmount(totalRevenue)}</p>
                </div>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: CARD_COLORS[0], fontSize: '1.2rem' }}>account_balance_wallet</span>
                </div>
              </div>
              {/* Real data sparkline with month labels and amounts */}
              <div style={{ width: '100%', marginTop: '0.5rem' }}>
                <svg width="100%" height="80" viewBox="0 0 220 80" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#228B22" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#228B22" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Area fill */}
                  <path d={buildAreaPath(monthlyTrend, 220, 80)} fill="url(#revenueGrad)" />
                  {/* Line */}
                  <path d={buildSparklinePath(monthlyTrend, 220, 80)} fill="none" stroke="#228B22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Data points with amounts + month labels */}
                  {(() => {
                    const points = getSparklinePoints(monthlyTrend, 220, 80);
                    return points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="3" fill="#fff" stroke="#228B22" strokeWidth="1.5" />
                        {/* Amount above the dot */}
                        <text x={p.x} y={p.y - 6} textAnchor="middle" fill="#15803d" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif">
                          {formatCompact(monthlyTrendData[i].value)}
                        </text>
                        {/* Month label below the chart */}
                        <text x={p.x} y={74} textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="600" fontFamily="Inter, sans-serif">
                          {monthlyTrendData[i].label}
                        </text>
                      </g>
                    ));
                  })()}
                </svg>
              </div>
            </div>

            {/* Card 2: Total Donors + Donor Count by Dept */}
            <div
              style={cardStyle}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(37,99,235,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Total Donors</p>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1d4ed8', margin: '0.3rem 0 0 0', letterSpacing: '-0.02em' }}>{totalDonors}</h3>
                </div>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: CARD_COLORS[1], fontSize: '1.2rem' }}>group</span>
                </div>
              </div>
              {/* Dept breakdown bars with real data */}
              <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {sortedDeptRevenue.slice(0, 3).map(([dept, rev]) => {
                  const pct = topDeptRevenue > 0 ? Math.round((rev / topDeptRevenue) * 100) : 0;
                  const donorCnt = donationsData.filter(d => (d.department?.trim() || 'General') === dept).length;
                  return (
                    <div key={dept}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#475569', marginBottom: '2px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>{dept}</span>
                        <span style={{ fontWeight: 600, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
                          {donorCnt} donors · {formatCompact(rev)}
                        </span>
                      </div>
                      <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #3b82f6, #2563eb)', borderRadius: '2px', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 3: Highest Contribution */}
            <div
              style={cardStyle}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(234,88,12,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Highest Contribution</p>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c2410c', margin: '0.3rem 0 0 0', letterSpacing: '-0.02em' }}>{formatCompact(highestDonation)}</h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500, margin: '0.15rem 0 0 0' }}>{formatAmount(highestDonation)}</p>
                </div>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #ffedd5, #fed7aa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: CARD_COLORS[2], fontSize: '1.2rem' }}>trophy</span>
                </div>
              </div>
              {/* Top donor badge */}
              {donationsData.length > 0 && (() => {
                const topDonor = donationsData.reduce((prev, curr) => curr.rawAmount > prev.rawAmount ? curr : prev, donationsData[0]);
                return (
                  <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff7ed', padding: '0.45rem 0.65rem', borderRadius: '0.5rem', border: '1px solid #fed7aa' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #ea580c, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                      {topDonor.initials}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: '#9a3412', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        {topDonor.name}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.65rem', color: '#c2410c' }}>{topDonor.department}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Card 4: Average Donation + Revenue Distribution Ring */}
            <div
              style={cardStyle}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(147,51,234,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Avg. Donation</p>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7e22ce', margin: '0.3rem 0 0 0', letterSpacing: '-0.02em' }}>{formatCompact(avgDonation)}</h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500, margin: '0.15rem 0 0 0' }}>{formatAmount(avgDonation)}</p>
                </div>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: CARD_COLORS[3], fontSize: '1.2rem' }}>analytics</span>
                </div>
              </div>
              {/* Mini donut ring */}
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <svg width="44" height="44" viewBox="0 0 44 44">
                  {(() => {
                    const ringColors = ['#9333ea', '#c084fc', '#e9d5ff'];
                    const top3 = sortedDeptRevenue.slice(0, 3);
                    const top3Total = top3.reduce((acc, [, v]) => acc + v, 0) || 1;
                    let cumAngle = -90;
                    return top3.map(([dept, rev], i) => {
                      const angle = (rev / top3Total) * 360;
                      const startAngle = cumAngle;
                      cumAngle += angle;
                      const endAngle = cumAngle;
                      const r = 17;
                      const cx = 22;
                      const cy = 22;
                      const startRad = (Math.PI / 180) * startAngle;
                      const endRad = (Math.PI / 180) * endAngle;
                      const x1 = cx + r * Math.cos(startRad);
                      const y1 = cy + r * Math.sin(startRad);
                      const x2 = cx + r * Math.cos(endRad);
                      const y2 = cy + r * Math.sin(endRad);
                      const largeArc = angle > 180 ? 1 : 0;
                      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                      return <path key={dept} d={d} fill={ringColors[i] || '#e2e8f0'} stroke="#fff" strokeWidth="1.5" />;
                    });
                  })()}
                  <circle cx="22" cy="22" r="10" fill="#fff" />
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {sortedDeptRevenue.slice(0, 3).map(([dept, rev], i) => {
                    const pct = totalRevenue > 0 ? Math.round((rev / totalRevenue) * 100) : 0;
                    const colors = ['#9333ea', '#c084fc', '#d8b4fe'];
                    return (
                      <span key={dept} style={{ fontSize: '0.65rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors[i] || '#e2e8f0', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55px' }}>{dept}</span>
                        <span style={{ fontWeight: 700, color: '#7e22ce' }}>{pct}%</span>
                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>({formatCompact(rev)})</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ─── FILTER PANEL ────────────────────────────────── */}
          <div style={{
            background: '#fff', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0',
            marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.625rem', alignItems: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.15rem' }}>search</span>
              <input
                type="text"
                placeholder="Search donor or cause..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ ...filterInputStyle, width: '100%', paddingLeft: '2.4rem' }}
                onFocus={e => { e.target.style.borderColor = '#228B22'; e.target.style.boxShadow = '0 0 0 3px rgba(34,139,34,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Department */}
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
              style={{ ...filterInputStyle, minWidth: '160px', cursor: 'pointer' }}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={formatBranchName(dept.branch)}>
                  {dept.deptCode} - {formatBranchName(dept.branch)}
                </option>
              ))}
            </select>

            {/* Min Amount */}
            <input
              type="number"
              placeholder="Min ₹"
              value={minAmount}
              onChange={(e) => { setMinAmount(e.target.value); setCurrentPage(1); }}
              style={{ ...filterInputStyle, width: '100px' }}
              onFocus={e => { e.target.style.borderColor = '#228B22'; e.target.style.boxShadow = '0 0 0 3px rgba(34,139,34,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />

            {/* Max Amount */}
            <input
              type="number"
              placeholder="Max ₹"
              value={maxAmount}
              onChange={(e) => { setMaxAmount(e.target.value); setCurrentPage(1); }}
              style={{ ...filterInputStyle, width: '100px' }}
              onFocus={e => { e.target.style.borderColor = '#228B22'; e.target.style.boxShadow = '0 0 0 3px rgba(34,139,34,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ ...filterInputStyle, cursor: 'pointer' }}
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="amount_desc">Amount: High → Low</option>
              <option value="amount_asc">Amount: Low → High</option>
            </select>

            {/* Reset */}
            {(searchTerm || selectedDept || minAmount || maxAmount || sortBy !== 'date_desc') && (
              <button
                onClick={clearFilters}
                style={{
                  padding: '0.5rem 0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem',
                  color: '#dc2626', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                  transition: 'all 0.2s ease', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>close</span>
                Clear
              </button>
            )}
          </div>

          {/* ─── DATA TABLE ──────────────────────────────────── */}
          <div className={styles.tableCard}>
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>S.NO</th>
                    <th>Donor Name</th>
                    <th>Department</th>
                    <th>Cause</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th className={styles.textCenter}>Type</th>
                    <th className={styles.textRight}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDonations.length > 0 ? (
                    paginatedDonations.map((row, index) => (
                      <tr key={row.id}>
                        <td className={styles.tdSno}>{startIndex + index + 1}</td>
                        <td>
                          <div className={styles.donorInfo}>
                            <div className={styles.donorAvatar}>{row.initials}</div>
                            <span className={styles.donorName}>{row.name}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.75rem', background: '#f0fdf4', color: '#15803d',
                            padding: '0.2rem 0.55rem', borderRadius: '0.375rem', fontWeight: 600,
                            border: '1px solid #bbf7d0', display: 'inline-block',
                          }}>
                            {row.department}
                          </span>
                        </td>
                        <td className={styles.tdBatch}>{row.batch}</td>
                        <td className={styles.tdAmount}>{row.amount}</td>
                        <td className={styles.tdDate}>{row.date}</td>
                        <td className={styles.textCenter}>
                          <span className={`${styles.typePill} ${row.typeClass}`}>
                            {row.type}
                          </span>
                        </td>
                        <td className={styles.textRight}>
                          <button
                            className={styles.actionBtn}
                            title="View Details"
                            onClick={() => { navigate(`/admin/view_donation/${row.id}`) }}
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className={styles.emptyCell}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#cbd5e1' }}>search_off</span>
                          <span>No donations found matching the active filters.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredData.length > 0 && (
              <div className={styles.paginationFooter}>
                <p className={styles.paginationText}>
                  Showing {rangeStart} to {rangeEnd} of {totalEntries} entries
                </p>
                <div className={styles.paginationControls}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        className={`${styles.pageBtn} ${currentPage === page ? styles.activePageBtn : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    className={styles.pageBtn}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Admin_Donation_History;
