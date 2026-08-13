import { useState, useEffect, FC } from 'react';
import { Link } from 'react-router-dom';
import styles from './Co_Feedback.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

interface FeedbackItem {
  id: string;
  name: string;
  content: string;
  date: string;
}

interface ApiFeedback {
  _id: string;
  submittedBy?: { name: string };
  reviewedBy?: string;
  visionIV?: { comment: string };
  missionIM?: { comment: string };
  peos?: { comment: string };
  date?: string;
  createdAt: string;
}

const formatDate = (dateString: string | number | Date): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
};

interface CoordinatorFeedbackHistoryProps {
  onLogout: () => void;
}

const CoordinatorFeedbackHistory: FC<CoordinatorFeedbackHistoryProps> = ({ onLogout }) => {
  const { user } = useAuth();
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchFeedbacks = async (): Promise<void> => {
      if (!user?.token) {
        setError('Please login to view feedbacks');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/feedback/department/all`, {
            signal: controller.signal,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch feedbacks');
        }

        const data = await response.json();

        if (data.success && data.feedbacks) {
          const formattedData: FeedbackItem[] = data.feedbacks.map((fb: ApiFeedback) => ({
            id: fb._id,
            name: fb.submittedBy?.name || fb.reviewedBy || 'Anonymous',
            content: `"${fb.visionIV?.comment || fb.missionIM?.comment || fb.peos?.comment || 'No comments provided.'}"`,
            date: formatDate(fb.date || fb.createdAt),
          }));
          setFeedbackData(formattedData);
        }
      } catch (err: any) {
          if (err.name === 'AbortError') return;
        setError(err.message || 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();

    return () => controller.abort();
  }, [user]);

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar currentView="feedback" onLogout={onLogout} />
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <div className={styles.loadingState}>Loading feedbacks...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar currentView="feedback" onLogout={onLogout} />
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <div className={styles.errorState}>{error}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Sidebar */}
      <Sidebar currentView="feedback" onLogout={onLogout} />
      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.pageHeader}>
            <h2 className={styles.pageTitle}>Alumni Feedback</h2>
            <div className={styles.titleDivider}></div>
          </div>

          <div className={styles.feedbackGrid}>
            {feedbackData.length > 0 ? (
              feedbackData.map((feedback) => (
                <div key={feedback.id} className={styles.feedbackCard}>
                  <div className={styles.cardBody}>
                    <h3 className={styles.authorName}>{feedback.name}</h3>
                    <p className={styles.feedbackQuote}>{feedback.content}</p>
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={styles.dateBadge}>{feedback.date}</span>
                    <Link className={styles.viewBtn} to={`/coordinator/view_feedback/${feedback.id}`}>
                      View <span className="material-symbols-outlined">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <span className="material-symbols-outlined">rate_review</span>
                <p>No feedbacks received yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoordinatorFeedbackHistory;
