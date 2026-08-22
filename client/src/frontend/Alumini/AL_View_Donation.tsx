import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from './AL_View_Donation.module.css';
import './scrollbar.js';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from '../Coordinator/Components/BackButton/Back';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

interface PaymentDetails {
	_id: string;
	user?: {
		_id: string;
		name?: string;
		email?: string;
		userId?: string;
	};
	amount: number;
	purpose: string;
	status: 'created' | 'paid' | 'failed';
	razorpayOrderId: string;
	razorpayPaymentId?: string;
	createdAt: string;
	paidAt?: string;
}

const formatDate = (dateString: string | number | Date) => {
	if (!dateString) return 'N/A';
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: '2-digit',
		year: 'numeric',
	});
};

const formatAmount = (amount: number) => {
	return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getStatusLabel = (status: PaymentDetails['status']) => {
	switch (status) {
		case 'paid':
			return 'SUCCESS';
		case 'failed':
			return 'FAILED';
		default:
			return 'PENDING';
	}
};

const Alumini_View_Donation = ({ onLogout }: { onLogout: () => void }) => {
	const { id } = useParams();
	const { user } = useAuth();
	const [payment, setPayment] = useState<PaymentDetails | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		const controller = new AbortController();

		const fetchPayment = async () => {
			if (!user?.token) {
				setError('Please login to view payment details');
				setLoading(false);
				return;
			}
			if (!id) {
				setError('Payment ID not provided');
				setLoading(false);
				return;
			}

			try {
				const response = await fetch(`${API_BASE}/api/payments/${id}`, {
					signal: controller.signal,
					headers: { Authorization: `Bearer ${user.token}` },
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || 'Failed to fetch payment details');
				}

				if (data.success && data.payment) {
					setPayment(data.payment as PaymentDetails);
				} else {
					throw new Error('Payment not found');
				}
			} catch (err: unknown) {
				if (err instanceof DOMException && err.name === 'AbortError') return;
				setError(err instanceof Error ? err.message : 'Failed to load payment details');
			} finally {
				setLoading(false);
			}
		};

		fetchPayment();
		return () => controller.abort();
	}, [id, user]);

	return (
		<div className={styles.pageContainer}>
			<Sidebar onLogout={onLogout} currentView="dashboard" />
			<main className={styles.mainContent}>
				<div className={styles.headerRow}>
					<div className={styles.backBtn}>
						<Back to={'/alumini/dashboard'} />
					</div>
				</div>

				{loading && <div className={styles.stateCard}>Loading payment details...</div>}
				{!loading && error && <div className={`${styles.stateCard} ${styles.errorCard}`}>{error}</div>}

				{!loading && !error && payment && (
					<section className={styles.detailCard}>
						<div className={styles.detailHeader}>
							<div>
								<p className={styles.kicker}>Donation Receipt</p>
								<h1 className={styles.title}>{formatAmount(payment.amount)}</h1>
								<p className={styles.subtitle}>{payment.purpose}</p>
							</div>
							<span className={`${styles.statusBadge} ${styles[`status_${getStatusLabel(payment.status)}`]}`}>
								{getStatusLabel(payment.status)}
							</span>
						</div>

						<div className={styles.metaGrid}>
							<div className={styles.metaItem}>
								<span className={styles.metaLabel}>Paid By</span>
								<span className={styles.metaValue}>{payment.user?.name || 'Unknown'}</span>
							</div>
							<div className={styles.metaItem}>
								<span className={styles.metaLabel}>Email</span>
								<span className={styles.metaValue}>{payment.user?.email || 'N/A'}</span>
							</div>
							<div className={styles.metaItem}>
								<span className={styles.metaLabel}>Date Created</span>
								<span className={styles.metaValue}>{formatDate(payment.createdAt)}</span>
							</div>
							<div className={styles.metaItem}>
								<span className={styles.metaLabel}>Paid Date</span>
								<span className={styles.metaValue}>{payment.paidAt ? formatDate(payment.paidAt) : 'Pending'}</span>
							</div>
							<div className={styles.metaItem}>
								<span className={styles.metaLabel}>Order ID</span>
								<span className={styles.metaValue}>{payment.razorpayOrderId}</span>
							</div>
							<div className={styles.metaItem}>
								<span className={styles.metaLabel}>Payment ID</span>
								<span className={styles.metaValue}>{payment.razorpayPaymentId || 'N/A'}</span>
							</div>
						</div>
					</section>
				)}
			</main>
		</div>
	);
};

export default Alumini_View_Donation;
