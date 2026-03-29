import styles from './AD_Draft.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { Send } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Default alumni entry structure
const createEmptyAlumniEntry = () => ({
  alumniName: '',
  department: '',
  batchStart: '',
  alumniEmail: '',
  alumniPhoto: null,
  matchedAlumni: [],
  showEmailDropdown: false,
  fetchingPhoto: false
});

const Admin_Draft = ({ onLogout, adminName, adminEmail }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const draftId = location.state?.draftId;

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [isEventFormEnabled, setIsEventFormEnabled] = useState(false);

  // Alumni entries array
  const [alumniEntries, setAlumniEntries] = useState([createEmptyAlumniEntry()]);

  // Shared form data (event info, subject, message)
  const [sharedData, setSharedData] = useState({
    eventName: '',
    eventDate: '',
    eventVenue: '',
    eventTime: '',
    title: '',
    message: '',
    senderName: ''
  });

  // Helper function to get cookie value
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  useEffect(() => {
    if (draftId) {
      fetchDraft();
    } else {
      setLoading(false);
    }
  }, [draftId]);

  // Fetch events from the database
  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const token = getCookie('token') || user?.token;
        const response = await fetch(`${API_BASE_URL}/api/events`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };

    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchDraft = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/drafts/${draftId}`, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        const draft = data.draft;

        // Check if draft has multiple recipients
        if (draft.recipients && draft.recipients.length > 0) {
          // Load all recipients from the recipients array
          const entries = draft.recipients.map(recipient => ({
            alumniName: recipient.name || '',
            department: recipient.department || '',
            batchStart: recipient.batch ? recipient.batch.split('-')[0] : '',
            alumniEmail: recipient.email || '',
            alumniPhoto: null,
            matchedAlumni: [],
            showEmailDropdown: false,
            fetchingPhoto: false
          }));
          setAlumniEntries(entries);
        } else {
          // Fallback to legacy single recipient fields
          const batchStart = draft.batch ? draft.batch.split('-')[0] : '';
          setAlumniEntries([{
            alumniName: draft.recipientName || '',
            department: draft.department || '',
            batchStart: batchStart,
            alumniEmail: draft.recipientEmail || '',
            alumniPhoto: null,
            matchedAlumni: [],
            showEmailDropdown: false,
            fetchingPhoto: false
          }]);
        }

        // Parse event location to extract venue and time
        let eventVenue = '';
        let eventTime = '';
        if (draft.eventLocation) {
          const parts = draft.eventLocation.split(' | ');
          eventVenue = parts[0] || '';
          eventTime = parts[1] || '';
        }

        // Set shared data
        setSharedData({
          eventName: draft.eventName || '',
          eventDate: draft.eventDate ? new Date(draft.eventDate).toISOString().split('T')[0] : '',
          eventVenue: eventVenue,
          eventTime: eventTime,
          title: draft.title || '',
          message: draft.content || '',
          senderName: draft.senderName || ''
        });

        // Enable event form if event data exists
        if (draft.eventName) {
          setIsEventFormEnabled(true);
        }
      }
    } catch (err) {
      console.error('Error fetching draft:', err);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: '' });
    }, 5000);
  };

  // Calculate ending year for a specific alumni entry
  const getBatchEnd = (batchStart) => batchStart ? String(Number(batchStart) + 4) : '';
  const getBatch = (batchStart) => {
    const batchEnd = getBatchEnd(batchStart);
    return batchStart && batchEnd ? `${batchStart}-${batchEnd}` : '';
  };

  // Handle event selection from dropdown
  const handleEventSelect = (e) => {
    const selectedEventId = e.target.value;
    if (!selectedEventId) {
      setSharedData(prev => ({
        ...prev,
        eventName: '',
        eventDate: '',
        eventVenue: '',
        eventTime: ''
      }));
      return;
    }

    const selectedEvent = events.find(event => event._id === selectedEventId);
    if (selectedEvent) {
      let formattedDate = '';
      if (selectedEvent.eventDate) {
        const date = new Date(selectedEvent.eventDate);
        formattedDate = date.toISOString().split('T')[0];
      }

      setSharedData(prev => ({
        ...prev,
        eventName: selectedEvent.eventName,
        eventDate: formattedDate,
        eventVenue: selectedEvent.venue || '',
        eventTime: selectedEvent.eventTime || ''
      }));
    }
  };

  // Handle alumni-specific input changes
  const handleAlumniInputChange = (index, e) => {
    const { name, value } = e.target;

    // Check for duplicate email when email changes
    if (name === 'alumniEmail' && value.trim()) {
      const isDuplicate = checkDuplicateEmail(value, index);
      if (isDuplicate) {
        showAlert(`This email is already added for another alumni. Please use a different email.`, 'error');
        return;
      }
    }

    setAlumniEntries(prev => prev.map((entry, i) =>
      i === index ? { ...entry, [name]: value } : entry
    ));
  };

  // Handle shared data input changes
  const handleSharedInputChange = (e) => {
    const { name, value } = e.target;
    setSharedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add new alumni entry
  const handleAddAlumni = () => {
    setAlumniEntries(prev => [...prev, createEmptyAlumniEntry()]);
  };

  // Remove alumni entry
  const handleRemoveAlumni = (index) => {
    if (alumniEntries.length > 1) {
      setAlumniEntries(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Check for duplicate email addresses
  const checkDuplicateEmail = (email, currentIndex) => {
    if (!email.trim()) return false;
    return alumniEntries.some((entry, index) =>
      index !== currentIndex &&
      entry.alumniEmail.trim().toLowerCase() === email.trim().toLowerCase()
    );
  };

  // Get duplicate emails info
  const getDuplicateEmailsInfo = () => {
    const duplicateEmails = new Map();
    alumniEntries.forEach((entry, index) => {
      if (entry.alumniEmail.trim()) {
        const email = entry.alumniEmail.trim().toLowerCase();
        if (!duplicateEmails.has(email)) {
          duplicateEmails.set(email, []);
        }
        duplicateEmails.get(email).push(index);
      }
    });

    const duplicates = new Map();
    for (const [email, indices] of duplicateEmails.entries()) {
      if (indices.length > 1) {
        duplicates.set(email, indices);
      }
    }
    return duplicates;
  };

  // Replace placeholders and first alumni's data with each recipient's data
  const personalizeContent = (text, entry, firstEntry) => {
    const batchEnd = getBatchEnd(entry.batchStart);
    const batch = entry.batchStart ? `${entry.batchStart}-${batchEnd}` : '';

    const firstBatchEnd = getBatchEnd(firstEntry.batchStart);
    const firstBatch = firstEntry.batchStart ? `${firstEntry.batchStart}-${firstBatchEnd}` : '';

    let personalizedText = text;

    // Replace first alumni's actual data with current alumni's data (case-insensitive)
    if (firstEntry.alumniName.trim() && entry.alumniName.trim() !== firstEntry.alumniName.trim()) {
      const nameRegex = new RegExp(firstEntry.alumniName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      personalizedText = personalizedText.replace(nameRegex, entry.alumniName.trim());
    }

    if (firstEntry.department.trim() && entry.department.trim() !== firstEntry.department.trim()) {
      const deptRegex = new RegExp(firstEntry.department.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      personalizedText = personalizedText.replace(deptRegex, entry.department.trim());
    }

    if (firstBatch && batch !== firstBatch) {
      const batchRegex = new RegExp(firstBatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      personalizedText = personalizedText.replace(batchRegex, batch);
    }

    if (firstEntry.batchStart.trim() && entry.batchStart.trim() !== firstEntry.batchStart.trim()) {
      const yearRegex = new RegExp(firstEntry.batchStart.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      personalizedText = personalizedText.replace(yearRegex, entry.batchStart.trim());
    }

    if (firstEntry.alumniEmail.trim() && entry.alumniEmail.trim() !== firstEntry.alumniEmail.trim()) {
      const emailRegex = new RegExp(firstEntry.alumniEmail.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      personalizedText = personalizedText.replace(emailRegex, entry.alumniEmail.trim());
    }

    return personalizedText;
  };

  const handleEventFormToggleChange = (e) => {
    setIsEventFormEnabled(e.target.checked);
    if (!e.target.checked) {
      setSharedData(prev => ({
        ...prev,
        eventName: '',
        eventDate: '',
        eventVenue: '',
        eventTime: ''
      }));
    }
  };

  // Fetch alumni by name, department, and batch for a specific entry
  const fetchAlumniByDetails = async (index) => {
    const entry = alumniEntries[index];
    const batch = getBatch(entry.batchStart);

    if (entry.alumniName && entry.department && batch) {
      setAlumniEntries(prev => prev.map((e, i) =>
        i === index ? { ...e, fetchingPhoto: true } : e
      ));

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/users/alumni/search-all?name=${encodeURIComponent(entry.alumniName)}&department=${encodeURIComponent(entry.department)}&batch=${encodeURIComponent(batch)}`,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );

        const data = await response.json();
        if (data.success && data.alumni) {
          if (Array.isArray(data.alumni) && data.alumni.length > 1) {
            setAlumniEntries(prev => prev.map((e, i) =>
              i === index ? {
                ...e,
                matchedAlumni: data.alumni,
                showEmailDropdown: true,
                alumniPhoto: null,
                fetchingPhoto: false
              } : e
            ));
          } else {
            const alumni = Array.isArray(data.alumni) ? data.alumni[0] : data.alumni;
            const photoUrl = alumni.profilePicture
              ? (alumni.profilePicture.startsWith('http') ? alumni.profilePicture : `${API_BASE_URL}${alumni.profilePicture}`)
              : null;

            setAlumniEntries(prev => prev.map((e, i) =>
              i === index ? {
                ...e,
                matchedAlumni: [alumni],
                showEmailDropdown: false,
                alumniPhoto: photoUrl,
                alumniEmail: e.alumniEmail || alumni.email || '',
                fetchingPhoto: false
              } : e
            ));
          }
        } else {
          setAlumniEntries(prev => prev.map((e, i) =>
            i === index ? {
              ...e,
              matchedAlumni: [],
              showEmailDropdown: false,
              alumniPhoto: null,
              fetchingPhoto: false
            } : e
          ));
        }
      } catch (error) {
        console.error('Error fetching alumni:', error);
        setAlumniEntries(prev => prev.map((e, i) =>
          i === index ? {
            ...e,
            matchedAlumni: [],
            showEmailDropdown: false,
            alumniPhoto: null,
            fetchingPhoto: false
          } : e
        ));
      }
    } else {
      setAlumniEntries(prev => prev.map((e, i) =>
        i === index ? {
          ...e,
          matchedAlumni: [],
          showEmailDropdown: false,
          alumniPhoto: null
        } : e
      ));
    }
  };

  // Fetch alumni by email for a specific entry
  const fetchAlumniByEmail = async (index) => {
    const entry = alumniEntries[index];

    if (entry.alumniEmail && !entry.matchedAlumni.find(a => a.email === entry.alumniEmail)) {
      setAlumniEntries(prev => prev.map((e, i) =>
        i === index ? { ...e, fetchingPhoto: true } : e
      ));

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/users/alumni/by-email?email=${encodeURIComponent(entry.alumniEmail)}`,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );

        const data = await response.json();
        if (data.success && data.alumni) {
          const photoUrl = data.alumni.profilePicture
            ? (data.alumni.profilePicture.startsWith('http') ? data.alumni.profilePicture : `${API_BASE_URL}${data.alumni.profilePicture}`)
            : null;

          setAlumniEntries(prev => prev.map((e, i) =>
            i === index ? {
              ...e,
              alumniPhoto: photoUrl,
              alumniName: e.alumniName || data.alumni.name || '',
              department: e.department || data.alumni.branch || '',
              batchStart: e.batchStart || (data.alumni.batch ? data.alumni.batch.split('-')[0] : ''),
              fetchingPhoto: false
            } : e
          ));
        } else {
          setAlumniEntries(prev => prev.map((e, i) =>
            i === index ? { ...e, fetchingPhoto: false } : e
          ));
        }
      } catch (error) {
        console.error('Error fetching alumni by email:', error);
        setAlumniEntries(prev => prev.map((e, i) =>
          i === index ? { ...e, fetchingPhoto: false } : e
        ));
      }
    }
  };

  // Debounced fetch for alumni details
  useEffect(() => {
    const timeouts = alumniEntries.map((entry, index) => {
      const batch = getBatch(entry.batchStart);
      if (entry.alumniName && entry.department && batch) {
        return setTimeout(() => {
          fetchAlumniByDetails(index);
        }, 500);
      }
      return null;
    });

    return () => {
      timeouts.forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [alumniEntries.map(e => `${e.alumniName}-${e.department}-${e.batchStart}`).join(',')]);

  // Debounced fetch for alumni by email
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const timeouts = alumniEntries.map((entry, index) => {
      if (emailRegex.test(entry.alumniEmail)) {
        return setTimeout(() => {
          fetchAlumniByEmail(index);
        }, 500);
      }
      return null;
    });

    return () => {
      timeouts.forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [alumniEntries.map(e => e.alumniEmail).join(',')]);

  // Handle email selection from dropdown for a specific entry
  const handleEmailSelect = (index, e) => {
    const selectedEmail = e.target.value;
    const entry = alumniEntries[index];
    const selectedAlumni = entry.matchedAlumni.find(a => a.email === selectedEmail);

    if (selectedAlumni) {
      const isDuplicate = checkDuplicateEmail(selectedEmail, index);
      if (isDuplicate) {
        showAlert(`This email is already added for another alumni. Please select a different alumni.`, 'error');
        return;
      }

      const photoUrl = selectedAlumni.profilePicture
        ? (selectedAlumni.profilePicture.startsWith('http') ? selectedAlumni.profilePicture : `${API_BASE_URL}${selectedAlumni.profilePicture}`)
        : null;

      setAlumniEntries(prev => prev.map((e, i) =>
        i === index ? {
          ...e,
          alumniEmail: selectedEmail,
          alumniPhoto: photoUrl,
          showEmailDropdown: false
        } : e
      ));
    }
  };

  // Generate email content using AI
  const handleGenerateEmail = async () => {
    const firstEntry = alumniEntries[0];
    if (!firstEntry.alumniName.trim()) {
      showAlert('Please enter Alumni Name to generate email', 'error');
      return;
    }
    if (!adminName && !user?.name) {
      showAlert('Sender name is required to generate email', 'error');
      return;
    }

    setGeneratingEmail(true);

    try {
      const token = getCookie('token') || user?.token;
      const batchEnd = getBatchEnd(firstEntry.batchStart);

      const payload = {
        alumniName: firstEntry.alumniName.trim(),
        department: firstEntry.department.trim(),
        batch: firstEntry.batchStart ? `${firstEntry.batchStart}-${batchEnd}` : '',
        senderName: adminName || user?.name || 'Admin',
        collegeName: 'K.S.R. College of Engineering',
        purpose: 'Alumni outreach and engagement',
        eventDetails: isEventFormEnabled ? {
          eventName: sharedData.eventName.trim(),
          eventDate: sharedData.eventDate,
          eventVenue: sharedData.eventVenue.trim(),
          eventTime: sharedData.eventTime.trim()
        } : null,
        additionalContext: sharedData.message.trim() || 'General alumni communication'
      };

      const response = await fetch(`${API_BASE_URL}/api/ai/generate-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const aiContent = data.data;
        const subjectMatch = aiContent.match(/Subject:\s*(.+)$/m);
        const emailBodyMatch = aiContent.match(/Email Body:\s*([\s\S]+)$/);

        let newSubject = sharedData.title;
        let newMessage = aiContent;

        if (subjectMatch) {
          newSubject = subjectMatch[1].trim();
          newMessage = aiContent.replace(/Subject:\s*.+$/m, '').trim();
        }

        if (emailBodyMatch) {
          newMessage = emailBodyMatch[1].trim();
        }

        setSharedData(prev => ({
          ...prev,
          title: newSubject,
          message: newMessage
        }));

        showAlert('Email content generated successfully!', 'success');
      } else {
        const errorMsg = data.error || 'Failed to generate email content';
        if (errorMsg.includes('Ollama service is not running')) {
          showAlert('AI service is currently unavailable. Please try again later.', 'error');
        } else {
          showAlert(errorMsg, 'error');
        }
      }
    } catch (error) {
      console.error('Error generating email:', error);
      showAlert('Network error. Please check your connection and try again.', 'error');
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleSendNow = async (e) => {
    e.preventDefault();

    // Validate all alumni entries
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let i = 0; i < alumniEntries.length; i++) {
      const entry = alumniEntries[i];
      const entryNum = alumniEntries.length > 1 ? ` (Entry ${i + 1})` : '';

      if (!entry.alumniName.trim()) {
        showAlert(`Please enter Alumni Name${entryNum}`, 'error');
        return;
      }
      if (!entry.department.trim()) {
        showAlert(`Please enter Department${entryNum}`, 'error');
        return;
      }
      if (!entry.batchStart.trim()) {
        showAlert(`Please enter Batch year${entryNum}`, 'error');
        return;
      }
      if (!entry.alumniEmail.trim()) {
        showAlert(`Please enter Alumni Email${entryNum}`, 'error');
        return;
      }
      if (!emailRegex.test(entry.alumniEmail.trim())) {
        showAlert(`Please enter a valid email address${entryNum}`, 'error');
        return;
      }
    }

    if (!sharedData.title.trim()) {
      showAlert('Please enter a Subject/Title', 'error');
      return;
    }
    if (!sharedData.message.trim()) {
      showAlert('Please enter a Message', 'error');
      return;
    }

    // Check for duplicate emails
    const duplicateEmails = getDuplicateEmailsInfo();
    if (duplicateEmails.size > 0) {
      const duplicateList = Array.from(duplicateEmails.keys()).join(', ');
      showAlert(`Duplicate emails found: ${duplicateList}. Please remove duplicates before sending.`, 'error');
      return;
    }

    setSending(true);

    try {
      const selectedEventId = events.find(ev => ev.eventName === sharedData.eventName)?._id || '';

      // Send email to each alumni with personalized content
      const firstEntry = alumniEntries[0];
      const results = await Promise.all(
        alumniEntries.map(async (entry) => {
          const personalizedTitle = personalizeContent(sharedData.title.trim(), entry, firstEntry);
          const personalizedMessage = personalizeContent(sharedData.message.trim(), entry, firstEntry);

          const emailPayload = {
            senderId: user?.userId,
            senderName: adminName || user?.name || 'Admin',
            senderEmail: adminEmail || user?.email,
            adminName: (adminName || user?.name || 'Admin').trim(),
            collegeName: 'K.S.R. College of Engineering',
            email: entry.alumniEmail.trim(),
            title: personalizedTitle,
            message: personalizedMessage,
            isBroadcast: alumniEntries.length > 1,
            isEventInvitation: isEventFormEnabled,
            eventDetails: isEventFormEnabled ? {
              eventId: selectedEventId,
              eventName: sharedData.eventName.trim(),
              eventDate: sharedData.eventDate,
              eventVenue: sharedData.eventVenue.trim(),
              eventTime: sharedData.eventTime.trim()
            } : null
          };

          const response = await fetch(`${API_BASE_URL}/api/mail/send-mail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayload)
          });

          return response.json();
        })
      );

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        // Delete draft after successful send
        if (draftId) {
          try {
            await fetch(`${API_BASE_URL}/api/drafts/${draftId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (deleteError) {
            console.error('Error deleting draft after send:', deleteError);
          }
        }

        if (failCount > 0) {
          showAlert(`${successCount} email(s) sent successfully, ${failCount} failed.`, 'info');
        } else {
          showAlert(alumniEntries.length > 1 ? `All ${successCount} emails sent successfully!` : 'Mail sent successfully!', 'success');
        }

        setTimeout(() => {
          navigate('/admin/mail');
        }, 1500);
      } else {
        showAlert('Failed to send mail. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error sending mail:', error);
      showAlert('Network error. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this draft?')) return;

    setDeleting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/drafts/${draftId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        navigate('/admin/mail/draft_history');
      } else {
        showAlert(data.message || 'Failed to delete draft', 'error');
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      showAlert('Network error. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setAlumniEntries([createEmptyAlumniEntry()]);
    setSharedData({
      eventName: '',
      eventDate: '',
      eventVenue: '',
      eventTime: '',
      title: '',
      message: '',
      senderName: ''
    });
    setIsEventFormEnabled(false);
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'mail'} />
        <main className={styles.mainContent}>
          <div className={styles.backButtonWrapper}>
            <div className={styles.backButton} onClick={() => window.history.back()}>
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Back</span>
            </div>
          </div>
          <div className={styles.loadingState}>
            <p>Loading draft...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!draftId) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar onLogout={onLogout} currentView={'mail'} />
        <main className={styles.mainContent}>
          <div className={styles.backButtonWrapper}>
            <div className={styles.backButton} onClick={() => navigate('/admin/mail/draft_history')}>
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Back</span>
            </div>
          </div>
          <div className={styles.emptyState}>
            <p>Draft not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Sidebar onLogout={onLogout} currentView={'mail'} />

      <main className={styles.mainContent}>
        <div className={styles.backButtonWrapper}>
          <div className={styles.backButton} onClick={() => window.history.back()}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </div>
          <div className={styles.actionButtons}>
            <button
              className={styles.deleteBtn}
              onClick={handleDelete}
              disabled={deleting || sending || generatingEmail}
            >
              {deleting ? 'Deleting...' : 'Delete Draft'}
            </button>
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

        <div className={styles.pageHeader}>
          <h1>Edit & Send Draft</h1>
          <p className={styles.subtitle}>Edit your draft and send to alumni</p>
        </div>

        <form className={styles.form} onSubmit={handleSendNow} noValidate>
          {/* Event Form Toggle */}
          <div className={styles.optionalFormCard}>
            <div className={styles.optionalFormHeader}>
              <div className={styles.optionalFormTitleWrap}>
                <h3>Event Information</h3>
                <p>Enable event form to include event details in your message.</p>
              </div>

              <div className={styles.optionalFormControl}>
                {isEventFormEnabled && (
                  <div className={styles.outcomeStatus}>
                    <span className={styles.enabledText}>Event form enabled</span>
                  </div>
                )}
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={isEventFormEnabled}
                    onChange={handleEventFormToggleChange}
                    disabled={sending}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
            </div>
          </div>

          {isEventFormEnabled && (
            <div className={styles.eventFieldsTop}>
              <div className={styles.eventFieldsRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="eventName">Event Name</label>
                  <select
                    id="eventName"
                    name="eventName"
                    className={styles.inputField}
                    value={events.find(ev => ev.eventName === sharedData.eventName)?._id || ''}
                    onChange={handleEventSelect}
                    disabled={sending || loadingEvents}
                  >
                    <option value="">
                      {loadingEvents ? 'Loading events...' : 'Select an event'}
                    </option>
                    {events.map((event) => (
                      <option key={event._id} value={event._id}>
                        {event.eventName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="eventDate">Date</label>
                  <input
                    type="date"
                    id="eventDate"
                    name="eventDate"
                    className={`${styles.inputField} ${styles.readOnly}`}
                    value={sharedData.eventDate}
                    readOnly
                    disabled
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="eventVenue">Venue</label>
                  <input
                    type="text"
                    id="eventVenue"
                    name="eventVenue"
                    placeholder="Auto-filled from event"
                    className={`${styles.inputField} ${styles.readOnly}`}
                    value={sharedData.eventVenue}
                    readOnly
                    disabled
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="eventTime">Time</label>
                  <input
                    type="text"
                    id="eventTime"
                    name="eventTime"
                    placeholder="Auto-filled from event"
                    className={`${styles.inputField} ${styles.readOnly}`}
                    value={sharedData.eventTime}
                    readOnly
                    disabled
                  />
                </div>
              </div>
              <br />
              <hr />
            </div>
          )}

          {/* Alumni Entries */}
          {alumniEntries.map((entry, index) => (
            <div key={index} className={styles.alumniEntryCard}>
              {alumniEntries.length > 1 && (
                <div className={styles.alumniEntryHeader}>
                  <span className={styles.alumniEntryTitle}>Alumni {index + 1}</span>
                  <button
                    type="button"
                    className={styles.removeAlumniBtn}
                    onClick={() => handleRemoveAlumni(index)}
                    disabled={sending}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              )}

              <div className={styles.inputSection}>
                {/* Name, Department and Photo Row */}
                <div className={styles.photoNameRow}>
                  {/* Alumni Name and Department - Left Side */}
                  <div className={styles.fieldsSection}>
                    <div className={styles.inputGroup}>
                      <label htmlFor={`alumniName-${index}`}>
                        Alumni Name <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        id={`alumniName-${index}`}
                        name="alumniName"
                        placeholder="Enter alumni name"
                        className={styles.inputField}
                        value={entry.alumniName}
                        onChange={(e) => handleAlumniInputChange(index, e)}
                        disabled={sending}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label htmlFor={`department-${index}`}>
                        Department <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        id={`department-${index}`}
                        name="department"
                        placeholder="Enter department"
                        className={styles.inputField}
                        value={entry.department}
                        onChange={(e) => handleAlumniInputChange(index, e)}
                        disabled={sending}
                      />
                    </div>
                  </div>

                  {/* Alumni Photo - Right Side */}
                  <div className={styles.photoSection}>
                    <label>Alumni Photo</label>
                    <div className={styles.photoDisplay}>
                      {entry.fetchingPhoto ? (
                        <div className={styles.photoLoading}>
                          <span className={styles.spinner}></span>
                        </div>
                      ) : entry.alumniPhoto ? (
                        <img
                          src={entry.alumniPhoto}
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
                  </div>
                </div>

                <div className={styles.batchRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor={`batchStart-${index}`}>
                      Batch <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id={`batchStart-${index}`}
                      name="batchStart"
                      placeholder="e.g., 2020"
                      className={styles.inputField}
                      value={entry.batchStart}
                      onChange={(e) => handleAlumniInputChange(index, e)}
                      disabled={sending}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor={`batchEnd-${index}`}>
                      &nbsp;
                    </label>
                    <input
                      type="text"
                      id={`batchEnd-${index}`}
                      name="batchEnd"
                      className={`${styles.inputField} ${styles.readOnly}`}
                      value={getBatchEnd(entry.batchStart)}
                      readOnly
                      disabled
                    />
                    <div className={styles.helperText}>Auto-calculated (+4 years)</div>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor={`alumniEmail-${index}`}>
                    Alumni Email <span className={styles.required}>*</span>
                  </label>
                  {entry.showEmailDropdown && entry.matchedAlumni.length > 1 ? (
                    <select
                      id={`alumniEmail-${index}`}
                      name="alumniEmail"
                      className={`${styles.inputField} ${checkDuplicateEmail(entry.alumniEmail, index) ? styles.duplicateField : ''}`}
                      value={entry.alumniEmail}
                      onChange={(e) => handleEmailSelect(index, e)}
                      disabled={sending}
                    >
                      <option value="">Select alumni email ({entry.matchedAlumni.length} matches found)</option>
                      {entry.matchedAlumni.map((alumni, alIdx) => (
                        <option key={alumni._id || alIdx} value={alumni.email}>
                          {alumni.email}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="email"
                      id={`alumniEmail-${index}`}
                      name="alumniEmail"
                      placeholder="alumni@example.com"
                      className={`${styles.inputField} ${checkDuplicateEmail(entry.alumniEmail, index) ? styles.duplicateField : ''}`}
                      value={entry.alumniEmail}
                      onChange={(e) => handleAlumniInputChange(index, e)}
                      disabled={sending}
                    />
                  )}

                  {/* Show duplicate warning */}
                  {checkDuplicateEmail(entry.alumniEmail, index) && (
                    <div className={styles.duplicateWarning}>
                      <span className="material-symbols-outlined">warning</span>
                      This email is already added for another alumni
                    </div>
                  )}

                  {/* Show multiple matches info if no duplicates */}
                  {!checkDuplicateEmail(entry.alumniEmail, index) && entry.matchedAlumni.length > 1 && !entry.showEmailDropdown && entry.alumniEmail && (
                    <div className={styles.helperText}>
                      {entry.matchedAlumni.length} alumni found with same details.
                      <span
                        className={styles.showDropdownLink}
                        onClick={() => setAlumniEntries(prev => prev.map((e, i) =>
                          i === index ? { ...e, showEmailDropdown: true } : e
                        ))}
                      > Show all</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Another Alumni Button */}
          <button
            type="button"
            className={styles.addAlumniBtn}
            onClick={handleAddAlumni}
            disabled={sending || generatingEmail}
          >
            <span className="material-symbols-outlined">person_add</span>
            Add Another Alumni
          </button>

          {/* Shared Subject and Message Section */}
          <div className={styles.inputSection}>
            {/* Auto-personalization hint for multiple alumni */}
            {alumniEntries.length > 1 && (
              <div className={styles.placeholderHint}>
                <span className="material-symbols-outlined">info</span>
                <div>
                  <strong>Auto-Personalization:</strong> Write your message using the first alumni's details.
                  The system will automatically replace their name, department, batch, etc. with each recipient's details when sending.
                </div>
              </div>
            )}

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
                value={sharedData.title}
                onChange={handleSharedInputChange}
                disabled={sending}
              />
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
                value={sharedData.message}
                onChange={handleSharedInputChange}
                disabled={sending}
              />
            </div>

            {/* Character count and AI Generate Button */}
            <div className={styles.messageActionRow}>
              <div className={styles.charCount}>{sharedData.message.length} characters</div>
              <button
                type="button"
                className={styles.generateBtn}
                onClick={handleGenerateEmail}
                disabled={sending || generatingEmail || !alumniEntries[0]?.alumniName.trim()}
              >
                {generatingEmail ? (
                  <>
                    <span className={styles.spinner}></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">auto_awesome</span>
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Duplicate emails summary */}
          {(() => {
            const duplicateEmails = getDuplicateEmailsInfo();
            if (duplicateEmails.size > 0) {
              return (
                <div className={styles.duplicateSummary}>
                  <span className="material-symbols-outlined">error</span>
                  <div>
                    <strong>Duplicate Emails Detected:</strong>
                    <div className={styles.duplicateEmailsList}>
                      {Array.from(duplicateEmails.entries()).map(([email, indices]) => (
                        <div key={email} className={styles.duplicateEmailItem}>
                          <code>{email}</code> - Found in Alumni {indices.map(i => i + 1).join(', ')}
                        </div>
                      ))}
                    </div>
                    <p>Please remove duplicate emails before sending to avoid sending the same email to one person multiple times.</p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <div className={styles.formActions}>
            <div className={styles.formBtn}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={resetForm}
                disabled={sending || generatingEmail}
              >
                <span className="material-symbols-outlined">close</span>
                Clear Form
              </button>
              <button type="submit" className={styles.sendBtn} disabled={sending || generatingEmail}>
                {sending ? (
                  <>
                    <span className={styles.spinner}></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className={styles.sendIcon} />
                    {alumniEntries.length > 1 ? `Send to ${alumniEntries.length} Alumni` : 'Send Mail'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Admin_Draft;
