import styles from './AD_Alumini_form.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { DateInput } from '../../components/Calendar';

const Admin_Alumini_Form = ( { onLogout } ) => {

  return (
    <div className={styles.pageLayout}>
      
      {/* Sidebar */}
      <Sidebar onLogout={onLogout} currentView={'alumini'} />


      {/* Main Content Area */}
      <main className={styles.mainContent}>
          {/* Back Button */}
          <div className={styles.backButton} onClick={() => window.history.back()}>
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Back</span>
          </div>
        
        {/* Top Notification Banner */}
        <div className={styles.notificationBanner}>
          <div className={styles.notificationLeft}>
            <span className={`material-symbols-outlined ${styles.notifIcon}`}>notifications</span>
            <div className={styles.notifTextWrapper}>
              <span className={styles.badgeUpdate}>Update</span>
              <span className={styles.notifSender}>From: Alumni Office</span>
              <span className={styles.notifDivider}>|</span>
              <span className={styles.notifMessage}>Invitation: Virtual Networking Session</span>
            </div>
          </div>
          <button className={styles.expandBtn}>
            <span className="material-symbols-outlined">expand_more</span>
          </button>
        </div>

        <div className={styles.formContainer}>
          
          {/* Registration Status Section */}
          <section className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Registration Status</h2>
            <div className={styles.gridThreeCol}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Already a Member</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="member" className={styles.radioInput} />
                    <span>Yes</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="member" className={styles.radioInput} />
                    <span>No</span>
                  </label>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>New Registration</label>
                <input type="text" className={styles.textInput} />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Alumni Registration Number</label>
                <input type="text" className={styles.textInput} />
              </div>
            </div>
          </section>

          {/* Section 1: Personal Details */}
          <section className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Section 1: Personal Details</h2>
            <div className={styles.formStack}>
              
              <div className={styles.gridTwoCol}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Full Name</label>
                  <input type="text" className={styles.textInput} placeholder="e.g. Alexander Pierce" />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Father/Guardian Name</label>
                  <input type="text" className={styles.textInput} placeholder="e.g. Robert Pierce" />
                </div>
              </div>

              <div className={styles.gridThreeCol}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Date of Birth</label>
                  <DateInput theme="admin" className={styles.textInput} />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Years of Study (From)</label>
                  <select className={styles.selectInput}>
                    <option>Select Year</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>(To)</label>
                  <select className={styles.selectInput}>
                    <option>Select Year</option>
                  </select>
                </div>
              </div>

              <div className={styles.gridTwoCol}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Course / Branch</label>
                  <input type="text" className={styles.textInput} placeholder="e.g. B.E Computer Science and Engineering" />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Nick name (optional)</label>
                  <input type="text" className={styles.textInput} placeholder="e.g. Alex" />
                </div>
              </div>

              <div className={`${styles.gridTwoCol} ${styles.addressSection}`}>
                
                {/* Present Address */}
                <div className={styles.addressBox}>
                  <div className={styles.addressHeader}>
                    <span className="material-symbols-outlined">location_on</span>
                    <span>Present Address</span>
                  </div>
                  <div className={styles.addressFields}>
                    <input type="text" className={styles.textInput} placeholder="Street Address" />
                    <div className={styles.gridTwoColSmall}>
                      <input type="text" className={styles.textInput} placeholder="City" />
                      <input type="text" className={styles.textInput} placeholder="PIN Code" />
                    </div>
                    <input type="text" className={styles.textInput} placeholder="Mobile Number" />
                    <input type="email" className={styles.textInput} placeholder="Email Address" />
                  </div>
                </div>

                {/* Permanent Address */}
                <div className={styles.addressBox}>
                  <div className={styles.addressHeader}>
                    <span className="material-symbols-outlined">home</span>
                    <span>Permanent Address</span>
                  </div>
                  <div className={styles.addressFields}>
                    <input type="text" className={styles.textInput} placeholder="Street Address" />
                    <div className={styles.gridTwoColSmall}>
                      <input type="text" className={styles.textInput} placeholder="City" />
                      <input type="text" className={styles.textInput} placeholder="PIN Code" />
                    </div>
                    <input type="text" className={styles.textInput} placeholder="Mobile Number" />
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* Section 2: Qualifications & Employment */}
          <section className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Section 2: Qualifications & Employment</h2>
            <div className={styles.formStackLarge}>
              
              {/* Exams */}
              <div>
                <label className={styles.inputLabel}>Competitive Exams Cleared</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabelDisabled}>
                    <input type="radio" name="exam_cleared" disabled className={styles.radioInput} />
                    <span>Yes</span>
                  </label>
                  <label className={styles.radioLabelDisabled}>
                    <input type="radio" name="exam_cleared" disabled className={styles.radioInput} />
                    <span>No</span>
                  </label>
                </div>
                
                <div className={styles.examsBox}>
                  <p className={styles.examsBoxTitle}>Exams and Marks/Score</p>
                  <div className={styles.examsGrid}>
                    {['GRE', 'TOEFL', 'UPSC', 'GATE', 'IAS', 'Others'].map((exam) => (
                      <div key={exam} className={styles.examItem}>
                        <span className={styles.examName}>{exam}</span>
                        <input type="text" className={styles.examInput} placeholder="Marks" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* College Qualifications Table */}
              <div>
                <label className={styles.inputLabel}>College Qualifications</label>
                <div className={styles.tableWrapper}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Institution</th>
                        <th>Year of Passing</th>
                        <th>% of Marks</th>
                        <th>Board / University</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><input type="text" className={styles.tableInput} defaultValue="e.g. B.E" /></td>
                        <td><input type="text" className={styles.tableInput} defaultValue="KSRCE" /></td>
                        <td><input type="text" className={styles.tableInput} defaultValue="2018" /></td>
                        <td><input type="text" className={styles.tableInput} defaultValue="85%" /></td>
                        <td><input type="text" className={styles.tableInput} defaultValue="Anna University" /></td>
                      </tr>
                      <tr>
                        <td><input type="text" className={styles.tableInput} placeholder="..." /></td>
                        <td><input type="text" className={styles.tableInput} placeholder="..." /></td>
                        <td><input type="text" className={styles.tableInput} placeholder="..." /></td>
                        <td><input type="text" className={styles.tableInput} placeholder="..." /></td>
                        <td><input type="text" className={styles.tableInput} placeholder="..." /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Employment Details */}
              <div>
                <p className={styles.subSectionTitle}>Employment Details</p>
                <div className={styles.gridTwoCol}>
                  <div className={styles.inputGroup}>
                    <label className={styles.labelSmall}>Placement Type</label>
                    <div className={styles.radioGroupWrap}>
                      {['On-campus', 'Off-campus', 'Others', 'To be employed'].map(type => (
                         <label key={type} className={styles.radioLabel}>
                          <input type="radio" name="placement" className={styles.radioInput} />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.labelSmall}>Designation</label>
                    <input type="text" className={styles.textInput} placeholder="e.g. Software Engineer" />
                  </div>
                </div>
                
                <div className={styles.gridTwoColLargeGap}>
                  <div className={styles.inputGroup}>
                    <label className={styles.labelSmall}>Company Address</label>
                    <textarea className={styles.textareaInput} placeholder="Organization name and full address..." rows="3"></textarea>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.labelSmall}>Remarks</label>
                    <textarea className={styles.textareaInput} placeholder="Any specific remarks about employment..." rows="3"></textarea>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Section 3: Additional Info */}
          <section className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Section 3: Additional Info</h2>
            
            <div className={styles.gridTwoCol}>
              
              {/* Entrepreneur */}
              <div className={styles.formStack}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Have you become an entrepreneur?</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="entrepreneur" className={styles.radioInput} />
                      <span>Yes</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="entrepreneur" className={styles.radioInput} />
                      <span>No</span>
                    </label>
                  </div>
                </div>
                <input type="text" className={styles.textInputSm} placeholder="Name and Address of Organization" />
                <input type="text" className={styles.textInputSm} placeholder="Nature of work / Product" />
                <div className={styles.gridTwoColSmall}>
                  <input type="text" className={styles.textInputSm} placeholder="Annual Turnover" />
                  <input type="text" className={styles.textInputSm} placeholder="No. of Employees" />
                </div>
              </div>

              {/* Marital Status */}
              <div className={styles.formStack}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Marital Status</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="marital" className={styles.radioInput} />
                      <span>Single</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="marital" className={styles.radioInput} />
                      <span>Married</span>
                    </label>
                  </div>
                </div>
                <input type="text" className={styles.textInputSm} placeholder="Spouse Name" />
                <input type="text" className={styles.textInputSm} placeholder="Spouse Qualification" />
                <input type="text" className={styles.textInputSm} placeholder="No. of Children" />
              </div>

            </div>

            <div className={styles.textAreaGroup}>
              <label className={styles.inputLabel}>Extra-Curricular Activities</label>
              <textarea className={styles.textareaInput} placeholder="List your activities and achievements during or after college..." rows="4"></textarea>
            </div>

            <div className={styles.textAreaGroup}>
              <label className={styles.inputLabel}>Any Other Relevant Information</label>
              <textarea className={styles.textareaInput} placeholder="Provide any additional details you would like to share..." rows="4"></textarea>
            </div>

            {/* Alumni Known Table */}
            <div className={styles.textAreaGroup}>
              <label className={styles.inputLabel}>Alumni Details You Know (Optional)</label>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTableSm}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Degree</th>
                      <th>Batch</th>
                      <th>E-Mail</th>
                      <th>Phone/Mobile No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><input type="text" className={styles.tableInputSm} /></td>
                      <td><input type="text" className={styles.tableInputSm} /></td>
                      <td><input type="text" className={styles.tableInputSm} /></td>
                      <td><input type="text" className={styles.tableInputSm} /></td>
                      <td><input type="text" className={styles.tableInputSm} /></td>
                    </tr>
                    <tr>
                      <td><input type="text" className={styles.tableInputSm} /></td>
                      <td><input type="text" className={styles.tableInputSm} /></td>
                      <td><input type="text" className={styles.tableInputSm} /></td>
                      <td><input type="text" className={styles.tableInputSm} /></td>
                      <td><input type="text" className={styles.tableInputSm} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </section>

          {/* Submit Action */}
          <div className={styles.submitSection}>
            <button className={styles.submitBtn} type="button">
              Submit Information
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>

        </div>

      </main>
    </div>
  );
};

export default Admin_Alumini_Form;