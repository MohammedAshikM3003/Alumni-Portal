import styles from './AD_ViewMail.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useState } from 'react';

const Admin_ViewMail = ({ onLogout }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [eventData, setEventData] = useState({
    title: '',
    date: '',
    location: '',
    description: ''
  });

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className={styles.container}>
      
      {/* Sidebar */}
      <Sidebar onLogout={onLogout} currentView={'mail'} />
      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Back Button */}
        <div className={styles.backButton} onClick={() => window.history.back()}>
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back</span>
        </div>
        
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <h1>Alumni Mail</h1>
        </div>

        {/* Input Section */}
        <section className={styles.inputSection}>
          <div className={styles.inputGroup}>
            <label htmlFor="admin-email">Admin Email</label>
            <input 
              type="email" 
              id="admin-email" 
              placeholder="admin@ksrce.ac.in" 
              className={styles.inputField} 
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="alumni-name">Enter Alumni Name</label>
            <input 
              type="text" 
              id="alumni-name" 
              placeholder="Name" 
              className={styles.inputField} 
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="alumni-email">Alumni Email</label>
            <input 
              type="email" 
              id="alumni-email" 
              placeholder="example@email.com" 
              className={styles.inputField} 
            />
          </div>
        </section>


        {/* Event Card Section */}
        <section className={styles.eventSection}>
            <div className={styles.eventCardWrapper}>
              <div className={styles.eventCard}>
                <div className={styles.eventHeader}>
                  <h3>{eventData.title || 'Event Title Not Set'}</h3>
                </div>
                <div className={styles.eventMetadata}>
                  <div className={styles.metadataBlock}>
                    <span className={styles.metadataLabel}>Date</span>
                    <span className={styles.metadataValue}>{formatDate(eventData.date)}</span>
                  </div>
                  <div className={styles.metadataBlock}>
                    <span className={styles.metadataLabel}>Location</span>
                    <span className={styles.metadataValue}>{eventData.location || 'Location not specified'}</span>
                  </div>
                </div>
                <div className={styles.eventDescription}>
                  <span className={styles.metadataLabel}>Description</span>
                  <p>{eventData.description || 'No description provided yet.'}</p>
                </div>
              </div>
            </div>
        </section>

      </main>
    </div>
  );
};

export default Admin_ViewMail;