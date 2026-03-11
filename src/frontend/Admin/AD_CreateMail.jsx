import styles from './AD_CreateMail.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useState } from 'react';
import { DateInput } from '../../components/Calendar';

const Admin_CreateMail = ({ onLogout }) => {
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

        {/* Controls Section */}
        <div className={styles.ctrlsection}>
          <section className={styles.controlsSection}>
            <button className={styles.formBtn}>Form</button>
            
            {/* Custom CSS Toggle Switch */}
            <label className={styles.toggleLabel}>
              <input 
                type="checkbox" 
                className={styles.toggleInput}
              />
              <div className={styles.toggleBg}></div>
            </label>
        </section>

        <section className={styles.controlsSection}>
          <button className={styles.formBtn}>Enable AI</button>
          
          {/* Custom CSS Toggle Switch */}
          <label className={styles.toggleLabel}>
            <input 
              type="checkbox" 
              className={styles.toggleInput}
              checked={isAIEnabled}
              onChange={(e) => setIsAIEnabled(e.target.checked)}
            />
            <div className={styles.toggleBg}></div>
          </label>
        </section>
        </div>

        {/* Event Card Section */}
        <section className={styles.eventSection}>
          {!showPreview ? (
            // Event Form
            <div className={styles.eventFormWrapper}>
                <div className={styles.formHeaderRow}>
                  <h3>Create Event Card</h3>
                  <button 
                    className={styles.previewBtn}
                    onClick={() => setShowPreview(true)}
                  >
                    Preview
                  </button>
                </div>
                <div className={styles.eventForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="event-title">Event Title</label>
                  <input 
                    type="text" 
                    id="event-title" 
                    name="title"
                    placeholder="Enter event title" 
                    className={styles.inputField}
                    value={eventData.title}
                    onChange={handleEventChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="event-date">Date</label>
                  <DateInput
                    theme="admin"
                    id="event-date" 
                    name="date"
                    className={styles.inputField}
                    value={eventData.date}
                    onChange={handleEventChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="event-location">Location</label>
                  <input 
                    type="text" 
                    id="event-location" 
                    name="location"
                    placeholder="Enter location" 
                    className={styles.inputField}
                    value={eventData.location}
                    onChange={handleEventChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="event-description">Description</label>
                  <textarea 
                    id="event-description" 
                    name="description"
                    placeholder="Enter event description" 
                    className={styles.inputField}
                    rows="4"
                    value={eventData.description}
                    onChange={handleEventChange}
                  />
                  {isAIEnabled && (
                    <button className={styles.generateBtn}>Write With AI</button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Event Card Display
            <div className={styles.eventCardWrapper}>
              <div className={styles.eventCard}>
              <div className={styles.eventHeader}>
                <h3>{eventData.title || 'Event Title Not Set'}</h3>
                <button 
                  className={styles.editBtn}
                  onClick={() => setShowPreview(false)}
                >
                  Edit Form
                </button>
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
              {/* Form Actions */}
              <div className={styles.formActions}>
                <button className={styles.discardBtn}>Discard</button>
                <button className={styles.submitBtn}>Submit</button>
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
};

export default Admin_CreateMail;