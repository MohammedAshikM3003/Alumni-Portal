import styles from './AD_BroadcastMessage.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Admin_BroadcastMessage = ({ onLogout, adminName, adminEmail }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get event data from Form 1 or draft data for editing
  const {
    eventName: initialEventName = '',
    eventDate: initialEventDate = '',
    eventLocation: initialEventLocation = '',
    alumniName: initialAlumniName = '',
    // Draft editing fields
    editDraft = false,
    draftId = null,
    alumniEmail: initialAlumniEmail = '',
    department: initialDepartment = '',
    batch: initialBatch = '',
    title: initialTitle = '',
    message: initialMessage = ''
  } = location.state || {};

  const [formData, setFormData] = useState({
    alumniName: initialAlumniName,
    department: initialDepartment,
    batchStart: initialBatch ? initialBatch.split('-')[0] : '',
    alumniEmail: initialAlumniEmail,
    eventName: initialEventName,
    eventDate: initialEventDate,
    eventLocation: initialEventLocation,
    title: initialTitle,
    message: initialMessage,
  });
  const [isPreMessageFormEnabled, setIsPreMessageFormEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [alumniPhoto, setAlumniPhoto] = useState(null);
  const [fetchingPhoto, setFetchingPhoto] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [formCleared, setFormCleared] = useState(false);

  // Calculate ending year (start year + 4)
  const batchEnd = formData.batchStart ? String(Number(formData.batchStart) + 4) : '';
  const batch = formData.batchStart && batchEnd ? `${formData.batchStart}-${batchEnd}` : '';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Check if form has meaningful content to save as draft
  const hasContentToSave = () => {
    return formData.title.trim() ||
           formData.message.trim() ||
           formData.alumniName.trim() ||
           formData.alumniEmail.trim() ||
           formData.department.trim();
  };

  // Auto-save draft silently
  const autoSaveDraft = async () => {
    if (formSent || formCleared || !hasContentToSave()) {
      return;
    }

    try {
      const draftPayload = {
        senderId: user?.userId || 'admin',
        senderName: adminName || user?.name || 'Admin',
        senderEmail: adminEmail || user?.email || '',
        recipientName: formData.alumniName.trim(),
        recipientEmail: formData.alumniEmail.trim(),
        department: formData.department.trim(),
        batch: batch,
        title: formData.title.trim(),
        content: formData.message.trim(),
        eventName: formData.eventName.trim(),
        eventDate: formData.eventDate,
        eventLocation: formData.eventLocation.trim(),
      };

      const url = editDraft && draftId
        ? `${API_BASE_URL}/api/drafts/${draftId}`
        : `${API_BASE_URL}/api/drafts`;
      const method = editDraft && draftId ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftPayload)
      });

    } catch (error) {
      console.error('Error auto-saving draft:', error);
    }
  };

  // Handle navigation back with auto-save
  const handleNavigateBack = async () => {
    if (hasContentToSave() && !formSent && !formCleared) {
      await autoSaveDraft();
    }
    window.history.back();
  };

  // Auto-save before page unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasContentToSave() && !formSent && !formCleared) {
        // Modern browsers ignore custom messages, but we still need to call preventDefault
        e.preventDefault();
        e.returnValue = '';

        // Try to save draft (this might not complete due to page unload)
        autoSaveDraft();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData, formSent, formCleared]);

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: '' });
    }, 5000);
  };

  const handleFormToggleChange = (e) => {
    setIsPreMessageFormEnabled(e.target.checked);
  };

  // Fetch alumni photo when name, department, and batch are filled
  useEffect(() => {
    const fetchAlumniPhoto = async () => {
      if (formData.alumniName && formData.department && batch) {
        setFetchingPhoto(true);
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/users/alumni/search?name=${encodeURIComponent(formData.alumniName)}&department=${encodeURIComponent(formData.department)}&batch=${encodeURIComponent(batch)}`,
            {
              headers: { 'Content-Type': 'application/json' }
            }
          );

          const data = await response.json();
          if (data.success && data.alumni) {
            setAlumniPhoto(data.alumni.profilePicture || null);
            // Auto-fill email if available
            if (data.alumni.email && !formData.alumniEmail) {
              setFormData(prev => ({ ...prev, alumniEmail: data.alumni.email }));
            }
          } else {
            setAlumniPhoto(null);
          }
        } catch (error) {
          console.error('Error fetching alumni photo:', error);
          setAlumniPhoto(null);
        } finally {
          setFetchingPhoto(false);
        }
      } else {
        setAlumniPhoto(null);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchAlumniPhoto();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.alumniName, formData.department, batch]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get trimmed values
    const alumniName = formData.alumniName.trim();
    const department = formData.department.trim();
    const alumniEmailValue = formData.alumniEmail.trim();
    const titleValue = formData.title.trim();
    const messageText = formData.message.trim();
    const startYear = String(formData.batchStart).trim();
    const endYear = batchEnd;

    // Validation
    if (!alumniName) {
      showAlert('Please enter Alumni Name', 'error');
      return;
    }
    if (!department) {
      showAlert('Please enter Department', 'error');
      return;
    }
    if (!startYear) {
      showAlert('Please enter Batch year', 'error');
      return;
    }
    if (!alumniEmailValue) {
      showAlert('Please enter Alumni Email', 'error');
      return;
    }
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(alumniEmailValue)) {
      showAlert('Please enter a valid email address', 'error');
      return;
    }
    if (!titleValue) {
      showAlert('Please enter a Subject/Title', 'error');
      return;
    }
    if (!messageText) {
      showAlert('Please enter a Message', 'error');
      return;
    }

    setLoading(true);

    try {
      // Send complete payload for mail API
      const emailPayload = {
        senderId: user?.userId,
        senderName: adminName || user?.name || 'Admin',
        senderEmail: adminEmail || user?.email,
        adminName: (adminName || user?.name || 'Admin').trim(),
        collegeName: 'K.S.R. College of Engineering',
        email: alumniEmailValue,
        title: titleValue,
        message: messageText,
        isBroadcast: false
      };

      const response = await fetch(`${API_BASE_URL}/api/mail/send-mail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // If editing a draft, delete it after successful send
        if (editDraft && draftId) {
          try {
            await fetch(`${API_BASE_URL}/api/drafts/${draftId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (deleteError) {
            console.error('Error deleting draft after send:', deleteError);
          }
        }

        setFormSent(true); // Mark as sent to prevent auto-save
        showAlert('Mail sent successfully!', 'success');
        resetForm();
      } else {
        showAlert(data.message || 'Failed to send mail', 'error');
      }
    } catch (error) {
      console.error('Error sending mail:', error);
      showAlert('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormCleared(true); // Mark as cleared to prevent auto-save
    setFormData({
      alumniName: '',
      department: '',
      batchStart: '',
      alumniEmail: '',
      eventName: '',
      eventDate: '',
      eventLocation: '',
      title: '',
      message: ''
    });
    setIsPreMessageFormEnabled(false);
    setAlumniPhoto(null);
    setFormSent(false);
    setFormCleared(false);
  };

  return (
    <div className={styles.container} style={{ height: '100vh', overflow: 'hidden' }}>
      <Sidebar onLogout={onLogout} currentView={'mail'} />

      <main
        className={styles.mainContent}
        style={{
          height: '100vh',
          overflowY: 'auto'
        }}
      >
        <div className={styles.headerRow}>
          <div className={styles.backButton} onClick={handleNavigateBack}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </div>

          <div className={styles.pageHeader}>
            <h1>{editDraft ? 'Edit Draft' : 'Send Mail to Alumni'}</h1>
            <p className={styles.subtitle}>
              {editDraft
                ? 'Edit and send your draft message'
                : 'Send email message to alumni • Draft auto-saved when navigating away'}
            </p>
          </div>

          <div className={styles.headerSpacer} aria-hidden="true"></div>
        </div>

        <div className={styles.eventFieldsTop}>
          <div className={styles.eventFieldsRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="eventName">Event Name</label>
              <input
                type="text"
                id="eventName"
                name="eventName"
                placeholder="Enter event name"
                className={styles.inputField}
                value={formData.eventName}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="eventDate">Date</label>
              <input
                type="date"
                id="eventDate"
                name="eventDate"
                className={styles.inputField}
                value={formData.eventDate}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="eventLocation">Location</label>
              <input
                type="text"
                id="eventLocation"
                name="eventLocation"
                placeholder="Enter location"
                className={styles.inputField}
                value={formData.eventLocation}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {alert.show && (
          <div className={`${styles.alert} ${styles[alert.type]}`}>
            <span className="material-symbols-outlined">
              {alert.type === 'success' ? 'check_circle' : alert.type === 'error' ? 'error' : 'info'}
            </span>
            <span>{alert.message}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.inputSection}>
            {/* Name, Department and Photo Row */}
            <div className={styles.photoNameRow}>
              {/* Alumni Name and Department - Left Side */}
              <div className={styles.fieldsSection}>
                <div className={styles.inputGroup}>
                  <label htmlFor="alumniName">
                    Alumni Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="alumniName"
                    name="alumniName"
                    placeholder="Enter alumni name"
                    className={styles.inputField}
                    value={formData.alumniName}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="department">
                    Department <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    placeholder="Enter department"
                    className={styles.inputField}
                    value={formData.department}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Alumni Photo - Right Side */}
              <div className={styles.photoSection}>
                <label>Alumni Photo</label>
                <div className={styles.photoDisplay}>
                  {fetchingPhoto ? (
                    <div className={styles.photoLoading}>
                      <span className={styles.spinner}></span>
                    </div>
                  ) : alumniPhoto ? (
                    <img
                      src={alumniPhoto}
                      alt="Alumni"
                      className={styles.alumniPhotoImg}
                    />
                  ) : (
                    <div className={styles.photoPlaceholder}>
                      <span className="material-symbols-outlined">person</span>
                      <span>No Photo</span>
                    </div>
                  )}
                </div>
                <div className={styles.helperText}>
                  Auto-fetched from database
                </div>
              </div>
            </div>

            <div className={styles.batchRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="batchStart">
                  Batch <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="batchStart"
                  name="batchStart"
                  placeholder="e.g., 2020"
                  className={styles.inputField}
                  value={formData.batchStart}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="batchEnd">
                  &nbsp;
                </label>
                <input
                  type="text"
                  id="batchEnd"
                  name="batchEnd"
                  className={`${styles.inputField} ${styles.readOnly}`}
                  value={batchEnd}
                  readOnly
                  disabled
                />
                <div className={styles.helperText}>Auto-calculated (+4 years)</div>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="alumniEmail">
                Alumni Email <span className={styles.required}>*</span>
              </label>
              <input
                type="email"
                id="alumniEmail"
                name="alumniEmail"
                placeholder="alumni@example.com"
                className={styles.inputField}
                value={formData.alumniEmail}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="title">
                Subject <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="Enter mail subject"
                className={styles.inputField}
                value={formData.title}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className={styles.optionalFormCard}>
              <div className={styles.optionalFormHeader}>
                <div className={styles.optionalFormTitleWrap}>
                  <h3>Form</h3>
                  <p>Enable or disable this form section before sending.</p>
                </div>

                <div className={styles.optionalFormControl}>
                  {isPreMessageFormEnabled && (
                    <div className={styles.outcomeStatus}>
                      <span className={styles.enabledText}>Form section enabled</span>
                    </div>
                  )}
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={isPreMessageFormEnabled}
                      onChange={handleFormToggleChange}
                      disabled={loading}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="message">
                Message <span className={styles.required}>*</span>
              </label>
              <textarea
                id="message"
                name="message"
                placeholder="Write your message here..."
                className={`${styles.inputField} ${styles.textarea}`}
                rows="10"
                value={formData.message}
                onChange={handleInputChange}
                disabled={loading}
              />
              <div className={styles.charCount}>{formData.message.length} characters</div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={resetForm}
              disabled={loading}
            >
              <span className="material-symbols-outlined">close</span>
              Clear Form
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Sending...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  Send Mail
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Admin_BroadcastMessage;
