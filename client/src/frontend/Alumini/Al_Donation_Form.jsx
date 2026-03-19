import { useState } from 'react';
import styles from './Al_Donation_Form.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE = import.meta.env.VITE_API_URL;

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

const Alumini_DonationFormPage = ({ onLogout }) => {
    const { user } = useAuth();
  const [amount, setAmount] = useState('1000');
    const [purpose, setPurpose] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('upi');
    const [isPaying, setIsPaying] = useState(false);

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

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
                    method: selectedMethod,
                }),
            });

            const orderData = await orderRes.json();
            if (!orderRes.ok || !orderData?.order?.id) {
                throw new Error(orderData.message || 'Unable to create order');
            }

            const options = {
                key: orderData.keyId,
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: 'KSR Alumni Portal',
                description: 'Donation',
                order_id: orderData.order.id,
                prefill: {
                    name: user.name,
                    email: user.email,
                },
                notes: {
                    paymentMethod: selectedMethod,
                },
                handler: async (response) => {
                    try {
                        const verifyRes = await fetch(`${API_BASE}/api/payments/verify`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${user.token}`,
                            },
                            body: JSON.stringify(response),
                        });

                        const verifyData = await verifyRes.json();
                        if (!verifyRes.ok || !verifyData.success) {
                            throw new Error(verifyData.message || 'Payment verification failed');
                        }

                        alert('Payment successful. Thank you for your donation!');
                    } catch (error) {
                        alert(error.message || 'Payment verification failed');
                    } finally {
                        setIsPaying(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setIsPaying(false);
                    },
                },
                theme: {
                    color: '#0084D6',
                },
            };

            const razorpayCheckout = new window.Razorpay(options);
            razorpayCheckout.on('payment.failed', () => {
                setIsPaying(false);
                alert('Payment failed or cancelled. Please try again.');
            });
            razorpayCheckout.open();
        } catch (error) {
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
            <br />
                {/* Navigation Back */}
                <div className={styles.backButton} onClick={() => window.history.back()}>
                    <span className="material-symbols-outlined">arrow_back</span>
                    <span>Back</span>
                </div>
            <div className={styles.contentWrapper}>
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
                </div>

                {/* Payment Methods */}
                <div className={styles.methodSection}>
                    <label className={styles.inputLabel}>Select Payment Method</label>
                    <div className={styles.methodGrid}>
                    
                    <button 
                        className={`${styles.methodBtn} ${selectedMethod === 'upi' ? styles.methodActive : ''}`}
                        onClick={() => handleMethodSelect('upi')}
                    >
                        <span className="material-symbols-outlined">qr_code_scanner</span>
                        <span>UPI</span>
                    </button>

                    <button 
                        className={`${styles.methodBtn} ${selectedMethod === 'card' ? styles.methodActive : ''}`}
                        onClick={() => handleMethodSelect('card')}
                    >
                        <span className="material-symbols-outlined">credit_card</span>
                        <span>Credit/Debit Card</span>
                    </button>

                    <button 
                        className={`${styles.methodBtn} ${selectedMethod === 'netbanking' ? styles.methodActive : ''}`}
                        onClick={() => handleMethodSelect('netbanking')}
                    >
                        <span className="material-symbols-outlined">account_balance</span>
                        <span>Net Banking</span>
                    </button>

                    </div>
                </div>

                {/* Donate Button */}
                <button className={styles.donateSubmitBtn} onClick={handlePayment} disabled={isPaying}>
                    {isPaying ? 'Processing...' : 'Donate Now'}
                </button>

                {/* Security Badges */}
                <div className={styles.securityBadges}>
                    <div className={styles.badgeItem}>
                    <span className="material-symbols-outlined">verified_user</span>
                    <span>SSL SECURED</span>
                    </div>
                    <div className={styles.badgeDot}>•</div>
                    <div className={styles.badgeItem}>
                    <span className="material-symbols-outlined">gpp_good</span>
                    <span>VERIFIED TRANSACTION</span>
                    </div>
                </div>

                </div>
            </div>
        </main>
    </div>
  );
};

export default Alumini_DonationFormPage;