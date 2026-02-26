import styles from './AD_Profile.module.css';
import Sidebar from './Components/Sidebar/Sidebar';

const Admin_Profile = ( { onLogout } ) => {
  // Contact Information Data
  const contactInfo = [
    { label: 'Name', value: 'Mohammed Ashik M' },
    { label: 'Designation', value: 'Administrator' },
    { label: 'Personal Email', value: 'ashik@example.com' },
    { label: 'Domain Email', value: 'admin.ashik@ksrce.ac.in' },
    { label: 'Branch', value: 'Computer Science' },
    { label: 'Mobile No', value: '+91 98765 43210' },
  ];

  // Administrative Info Data
  const adminInfo = [
    { label: 'Cabin No', value: 'C-204' },
    { label: 'Staff ID', value: 'KSRCE-882' },
  ];

  return (
    <div className={styles.pageLayout}>
      
      {/* Sidebar */}
        <Sidebar onLogout={onLogout} currentView={'profile'} />


      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          
          <header className={styles.pageHeader}>
            <h2 className={styles.pageTitle}>Admin Profile</h2>
            <p className={styles.pageSubtitle}>Manage your personal and institutional information</p>
          </header>

          <div className={styles.formContainer}>
            
            {/* Contact Information Section */}
            <section className={styles.cardContainer}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleGroup}>
                  <span className={`material-symbols-outlined ${styles.primaryText}`}>account_box</span>
                  <h3 className={styles.cardTitle}>Contact Information</h3>
                </div>
                <button className={styles.editBtn}>
                  Edit Profile
                </button>
              </div>
              <div className={styles.cardBody}>
                {contactInfo.map((info, index) => (
                  <div key={index} className={styles.infoRow}>
                    <span className={styles.infoLabel}>{info.label}</span>
                    <span className={styles.infoValue}>{info.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Administrative Info Section */}
            <section className={styles.cardContainer}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleGroup}>
                  <span className={`material-symbols-outlined ${styles.primaryText}`}>badge</span>
                  <h3 className={styles.cardTitle}>Administrative Info</h3>
                </div>
              </div>
              <div className={styles.cardBody}>
                {adminInfo.map((info, index) => (
                  <div key={index} className={styles.infoRow}>
                    <span className={styles.infoLabel}>{info.label}</span>
                    <span className={styles.infoValue}>{info.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Action Buttons */}
            <div className={styles.actionRow}>
              <button className={styles.discardBtn}>
                Discard
              </button>
              <button className={styles.saveBtn}>
                Save
              </button>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default Admin_Profile;