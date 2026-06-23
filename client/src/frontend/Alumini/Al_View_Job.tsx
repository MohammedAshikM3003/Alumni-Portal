import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from './Al_View_Job.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import Back from '../Coordinator/Components/BackButton/Back';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

interface JobReference {
	_id: string;
	submittedBy?: {
		_id: string;
		name?: string;
		email?: string;
		userId?: string;
		profilePhoto?: string;
		jobRole?: string;
	};
	companyName: string;
	role: string;
	targetBranch: string;
	vacancies: number;
	location: string;
	workMode: 'offline' | 'online' | 'hybrid';
	status: 'pending' | 'approved' | 'rejected';
	createdAt: string;
	updatedAt: string;
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

const getStatusLabel = (status: JobReference['status']) => {
	switch (status) {
		case 'approved':
			return 'ACTIVE';
		case 'rejected':
			return 'CLOSED';
		default:
			return 'PENDING';
	}
};

	const statusOptions: Array<{ value: JobReference['status']; label: string; icon: string }> = [
	{ value: 'approved', label: 'Active', icon: 'work' },
	{ value: 'pending', label: 'Pending', icon: 'schedule' },
	{ value: 'rejected', label: 'Closed', icon: 'do_not_disturb_on' },
];

const Alumini_View_Job = ({ onLogout }: { onLogout: () => void }) => {
	const { id } = useParams();
	const { user } = useAuth();

	const [jobReference, setJobReference] = useState<JobReference | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [updatingStatus, setUpdatingStatus] = useState('');

	useEffect(() => {
		const controller = new AbortController();

		const fetchJobReference = async () => {
			if (!user?.token) {
				setError('Please login to view the posted job');
				setLoading(false);
				return;
			}

			if (!id) {
				setError('Job reference ID not provided');
				setLoading(false);
				return;
			}

			try {
				const response = await fetch(`${API_BASE}/api/jobs/${id}`, {
					signal: controller.signal,
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || 'Failed to fetch job reference');
				}

				if (data.success && data.jobReference) {
					setJobReference(data.jobReference as JobReference);
				} else {
					throw new Error('Job reference not found');
				}
			} catch (err: unknown) {
				if (err instanceof DOMException && err.name === 'AbortError') return;
				setError(err instanceof Error ? err.message : 'Failed to load job reference');
			} finally {
				setLoading(false);
			}
		};

		fetchJobReference();

		return () => controller.abort();
	}, [id, user]);

	const handleStatusChange = async (nextStatus: JobReference['status']) => {
		if (!jobReference || !user?.token) return;

		setUpdatingStatus(nextStatus);
		setError('');

		try {
			const response = await fetch(`${API_BASE}/api/jobs/${jobReference._id}/status`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${user.token}`,
				},
				body: JSON.stringify({ status: nextStatus }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Failed to update job status');
			}

			if (data.success && data.jobReference) {
				setJobReference(data.jobReference as JobReference);
			}
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to update job status');
		} finally {
			setUpdatingStatus('');
		}
	};

	return (
		<div className={styles.pageContainer}>
			<Sidebar onLogout={onLogout} currentView="job_reference_history" />

			<main className={styles.mainContent}>
				<div className={styles.headerRow}>
					<div className={styles.backBtn}>
						<Back to={'/alumini/JobReference_History'} />
					</div>
				</div>

				{loading && <div className={styles.stateCard}>Loading job details...</div>}

				{!loading && error && <div className={`${styles.stateCard} ${styles.errorCard}`}>{error}</div>}

				{!loading && !error && jobReference && (
					<section className={styles.detailCard}>
						<div className={styles.detailHeader}>
							<div>
								<p className={styles.kicker}>Posted Job</p>
								<h1 className={styles.title}>{jobReference.role}</h1>
								<p className={styles.subtitle}>{jobReference.companyName}</p>
							</div>

							<span className={`${styles.statusBadge} ${styles[`status_${getStatusLabel(jobReference.status)}`]}`}>
								{getStatusLabel(jobReference.status)}
							</span>
						</div>

						<div className={styles.metaGrid}>
							<div className={styles.metaItem}>
								<span className={styles.metaLabel}>Submitted by</span>
								<span className={styles.metaValue}>{jobReference.submittedBy?.name || 'Unknown'}</span>
							</div>
							<div className={styles.metaItem}>
								<span className={styles.metaLabel}>Date posted</span>
								<span className={styles.metaValue}>{formatDate(jobReference.createdAt)}</span>
							</div>
							<div className={styles.metaItem}>
								<span className={styles.metaLabel}>Target branch</span>
								<span className={styles.metaValue}>{jobReference.targetBranch}</span>
							</div>
							<div className={styles.metaItem}>
								<span className={styles.metaLabel}>Vacancies</span>
								<span className={styles.metaValue}>{String(jobReference.vacancies).padStart(2, '0')}</span>
							</div>
							<div className={styles.metaItem}>
								<span className={styles.metaLabel}>Location</span>
								<span className={styles.metaValue}>{jobReference.location}</span>
							</div>
							<div className={styles.metaItem}>
								<span className={styles.metaLabel}>Work mode</span>
								<span className={styles.metaValue}>{jobReference.workMode}</span>
							</div>
						</div>

						<div className={styles.statusSection}>
							<div>
								<p className={styles.statusSectionTitle}>Change status</p>
								<p className={styles.statusSectionText}>Update how this posting appears to the alumni network.</p>
							</div>

							<div className={styles.statusOptions}>
								{statusOptions.map((option) => {
									const isSelected = jobReference.status === option.value;

									return (
										<button
											key={option.value}
											type="button"
											className={`${styles.statusOption} ${isSelected ? styles.statusOptionActive : ''}`}
											onClick={() => handleStatusChange(option.value)}
											disabled={updatingStatus === option.value}
										>
											<span className="material-symbols-outlined">{option.icon}</span>
											<span>{updatingStatus === option.value ? 'Updating...' : option.label}</span>
										</button>
									);
								})}
							</div>
						</div>

						<div className={styles.footerNote}>
							Posted by {jobReference.submittedBy?.name || 'Alumni'} • Last updated {formatDate(jobReference.updatedAt || jobReference.createdAt)}
						</div>
					</section>
				)}
			</main>
		</div>
	);
};

export default Alumini_View_Job;
