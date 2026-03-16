import { useState } from 'react';
import styles from './Al_Donation_Form.module.css';
import Sidebar from './Components/Sidebar/Sidebar';

const Alumini_DonationFormPage = ({ onLogout }) => {
  const [amount, setAmount] = useState('1000');
  const [selectedMethod, setSelectedMethod] = useState('upi');

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
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
                <button className={styles.donateSubmitBtn}>
                    Donate Now
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