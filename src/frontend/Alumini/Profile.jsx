import { useState, useRef } from 'react';
import styles from './Profile.module.css';

import Cropper from 'react-easy-crop';
import Sidebar from './Components/Sidebar/Sidebar';
import { DateInput } from '../../components/Calendar';

const Alumini_Profile = ({ onLogout }) => {
  const fileInputRef = useRef(null);
  
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Details
    fullName: 'Mohammed Ashik M',
    fatherSpouseName: 'N/A',
    dob: '1996-06-15',
    yearFrom: '2014',
    yearTo: '2018',
    courseBranch: 'B.E. Computer Science',
    rollNumber: '14CSE052',
    presentAddress: '123 Green Meadow, Tiruchengode, Tamil Nadu - 637215',
    presentCity: 'San Francisco',
    presentPin: '94103',
    presentMobile: '+1 (555) 012-3456',
    presentEmail: 'mohammed.ashik@example.com',
    permanentAddress: '123 Green Meadow',
    permanentCity: 'Tiruchengode',
    permanentPin: '637215',
    // Qualifications
    gateScore: 'N/A',
    tancetScore: 'N/A',
    upscOthers: 'N/A',
    // Employment
    designation: 'Senior Product Designer',
    officeAddress: 'TechCorp Inc., One Market Street, San Francisco, CA',
    remarks: 'Updating profile for the alumni meet.',
    // Additional Info
    organizationName: 'TechCorp Inc.',
    natureOfWork: 'Software Development',
    annualTurnover: '50L',
    numEmployees: '200',
    spouseName: 'N/A',
    spouseQualification: 'N/A',
    numChildren: ''
  });

  const [signatureFile, setSignatureFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tempPreviewUrl, setTempPreviewUrl] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      setSignatureFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempPreviewUrl(event.target.result);
        setShowModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetImage = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const getCroppedImg = (imageSrc, pixelCrop) => {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );
        const base64Image = canvas.toDataURL('image/png');
        resolve(base64Image);
      };
      image.onerror = (error) => reject(error);
    });
  };

  const handleModalUpload = async () => {
    if (tempPreviewUrl && croppedAreaPixels) {
      try {
        const croppedImageBase64 = await getCroppedImg(tempPreviewUrl, croppedAreaPixels);
        setPreviewUrl(croppedImageBase64);
        setShowModal(false);
      } catch (e) {
        console.error('Error cropping image:', e);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTempPreviewUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      console.log('Form submitted:', formData);
      // TODO: Add API call to save profile
      setEditMode(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Sidebar onLogout={onLogout} currentView={'profile'} />
      
      <main className={styles.mainContent}>
        {/* Profile Header */}
        <section className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            <img 
              src="https://i.pravatar.cc/150?img=11" 
              alt="Mohammed Ashik M" 
              className={styles.avatarImage} 
            />
          </div>
          <h2 className={styles.userName}>Mohammed Ashik M</h2>
          <p className={styles.userClass}>Class of 2018</p>
        </section>

        {/* Comprehensive Form */}
        <form className={styles.formWrapper} onSubmit={handleSubmit}>
          
          {/* Registration Status Section */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Registration Status</h3>
            <div className={styles.gridThree}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Already a Member?</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="member_status" defaultChecked className={styles.radioInput} disabled={!editMode} />
                    <span>Yes</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="member_status" className={styles.radioInput} disabled={!editMode} />
                    <span>No</span>
                  </label>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>New Registration</label>
                <input type="text" placeholder="Enter status..." className={styles.input} readOnly={!editMode} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Alumni Registration Number</label>
                <input type="text" defaultValue="AL-2018-0452" className={styles.input} readOnly={!editMode} />
              </div>
            </div>
          </div>

          {/* Section 1: Personal Details */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Section 1: Personal Details</h3>
            <div className={styles.gridTwo}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name</label>
                <input 
                  type="text" 
                  value={formData.fullName} 
                  onChange={handleChange('fullName')}
                  className={styles.input} 
                  readOnly={!editMode}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Father / Spouse Name</label>
                <input 
                  type="text" 
                  value={formData.fatherSpouseName} 
                  onChange={handleChange('fatherSpouseName')}
                  className={styles.input} 
                  readOnly={!editMode}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Date of Birth</label>
                <DateInput
                  theme="alumni"
                  value={formData.dob} 
                  onChange={handleChange('dob')}
                  className={styles.input} 
                  readOnly={!editMode}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Years of Study</label>
                <div className={styles.yearRange}>
                  <select value={formData.yearFrom} onChange={handleChange('yearFrom')} className={styles.input} disabled={!editMode}>
                    <option>2014</option>
                    <option>2015</option>
                    <option>2016</option>
                  </select>
                  <span className={styles.yearSeparator}>to</span>
                  <select value={formData.yearTo} onChange={handleChange('yearTo')} className={styles.input} disabled={!editMode}>
                    <option>2018</option>
                    <option>2019</option>
                    <option>2020</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Course / Branch</label>
                <input 
                  type="text" 
                  value={formData.courseBranch} 
                  onChange={handleChange('courseBranch')}
                  className={styles.input} 
                  readOnly={!editMode}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Roll Number (Optional)</label>
                <input 
                  type="text" 
                  value={formData.rollNumber} 
                  onChange={handleChange('rollNumber')}
                  className={styles.input} 
                  readOnly={!editMode}
                />
              </div>
            </div>

            {/* Present Address */}
            <div className={styles.addressSection}>
              <h4 className={styles.subsectionTitle}>Present Address</h4>
              <div className={styles.gridThree}>
                <div className={styles.formGroup}>
                  <label className={styles.labelSmall}>Street Address</label>
                  <input 
                    type="text" 
                    value={formData.presentAddress} 
                    onChange={handleChange('presentAddress')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.labelSmall}>City</label>
                  <input 
                    type="text" 
                    value={formData.presentCity} 
                    onChange={handleChange('presentCity')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.labelSmall}>PIN Code</label>
                  <input 
                    type="text" 
                    value={formData.presentPin} 
                    onChange={handleChange('presentPin')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.labelSmall}>Mobile Number</label>
                  <input 
                    type="tel" 
                    value={formData.presentMobile} 
                    onChange={handleChange('presentMobile')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.spanTwo}`}>
                  <label className={styles.labelSmall}>Email Address</label>
                  <input 
                    type="email" 
                    value={formData.presentEmail} 
                    onChange={handleChange('presentEmail')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
              </div>
            </div>

            {/* Permanent Address */}
            <div className={styles.addressSection}>
              <h4 className={styles.subsectionTitle}>Permanent Address</h4>
              <div className={styles.gridFour}>
                <div className={`${styles.formGroup} ${styles.spanTwo}`}>
                  <label className={styles.labelSmall}>Street Address</label>
                  <input 
                    type="text" 
                    value={formData.permanentAddress} 
                    onChange={handleChange('permanentAddress')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.labelSmall}>City</label>
                  <input 
                    type="text" 
                    value={formData.permanentCity} 
                    onChange={handleChange('permanentCity')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.labelSmall}>PIN Code</label>
                  <input 
                    type="text" 
                    value={formData.permanentPin} 
                    onChange={handleChange('permanentPin')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
              </div>
            </div>

            {/* Signature Upload */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Upload Signature</label>
              <div className={styles.uploadBox} onClick={handleUploadClick}>
                {!previewUrl ? (
                  <span className="material-icons-outlined" style={{fontSize: '48px', color: '#9CA3AF', marginBottom: 8}}>cloud_upload</span>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}} onClick={e => e.stopPropagation()}>
                    <img src={previewUrl} alt="Signature Preview" className={styles.signaturePreview} style={{maxWidth: 220, maxHeight: 60, border: '1.5px solid #CBD5E1', borderRadius: 8, marginBottom: 8, background: '#fff'}} />
                    <button type="button" className={styles.clearBtn} onClick={() => setPreviewUrl(null)}>Clear</button>
                  </div>
                )}
                <p className={styles.uploadText} style={{marginTop: 8}}>Click to upload signature or drag and drop</p>
                <p className={styles.uploadSubtext}>PNG, JPG up to 2MB</p>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
              {showModal && (
                <div className={styles.modalContainer}>
                  <div className={styles.card}>
                    <div className={styles.header}>
                      <h2 className={styles.title}>Adjust E-Sign</h2>
                      <button className={styles.resetBtn} aria-label="Reset Image" onClick={handleResetImage}>
                        <span className="material-symbols-outlined">refresh</span>
                      </button>
                    </div>
                    <div className={styles.cropperArea} style={{ position: 'relative', width: '100%', height: '300px', backgroundColor: '#333', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
                      {tempPreviewUrl && (
                        <Cropper
                          image={tempPreviewUrl}
                          crop={crop}
                          zoom={zoom}
                          aspect={2 / 1}
                          onCropChange={setCrop}
                          onCropComplete={onCropComplete}
                          onZoomChange={setZoom}
                        />
                      )}
                    </div>
                    <div className={styles.modalFooter} style={{ display: 'flex', gap: '16px' }}>
                      <button className={styles.cancelBtn} onClick={handleCloseModal} style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFF', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                      <button className={styles.uploadBtn} onClick={handleModalUpload} style={{ flex: 2, padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#007BFF', color: '#FFF', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined">send</span>
                        Upload E-Sign
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Qualifications & Employment */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Section 2: Qualifications &amp; Employment</h3>
            
            {/* Competitive Exams */}
            <div className={styles.gridFour}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Competitive Exams Cleared?</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="exams_cleared" className={styles.radioInput} disabled={!editMode} />
                    <span>Yes</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="exams_cleared" defaultChecked className={styles.radioInput} disabled={!editMode} />
                    <span>No</span>
                  </label>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.labelSmall}>GATE Score</label>
                <input 
                  type="text" 
                  value={formData.gateScore} 
                  onChange={handleChange('gateScore')}
                  placeholder="-" 
                  className={styles.input} 
                  readOnly={!editMode}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.labelSmall}>TANCET Score</label>
                <input 
                  type="text" 
                  value={formData.tancetScore} 
                  onChange={handleChange('tancetScore')}
                  placeholder="-" 
                  className={styles.input} 
                  readOnly={!editMode}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.labelSmall}>UPSC/Others</label>
                <input 
                  type="text" 
                  value={formData.upscOthers} 
                  onChange={handleChange('upscOthers')}
                  placeholder="-" 
                  className={styles.input} 
                  readOnly={!editMode}
                />
              </div>
            </div>

            {/* Qualifications Table */}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
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
                    <td><input type="text" defaultValue="B.E. CSE" className={styles.tableInput} readOnly={!editMode} /></td>
                    <td><input type="text" defaultValue="KSRCE" className={styles.tableInput} readOnly={!editMode} /></td>
                    <td><input type="text" defaultValue="2018" className={styles.tableInput} readOnly={!editMode} /></td>
                    <td><input type="text" defaultValue="85%" className={styles.tableInput} readOnly={!editMode} /></td>
                    <td><input type="text" defaultValue="Anna University" className={styles.tableInput} readOnly={!editMode} /></td>
                  </tr>
                  <tr>
                    <td><input type="text" className={styles.tableInput} readOnly={!editMode} /></td>
                    <td><input type="text" className={styles.tableInput} readOnly={!editMode} /></td>
                    <td><input type="text" className={styles.tableInput} readOnly={!editMode} /></td>
                    <td><input type="text" className={styles.tableInput} readOnly={!editMode} /></td>
                    <td><input type="text" className={styles.tableInput} readOnly={!editMode} /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Employment Details */}
            <div className={styles.employmentSection}>
              <h4 className={styles.subsectionTitle}>Employment Details</h4>
              <div className={styles.gridTwo}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Placement Type</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="placement" defaultChecked className={styles.radioInput} disabled={!editMode} />
                      <span>On Campus</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="placement" className={styles.radioInput} disabled={!editMode} />
                      <span>Off Campus</span>
                    </label>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Designation</label>
                  <input 
                    type="text" 
                    value={formData.designation} 
                    onChange={handleChange('designation')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.spanTwo}`}>
                  <label className={styles.label}>Current Office Address</label>
                  <input 
                    type="text" 
                    value={formData.officeAddress} 
                    onChange={handleChange('officeAddress')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.spanTwo}`}>
                  <label className={styles.label}>Remarks</label>
                  <input 
                    type="text" 
                    value={formData.remarks} 
                    onChange={handleChange('remarks')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Additional Info */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Section 3: Additional Info</h3>
            <div className={styles.gridTwo}>
              {/* Left Column */}
              <div className={styles.column}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Have you become an entrepreneur?</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="entrepreneur" className={styles.radioInput} disabled={!editMode} />
                      <span>Yes</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="entrepreneur" defaultChecked className={styles.radioInput} disabled={!editMode} />
                      <span>No</span>
                    </label>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Name and Address of Organization</label>
                  <textarea 
                    rows="2" 
                    value={formData.organizationName} 
                    onChange={handleChange('organizationName')}
                    className={styles.textarea}
                    readOnly={!editMode}
                  ></textarea>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nature of Work / Product</label>
                  <input 
                    type="text" 
                    value={formData.natureOfWork} 
                    onChange={handleChange('natureOfWork')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={styles.gridTwoNested}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Annual Turnover</label>
                    <input 
                      type="text" 
                      value={formData.annualTurnover} 
                      onChange={handleChange('annualTurnover')}
                      className={styles.input} 
                      readOnly={!editMode}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>No. of Employees</label>
                    <input 
                      type="number" 
                      value={formData.numEmployees} 
                      onChange={handleChange('numEmployees')}
                      className={styles.input} 
                      readOnly={!editMode}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className={styles.column}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Marital Status</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="marital" className={styles.radioInput} disabled={!editMode} />
                      <span>Single</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="marital" className={styles.radioInput} disabled={!editMode} />
                      <span>Married</span>
                    </label>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Spouse Name</label>
                  <input 
                    type="text" 
                    value={formData.spouseName} 
                    onChange={handleChange('spouseName')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Spouse Qualification</label>
                  <input 
                    type="text" 
                    value={formData.spouseQualification} 
                    onChange={handleChange('spouseQualification')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>No. of Children</label>
                  <input 
                    type="number" 
                    value={formData.numChildren} 
                    onChange={handleChange('numChildren')}
                    className={styles.input} 
                    readOnly={!editMode}
                  />
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Role/Contribution to Alumnus (Activities like seminars/placements/funds/awards etc.)</label>
              <textarea 
                rows="4" 
                placeholder="Mention your contributions..." 
                className={styles.textarea}
                readOnly={!editMode}
              ></textarea>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Any Other Relevant Information</label>
              <textarea rows="3" className={styles.textarea} readOnly={!editMode}></textarea>
            </div>

            {/* Alumni Details Table */}
            <div className={styles.addressSection}>
              <h4 className={styles.subsectionTitle}>Alumni Details For Name Update</h4>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
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
                      <td><input type="text" defaultValue="James Wilson" className={styles.tableInput} readOnly={!editMode} /></td>
                      <td><input type="text" defaultValue="B.E CSE" className={styles.tableInput} readOnly={!editMode} /></td>
                      <td><input type="text" defaultValue="2018" className={styles.tableInput} readOnly={!editMode} /></td>
                      <td><input type="email" defaultValue="james.w@example.com" className={styles.tableInput} readOnly={!editMode} /></td>
                      <td><input type="tel" defaultValue="98844 12345" className={styles.tableInput} readOnly={!editMode} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => setEditMode(true)}
              disabled={editMode}
            >
              Edit Profile
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={!editMode}
            >
              Save
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Alumini_Profile;