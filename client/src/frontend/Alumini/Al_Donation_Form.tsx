import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Al_Donation_Form.module.css';
import './scrollbar.js';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';


const API_BASE = import.meta.env.VITE_API_URL;

const isTestMode = true;

declare global {
    interface Window {
        Razorpay: any;
    }
}

const parseApiResponse = async (response: Response) => {
    const raw = await response.text();

    if (!raw) {
        return {};
    }

    try {
        return JSON.parse(raw);
    } catch {
        return { message: raw };
    }
};

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

interface AluminiDonationFormPageProps {
    onLogout?: () => void;
}

const Alumini_DonationFormPage = ({ onLogout }: AluminiDonationFormPageProps) => {
    const { user } = useAuth();
        const navigate = useNavigate();
  const [amount, setAmount] = useState('1000');
    const [purpose, setPurpose] = useState('');
    const [isPaying, setIsPaying] = useState(false);

    const handlePayment = async () => {
        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        const trimmedPurpose = purpose.trim();
        if (!trimmedPurpose) {
            alert('Please enter the donation purpose.');
            return;
        }


        const testModeLimit = 50000; // ₹50,000 limit in test mode
        if (isTestMode && numericAmount > testModeLimit) {
            alert(`Test mode limit: Maximum ₹${testModeLimit.toLocaleString()} allowed.\n\nPlease use production keys for larger amounts.`);
            return;
        }

        if (!user?.token) {
            alert('Please login again to continue payment.');
            return;
        }

        setIsPaying(true);
        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                throw new Error('Unable to load Razorpay checkout. Check your internet connection.');
            }

            const orderRes = await fetch(`${API_BASE}/api/payments/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify({
                    purpose: trimmedPurpose,
                    amount: numericAmount,
                }),
            });

            const orderData = await parseApiResponse(orderRes);
            if (!orderRes.ok || !orderData?.order?.id) {
                console.error('Order creation failed:', orderData);
                throw new Error(orderData.message || 'Unable to create order');
            }

            console.log('Order created successfully:', orderData);

            if (!window.Razorpay) {
                throw new Error('Razorpay SDK not loaded properly');
            }

            const options = {
                key: orderData.keyId,
                amount: orderData.order.amount,
                currency: orderData.order.currency || 'INR',
                name: 'KSR Alumni Portal',
                description: trimmedPurpose,
                order_id: orderData.order.id,
                prefill: {
                    name: user.name || '',
                    email: user.email || '',
                },
                handler: async (response: any) => {
                    try {
                        console.log('Payment response received:', response);

                        const verifyRes = await fetch(`${API_BASE}/api/payments/verify`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${user.token}`,
                            },
                            body: JSON.stringify(response),
                        });

                        const verifyData = await parseApiResponse(verifyRes);
                        console.log('Verification response:', verifyData);

                        if (!verifyRes.ok || !verifyData.success) {
                            throw new Error(verifyData.message || 'Payment verification failed');
                        }

                        alert('Payment successful! Thank you for your donation.');
                        navigate('/alumini/donation_history');
                    } catch (error: any) {
                        console.error('Verification error:', error);
                        alert(error.message || 'Payment verification failed');
                    } finally {
                        setIsPaying(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        console.log('Payment modal dismissed');
                        setIsPaying(false);
                    },
                },
                theme: {
                    color: '#0084D6',
                },
            };

            const razorpayCheckout = new window.Razorpay(options);
            razorpayCheckout.on('payment.failed', (error: any) => {
                console.error('Payment failed:', error);
                setIsPaying(false);
                alert('Payment failed: ' + (error.reason || 'Please try again.'));
            });
            razorpayCheckout.open();
        } catch (error: any) {
            console.error('Payment error:', error);
            setIsPaying(false);
            alert(error.message || 'Failed to start payment');
        }
    };

  return (
    <div className={styles.pageContainer}>
        {/* Sidebar Navigation (Collapsed State as per image) */}
        <Sidebar onLogout={onLogout} currentView="donation_history" />

        
        {/* Main Content Area */}
        <main className={styles.mainContent}>
            <div className={styles.contentWrapper}>
                {/* Navigation Back */}
                <div className={styles.backButton} onClick={() => window.history.back()}>
                    <span className="material-symbols-outlined">arrow_back</span>
                    <span>Back</span>
                </div>
                {/* Header Section */}
                <header className={styles.header}>
                <h1 className={styles.pageTitle}>Donation for Independent Parent</h1>
                <p className={styles.pageSubtitle}>
                    Contribute to the well-being of our alumni community's independent parents.
                </p>
                </header>

                {/* Donation Form Card */}
                <div className={styles.formCard}>
                
                {/* Amount Input */}
                <div className={styles.inputSection}>
                    <label className={styles.inputLabel}>Title</label>
                    <input
                        type="text"
                        className={styles.purposeInput}
                        value={purpose}
                        maxLength={200}
                        placeholder="Enter donation title"
                        onChange={(e) => setPurpose(e.target.value)}
                    />
                </div>
                <div className={styles.inputSection}>
                    <label className={styles.inputLabel}>Enter Amount</label>
                    <div className={styles.inputWrapper}>
                    <span className={styles.currencySymbol}>₹</span>
                    <input
                        type="number"
                        className={styles.amountInput}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    </div>
                    {isTestMode && (
                        <p style={{fontSize: '12px', color: '#ff6b6b', marginTop: '8px'}}>
                            ⚠️ Test Mode: Maximum ₹50,000 allowed
                        </p>
                    )}
                </div>

                {/* Donate Button */}
                <button className={styles.donateSubmitBtn} onClick={handlePayment} disabled={isPaying}>
                    {isPaying ? 'Processing...' : 'Donate Now'}
                </button>



                </div>
            </div>
        </main>
    </div>
  );
};

export default Alumini_DonationFormPage;