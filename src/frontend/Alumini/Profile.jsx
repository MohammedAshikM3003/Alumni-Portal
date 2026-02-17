import { useState } from 'react';
import styles from './Profile.module.css';
import Sidebar from './Components/Sidebar/Sidebar.jsx';

const Profile = ({ onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Mohammed Ashik M',
    classYear: 'Class of 2018',
    designation: 'Senior Product Designer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    mobile: '+1 (555) 012-3456',
    email: 'mohammed.ashik@example.com',
    linkedin: 'linkedin.com/in/mohammed-ashik-m',
  });

  const profileDetails = [
    { id: 'designation', icon: 'badge', label: 'DESIGNATION' },
    { id: 'company', icon: 'domain', label: 'COMPANY' },
    { id: 'location', icon: 'location_on', label: 'LOCATION' },
    { id: 'mobile', icon: 'smartphone', label: 'MOBILE NO' },
    { id: 'email', icon: 'alternate_email', label: 'EMAIL ADDRESS' },
  ];

  const handleFieldChange = (field) => (event) => {
    setProfileData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    // TODO: Add API call here to persist changes.
    // Example: await updateProfile(profileData)
  };

  return (
    <div className={styles.pageContainer}>

      {/* Sidebar Navigation */}
      <Sidebar onLogout={onLogout} currentView={'profile'} />

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.profileCard}>
            
            {/* Profile Header (Avatar & Name) */}
            <div className={styles.profileHeader}>
              <div className={styles.avatarWrapper}>
                <img 
                  src="https://i.pravatar.cc/150?img=11" 
                  alt="Mohammed Ashik M" 
                  className={styles.avatarImage} 
                />
              </div>
              {isEditing ? (
                <input
                  className={styles.editInput}
                  value={profileData.name}
                  onChange={handleFieldChange('name')}
                />
              ) : (
                <h1 className={styles.userName}>{profileData.name}</h1>
              )}
              {isEditing ? (
                <input
                  className={styles.editInputSmall}
                  value={profileData.classYear}
                  onChange={handleFieldChange('classYear')}
                />
              ) : (
                <p className={styles.userClass}>{profileData.classYear}</p>
              )}
            </div>

            {/* Profile Details List */}
            <div className={styles.detailsList}>
              
              {/* Standard Rows */}
              {profileDetails.map((detail) => (
                <div className={styles.detailRow} key={detail.id}>
                  <div className={styles.iconWrapper}>
                    <span className="material-symbols-outlined">{detail.icon}</span>
                  </div>
                  <div className={styles.detailText}>
                    <p className={styles.detailLabel}>{detail.label}</p>
                    {isEditing ? (
                      <input
                        className={styles.editInputSmall}
                        value={profileData[detail.id]}
                        onChange={handleFieldChange(detail.id)}
                      />
                    ) : (
                      <p className={styles.detailValue}>{profileData[detail.id]}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Special LinkedIn Row */}
              <div className={styles.detailRow}>
                <div className={styles.iconWrapper}>
                  {/* Custom CSS LinkedIn box matching the design */}
                  <div className={styles.linkedinBox}>in</div>
                </div>
                <div className={styles.detailText}>
                  <p className={styles.detailLabel}>LINKEDIN PROFILE</p>
                  {isEditing ? (
                    <input
                      className={styles.editInputSmall}
                      value={profileData.linkedin}
                      onChange={handleFieldChange('linkedin')}
                    />
                  ) : (
                    <a href="#" className={styles.detailLink}>{profileData.linkedin}</a>
                  )}
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className={styles.cardActions}>
              <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={!isEditing}
              >
                Save
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;