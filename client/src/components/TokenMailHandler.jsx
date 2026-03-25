import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TokenMailHandler = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tokenInfo, setTokenInfo] = useState(null);

    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        if (token) {
            validateToken();
        } else {
            setError('No token provided in URL');
            setLoading(false);
        }
    }, [token]);

    const validateToken = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${apiUrl}/api/tokens/validate/${token}`, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success && response.data.tokenInfo) {
                setTokenInfo(response.data.tokenInfo);
                setLoading(false);
            } else {
                setError('Invalid token response from server');
                setLoading(false);
            }
        } catch (error) {
            console.error('Token validation error:', error);

            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.code === 'ECONNABORTED') {
                setError('Request timed out. Please check your connection and try again.');
            } else if (error.response?.status === 404) {
                setError('Invalid, expired, or already used invitation link');
            } else if (error.response?.status === 429) {
                setError('Too many attempts. Please try again later.');
            } else {
                setError('Unable to validate invitation link. Please try again later.');
            }
            setLoading(false);
        }
    };

    const handleAccept = () => {
        navigate(`/mail/token/${token}/accept`, {
            state: {
                tokenInfo,
                recipientEmail: tokenInfo?.recipientEmail,
                mailTitle: tokenInfo?.mailTitle
            }
        });
    };

    const handleReject = () => {
        navigate(`/mail/token/${token}/reject`, {
            state: {
                tokenInfo,
                recipientEmail: tokenInfo?.recipientEmail,
                mailTitle: tokenInfo?.mailTitle
            }
        });
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loadingCard}>
                    <div style={styles.spinner}></div>
                    <h2 style={styles.loadingTitle}>Validating Invitation</h2>
                    <p style={styles.loadingText}>
                        Please wait while we verify your invitation link...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.errorCard}>
                    <div style={styles.errorIcon}>❌</div>
                    <h2 style={styles.errorTitle}>Invalid Invitation Link</h2>
                    <p style={styles.errorMessage}>{error}</p>
                    <div style={styles.errorActions}>
                        <p style={styles.helpText}>
                            If you believe this is an error, please contact the alumni office or ask for a new invitation link.
                        </p>
                        <button
                            onClick={() => window.location.href = '/'}
                            style={styles.homeButton}
                        >
                            Go to Home Page
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Token is valid - show action options
    return (
        <div style={styles.container}>
            <div style={styles.actionCard}>
                <h2 style={styles.actionTitle}>Invitation Response</h2>
                {tokenInfo?.mailTitle && (
                    <p style={styles.mailTitle}>{tokenInfo.mailTitle}</p>
                )}
                <p style={styles.actionText}>
                    Please choose your response to this invitation:
                </p>
                <div style={styles.buttonContainer}>
                    <button onClick={handleAccept} style={styles.acceptButton}>
                        Accept Invitation
                    </button>
                    <button onClick={handleReject} style={styles.rejectButton}>
                        Decline Invitation
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f7f9fc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
    },
    loadingCard: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e9f2',
        borderRadius: '10px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    errorCard: {
        backgroundColor: '#ffffff',
        border: '1px solid #fecaca',
        borderRadius: '10px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    actionCard: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e9f2',
        borderRadius: '10px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #f3f4f6',
        borderTop: '4px solid #16a34a',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px auto'
    },
    loadingTitle: {
        margin: '0 0 10px 0',
        fontSize: '24px',
        color: '#1f2937',
        fontWeight: '600'
    },
    loadingText: {
        margin: '10px 0',
        fontSize: '16px',
        color: '#6b7280',
        lineHeight: '1.5'
    },
    errorIcon: {
        fontSize: '48px',
        marginBottom: '20px',
        display: 'block'
    },
    errorTitle: {
        margin: '0 0 15px 0',
        fontSize: '24px',
        color: '#dc2626',
        fontWeight: '600'
    },
    errorMessage: {
        margin: '15px 0',
        fontSize: '16px',
        color: '#1f2937',
        lineHeight: '1.5'
    },
    errorActions: {
        marginTop: '30px'
    },
    helpText: {
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: '1.5',
        marginBottom: '20px'
    },
    homeButton: {
        backgroundColor: '#16a34a',
        color: '#ffffff',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-block',
        transition: 'background-color 0.2s'
    },
    actionTitle: {
        margin: '0 0 10px 0',
        fontSize: '24px',
        color: '#1f2937',
        fontWeight: '600'
    },
    mailTitle: {
        margin: '0 0 20px 0',
        fontSize: '16px',
        color: '#16a34a',
        fontWeight: '500'
    },
    actionText: {
        margin: '0 0 30px 0',
        fontSize: '16px',
        color: '#6b7280',
        lineHeight: '1.5'
    },
    buttonContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    acceptButton: {
        backgroundColor: '#16a34a',
        color: '#ffffff',
        border: 'none',
        padding: '14px 24px',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    },
    rejectButton: {
        backgroundColor: '#dc2626',
        color: '#ffffff',
        border: 'none',
        padding: '14px 24px',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    }
};

// Add CSS animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(styleSheet);

export default TokenMailHandler;