import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Al_JobReference_History.module.css';
import Sidebar from './Components/Sidebar/Sidebar';

const Alumini_JobReference_History = ({ onLogout }) => {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const navigate = useNavigate();
  const menuRef = useRef(null);


  const toggleCardMenu = (id, event) => {
    event.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.addEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mock data matching the screenshot
  const jobsData = [
    {
      id: 1,
      title: 'Senior Product Designer',
      company: 'Tech Global Solutions',
      date: 'Oct 24, 2023',
      status: 'ACTIVE',
      icon: 'work_outline',
      iconClass: styles.iconBlue
    },
    {
      id: 2,
      title: 'Marketing Specialist',
      company: 'Growth Partners Inc.',
      date: 'Oct 20, 2023',
      status: 'PENDING',
      icon: 'person_search',
      iconClass: styles.iconPurple
    },
    {
      id: 3,
      title: 'Research Assistant',
      company: 'National Science Inst.',
      date: 'Oct 15, 2023',
      status: 'CLOSED',
      icon: 'school',
      iconClass: styles.iconPurpleAlt
    },
    {
      id: 4,
      title: 'Full Stack Developer',
      company: 'Cloud Stream Systems',
      date: 'Oct 12, 2023',
      status: 'ACTIVE',
      icon: 'terminal',
      iconClass: styles.iconTeal
    },
    {
      id: 5,
      title: 'Data Scientist',
      company: 'Insight Analytics Lab',
      date: 'Oct 05, 2023',
      status: 'ACTIVE',
      icon: 'account_tree',
      iconClass: styles.iconPink
    },
    {
      id: 6,
      title: 'Customer Success Lead',
      company: 'Service First Corp',
      date: 'Sep 28, 2023',
      status: 'PENDING',
      icon: 'support_agent',
      iconClass: styles.iconLightBlue
    },
    {
      id: 7,
      title: 'Cyber Security Analyst',
      company: 'Secure Network Hub',
      date: 'Sep 20, 2023',
      status: 'ACTIVE',
      icon: 'security',
      iconClass: styles.iconGreen
    },
    {
      id: 8,
      title: 'Content Strategist',
      company: 'Creative Media Agency',
      date: 'Sep 15, 2023',
      status: 'CLOSED',
      icon: 'campaign',
      iconClass: styles.iconOrange
    }
  ];

  return (
    <div className={styles.pageContainer}>

      {/* Sidebar Navigation (Collapsed State as per image) */}
      <Sidebar onLogout={onLogout} currentView="job_reference_history" />

      {/* Main Content Area */}
      <main className={styles.mainContent}>

        {/* Page Header */}
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>Job & Reference History</h1>
          <p className={styles.pageSubtitle}>
            Manage your professional references and job postings.
          </p>
        </header>

        {/* Jobs Grid */}
        <div className={styles.jobsGrid} ref={menuRef}>
          
          {/* Post New Job Card (Dashed Border) */}
          <div className={`${styles.jobCard} ${styles.postNewCard}`} onClick={() => { navigate('/alumini/JobReference_History/JobReference_Form') }} >
            <div className={styles.addIconContainer}>
              <span className="material-symbols-outlined">add</span>
            </div>
            <h3 className={styles.postTitle}>Post Job or Reference</h3>
            <p className={styles.postSubtitle}>Share new opportunities with the network</p>
          </div>

          {/* Render Job Cards */}
          {jobsData.map((job) => (
            <div key={job.id} className={styles.jobCard}>
              
              {/* Card Header (Icon + Menu) */}
              <div className={styles.cardHeader}>
                <div className={`${styles.jobIcon} ${job.iconClass}`}>
                  <span className="material-symbols-outlined">{job.icon}</span>
                </div>
                
                <div className={styles.menuContainer}>
                  <button 
                    className={`${styles.moreBtn} ${activeMenuId === job.id ? styles.moreBtnActive : ''}`} 
                    onClick={(e) => toggleCardMenu(job.id, e)}
                  >
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {activeMenuId === job.id && (
                    <div className={styles.dropdownMenu}>
                      <button className={styles.dropdownItem}>
                        <span className="material-symbols-outlined">delete</span>
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Body (Title & Company) */}
              <div className={styles.cardBody}>
                <h3 className={styles.jobTitle}>{job.title}</h3>
                <p className={styles.companyName}>{job.company}</p>
              </div>

              {/* Card Footer (Status & Date) */}
              <div className={styles.cardFooter}>
                <span className={`${styles.statusBadge} ${styles[`status${job.status}`]}`}>
                  {job.status}
                </span>
                <span className={styles.jobDate}>{job.date}</span>
              </div>

            </div>
          ))}

        </div>
      </main>
    </div>
  );
};

export default Alumini_JobReference_History;