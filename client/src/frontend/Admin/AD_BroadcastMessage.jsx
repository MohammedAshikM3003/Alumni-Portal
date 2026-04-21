import styles from './AD_BroadcastMessage.module.css';
import Sidebar from './Components/Sidebar/Sidebar';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Default alumni entry structure
const createEmptyAlumniEntry = () => ({
  alumniName: '',
  alumniId: '',
  department: '',
  batchStart: '',
  alumniEmail: '',
  alumniPhoto: null,
  matchedAlumni: [],
  showEmailDropdown: false,
  fetchingPhoto: false,
  showNameDropdown: false,
  searchResults: [],
  searchingName: false
});

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

  // Alumni entries array - each entry has its own alumni-specific data
  const [alumniEntries, setAlumniEntries] = useState([
    initialAlumniName || initialAlumniEmail
      ? {
          ...createEmptyAlumniEntry(),
          alumniName: initialAlumniName,
          department: initialDepartment,
          batchStart: initialBatch ? initialBatch.split('-')[0] : '',
          alumniEmail: initialAlumniEmail,
        }
      : createEmptyAlumniEntry()
  ]);

  // Shared form data (event info, subject, message)
  const [sharedData, setSharedData] = useState({
    eventName: initialEventName,
    eventDate: initialEventDate,
    eventVenue: '',
    eventTime: '',
    title: initialTitle,
    message: initialMessage,
  });

  const [isPreMessageFormEnabled, setIsPreMessageFormEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(draftId ? true : false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [formSent, setFormSent] = useState(false);
  const [formCleared, setFormCleared] = useState(false);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [isEventFormEnabled, setIsEventFormEnabled] = useState(false);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Helper function to get cookie value
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  // Fetch draft data when editing a draft
  useEffect(() => {
    if (draftId) {
      const fetchDraft = async () => {
        try {
          setInitialLoading(true);
          const response = await fetch(`${API_BASE_URL}/api/drafts/${draftId}`, {
            headers: { 'Content-Type': 'application/json' }
          });

          const data = await response.json();
          if (data.success && data.draft) {
            const draft = data.draft;

            // Load recipients into alumni entries
            const recipients = draft.recipients && draft.recipients.length > 0
              ? draft.recipients
              : [{
                  name: draft.recipientName || '',
                  email: draft.recipientEmail || '',
                  department: draft.department || '',
                  batch: draft.batch || ''
                }];

            // Convert to alumni entries format
            const alumniData = recipients.map(r => ({
              ...createEmptyAlumniEntry(),
              alumniName: r.name || '',
              alumniEmail: r.email || '',
              department: r.department || '',
              batchStart: r.batch ? r.batch.split('-')[0] : ''
            }));

            setAlumniEntries(alumniData.length > 0 ? alumniData : [createEmptyAlumniEntry()]);

            // Parse event location to extract venue and time
            let eventVenue = '';
            let eventTime = '';
            if (draft.eventLocation) {
              const parts = draft.eventLocation.split('|');
              eventVenue = parts[0]?.trim() || '';
              eventTime = parts[1]?.trim() || '';
            }

            // Load shared data
            setSharedData({
              eventName: draft.eventName || '',
              eventDate: draft.eventDate || '',
              eventVenue: eventVenue,
              eventTime: eventTime,
              title: draft.title || '',
              message: draft.content || ''
            });
          }
        } catch (error) {
          console.error('Error fetching draft:', error);
          showAlert('Failed to load draft', 'error');
        } finally {
          setInitialLoading(false);
        }
      };

      fetchDraft();
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
          setEvents(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };

    // Only fetch when user is available
    if (user) {
      fetchEvents();
    }
  }, [user]);

  // Fetch departments from the database
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const token = getCookie('token') || user?.token;
        const response = await fetch(`${API_BASE_URL}/api/departments`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setDepartments(data.departments || []);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoadingDepartments(false);
      }
    };

    // Only fetch when user is available
    if (user) {
      fetchDepartments();
    }
  }, [user]);

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
      // Format the date for the date input (YYYY-MM-DD)
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

  // Calculate ending year for a specific alumni entry
  const getBatchEnd = (batchStart) => batchStart ? String(Number(batchStart) + 4) : '';
  const getBatch = (batchStart) => {
    const batchEnd = getBatchEnd(batchStart);
    return batchStart && batchEnd ? `${batchStart}-${batchEnd}` : '';
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

  // Search alumni by name
  const handleSearchAlumniName = async (index, searchValue) => {
    setAlumniEntries(prev => prev.map((entry, i) =>
      i === index ? { ...entry, alumniName: searchValue, showNameDropdown: true, searchingName: true } : entry
    ));

    if (!searchValue.trim()) {
      setAlumniEntries(prev => prev.map((entry, i) =>
        i === index ? { ...entry, searchResults: [], showNameDropdown: false } : entry
      ));
      return;
    }

    try {
      const token = getCookie('token') || user?.token;
      const response = await fetch(`${API_BASE_URL}/api/alumni/search?name=${encodeURIComponent(searchValue)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      setAlumniEntries(prev => prev.map((entry, i) =>
        i === index ? {
          ...entry,
          searchResults: data.success ? (data.data || []) : [],
          showNameDropdown: true,
          searchingName: false
        } : entry
      ));
    } catch (error) {
      console.error('Error searching alumni:', error);
      setAlumniEntries(prev => prev.map((entry, i) =>
        i === index ? { ...entry, searchResults: [], searchingName: false } : entry
      ));
    }
  };

  // Handle alumni selection from search results
  const handleSelectAlumni = (index, alumni) => {
    setAlumniEntries(prev => prev.map((entry, i) =>
      i === index ? {
        ...entry,
        alumniName: alumni.name,
        alumniId: alumni._id,
        alumniEmail: alumni.email,
        department: alumni.branch || entry.department,
        batchStart: alumni.yearFrom ? String(alumni.yearFrom) : entry.batchStart,
        showNameDropdown: false,
        searchResults: [],
        alumniPhoto: alumni.profilePhoto ? `${API_BASE_URL}/api/images/${alumni.profilePhoto}` : null
      } : entry
    ));
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

    // Filter only those with duplicates
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

  // Check if form has meaningful content to save as draft
  const hasContentToSave = () => {
    const hasAlumniData = alumniEntries.some(entry =>
      entry.alumniName.trim() ||
      entry.alumniEmail.trim() ||
      entry.department.trim()
    );
    return sharedData.title.trim() ||
           sharedData.message.trim() ||
           hasAlumniData;
  };

  // Auto-save draft silently (saves all alumni entries)
  const autoSaveDraft = async () => {
    if (formSent || formCleared || !hasContentToSave()) {
      return;
    }

    try {
      const firstEntry = alumniEntries[0];
      const batch = getBatch(firstEntry.batchStart);

      // Build recipients array from all alumni entries
      const recipients = alumniEntries.map(entry => ({
        name: entry.alumniName.trim(),
        email: entry.alumniEmail.trim(),
        department: entry.department.trim(),
        batch: getBatch(entry.batchStart),
      }));

      const draftPayload = {
        senderId: user?.userId || 'admin',
        senderName: adminName || user?.name || 'Admin',
        senderEmail: adminEmail || user?.email || '',
        // Store all recipients
        recipients: recipients,
        // Legacy fields for backward compatibility (first entry)
        recipientName: firstEntry.alumniName.trim(),
        recipientEmail: firstEntry.alumniEmail.trim(),
        department: firstEntry.department.trim(),
        batch: batch,
        title: sharedData.title.trim(),
        content: sharedData.message.trim(),
        eventName: sharedData.eventName.trim(),
        eventDate: sharedData.eventDate,
        eventLocation: sharedData.eventVenue.trim() + (sharedData.eventTime.trim() ? ` | ${sharedData.eventTime.trim()}` : ''),
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

  // Handle delete draft
  const handleDeleteDraft = async () => {
    if (!editDraft || !draftId) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this draft? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/drafts/${draftId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        showAlert('Draft deleted successfully', 'success');
        setTimeout(() => {
          navigate('/admin/broadcast-message');
        }, 1000);
      } else {
        const error = await response.json();
        showAlert(error.message || 'Failed to delete draft', 'error');
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      showAlert('Error deleting draft', 'error');
    }
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
  }, [alumniEntries, sharedData, formSent, formCleared]);

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: '' });
    }, 5000);
  };

  const handleFormToggleChange = (e) => {
    setIsPreMessageFormEnabled(e.target.checked);
  };

  const handleEventFormToggleChange = (e) => {
    setIsEventFormEnabled(e.target.checked);
    if (!e.target.checked) {
      // Clear event form data when disabled
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
      // Set fetching state for this entry
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
            // Multiple matches - show dropdown
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
            // Single match
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
      // Check for duplicate email
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

  // Generate email content using AI (uses first alumni entry for context)
  const handleGenerateEmail = async () => {
    const firstEntry = alumniEntries[0];
    // Basic validation for required fields
    if (!firstEntry.alumniName.trim()) {
      showAlert('Please enter Alumni Name to generate email', 'error');
      return;
    }
    if (!adminName && !user?.name) {
      showAlert('Sender name is required to generate email', 'error');
      return;
    }

    // Validation: if event form is not toggled, subject and message are required
    if (!isEventFormEnabled && (!sharedData.title.trim() || !sharedData.message.trim())) {
      showAlert('What to generate', 'error');
      return;
    }

    // Validation: if event form is toggled, event details should be filled
    if (isEventFormEnabled && (!sharedData.eventName.trim() || !sharedData.eventDate)) {
      showAlert('Please fill event details (Event Name and Date are required)', 'error');
      return;
    }

    setGeneratingEmail(true);

    try {
      const token = getCookie('token') || user?.token;
      const batchEnd = getBatchEnd(firstEntry.batchStart);

      // Prepare payload for AI generation
      const payload = {
        alumniName: firstEntry.alumniName.trim(),
        department: firstEntry.department.trim(),
        batch: firstEntry.batchStart ? `${firstEntry.batchStart}-${batchEnd}` : '',
        senderName: adminName || user?.name || 'Admin',
        collegeName: 'K.S.R. College of Engineering',
        purpose: 'Alumni outreach and engagement',
        eventDetails: {
          eventName: sharedData.eventName?.trim() || '',
          eventDate: sharedData.eventDate || '',
          eventVenue: sharedData.eventVenue?.trim() || '',
          eventTime: sharedData.eventTime?.trim() || ''
        },
        additionalContext: sharedData.message.trim() || 'General alumni communication',
        subject: sharedData.title.trim() || ''
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
        // Parse the AI response to extract subject and message
        const aiContent = data.data;

        // Try to extract subject line
        const subjectMatch = aiContent.match(/Subject:\s*(.+)$/m);
        const emailBodyMatch = aiContent.match(/Email Body:\s*([\s\S]+)$/);

        let newSubject = sharedData.title;
        let newMessage = aiContent;

        // If we can parse the subject, use it
        if (subjectMatch) {
          newSubject = subjectMatch[1].trim();
          // Remove the subject line from the message body
          newMessage = aiContent.replace(/Subject:\s*.+$/m, '').trim();
        }

        // If we can find email body section, use that
        if (emailBodyMatch) {
          newMessage = emailBodyMatch[1].trim();
        }

        // Update form with generated content
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

  const handleSubmit = async (e) => {
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

    setLoading(true);

    try {
      // Get the selected event ID
      const selectedEventId = events.find(ev => ev.eventName === sharedData.eventName)?._id || '';

      // Send email to each alumni with personalized content
      const firstEntry = alumniEntries[0];
      const results = await Promise.all(
        alumniEntries.map(async (entry) => {
          // Automatically personalize content by replacing first alumni's data with current alumni's data
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

        setFormSent(true);

        if (failCount > 0) {
          showAlert(`${successCount} email(s) sent successfully, ${failCount} failed.`, 'info');
        } else {
          showAlert(alumniEntries.length > 1 ? `All ${successCount} emails sent successfully!` : 'Mail sent successfully!', 'success');
        }
        resetForm();
      } else {
        showAlert('Failed to send mail. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error sending mail:', error);
      showAlert('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormCleared(true);
    setAlumniEntries([createEmptyAlumniEntry()]);
    setSharedData({
      eventName: '',
      eventDate: '',
      eventVenue: '',
      eventTime: '',
      title: '',
      message: ''
    });
    setIsPreMessageFormEnabled(false);
    setIsEventFormEnabled(false);
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

          {editDraft ? (
            <button
              className={styles.deleteDraftBtn}
              onClick={handleDeleteDraft}
              type="button"
              title="Delete this draft"
            >
              <span className="material-symbols-outlined">delete</span>
              <span>Delete Draft</span>
            </button>
          ) : (
            <div className={styles.headerSpacer} aria-hidden="true"></div>
          )}
        </div>

        {alert.show && (
          <div className={`${styles.alert} ${styles[alert.type]}`}>
            <span className="material-symbols-outlined">
              {alert.type === 'success' ? 'check_circle' : alert.type === 'error' ? 'error' : 'info'}
            </span>
            <span>{alert.message}</span>
          </div>
        )}

        {initialLoading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '400px',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div className={styles.spinner}></div>
            <p>Loading draft...</p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.optionalFormCard}>
            <div className={styles.optionalFormHeader}>
              <div className={styles.optionalFormTitleWrap}>
                <h3>Event Information</h3>
                <p>Enable event form to automatically populate event details in your message.</p>
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
                    disabled={loading || generatingEmail}
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
                    disabled={loading || loadingEvents}
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
                    disabled={loading}
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
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          id={`alumniName-${index}`}
                          placeholder="Search alumni by name..."
                          className={styles.inputField}
                          value={entry.alumniName}
                          onChange={(e) => handleSearchAlumniName(index, e.target.value)}
                          onFocus={() => setAlumniEntries(prev => prev.map((e, i) =>
                            i === index ? { ...e, showNameDropdown: true } : e
                          ))}
                          disabled={loading}
                          autoComplete="off"
                        />
                        {entry.showNameDropdown && (entry.alumniName || entry.searchResults.length > 0) && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            zIndex: 10,
                            marginTop: '4px'
                          }}>
                            {entry.searchingName ? (
                              <div style={{ padding: '10px', textAlign: 'center' }}>Searching...</div>
                            ) : entry.searchResults.length > 0 ? (
                              entry.searchResults.map((alumni) => (
                                <div
                                  key={alumni._id}
                                  onClick={() => handleSelectAlumni(index, alumni)}
                                  style={{
                                    padding: '10px',
                                    borderBottom: '1px solid #eee',
                                    cursor: 'pointer',
                                    hover: { backgroundColor: '#f5f5f5' }
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                  <div style={{ fontWeight: '500' }}>{alumni.name}</div>
                                  <div style={{ fontSize: '0.85em', color: '#666' }}>
                                    {alumni.branch} • Batch {alumni.yearFrom}-{alumni.yearTo}
                                  </div>
                                </div>
                              ))
                            ) : entry.alumniName && !entry.searchingName ? (
                              <div style={{ padding: '10px', textAlign: 'center', color: '#999' }}>No alumni found</div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label htmlFor={`department-${index}`}>
                        Department <span className={styles.required}>*</span>
                      </label>
                      <select
                        id={`department-${index}`}
                        name="department"
                        className={styles.inputField}
                        value={entry.department}
                        onChange={(e) => handleAlumniInputChange(index, e)}
                        disabled={loading || loadingDepartments}
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept._id} value={dept.branch}>
                            {dept.branch}
                          </option>
                        ))}
                      </select>
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
                      disabled={loading}
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
                      disabled={loading}
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
                      disabled={loading}
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
            disabled={loading || generatingEmail}
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            {/* Character count and AI Generate Button */}
            <div className={styles.messageActionRow}>
              <div className={styles.charCount}>{sharedData.message.length} characters</div>
              {(() => {
                const firstAlumni = alumniEntries[0];
                const isAlumniDetailsValid =
                  firstAlumni?.alumniName.trim() &&
                  firstAlumni?.department.trim() &&
                  firstAlumni?.batchStart.trim() &&
                  (isEventFormEnabled || (sharedData.title.trim() && sharedData.message.trim()));
                return (
                  <button
                    type="button"
                    className={styles.generateBtn}
                    onClick={handleGenerateEmail}
                    disabled={loading || generatingEmail || !isAlumniDetailsValid}
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
                );
              })()}
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
                disabled={loading || generatingEmail}
              >
                <span className="material-symbols-outlined">close</span>
                Clear Form
              </button>
              <button type="submit" className={styles.submitBtn} disabled={loading || generatingEmail}>
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">send</span>
                    {alumniEntries.length > 1 ? `Send to ${alumniEntries.length} Alumni` : 'Send Mail'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
        )}
      </main>
    </div>
  );
};

export default Admin_BroadcastMessage;
