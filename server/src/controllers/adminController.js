import Alumni from '../models/alumni.js';
import Coordinator from '../models/coordinator.js';
import Event from '../models/event.js';
import Mail from '../models/mail.js';
import MailResponse from '../models/mailResponse.js';
import JobReference from '../models/jobReference.js';
import Payment from '../models/payment.js';
import Department from '../models/department.js';

/**
 * Get dashboard statistics for admin panel
 * @route GET /api/admin/dashboard/stats
 * @access Private (Admin only)
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Role check: Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Execute all queries in parallel for performance
    const [
      totalAlumni,
      activeCoordinators,
      upcomingEventsCount,
      totalBroadcasts,
      recentMails,
      acceptedMailResponses,
      activeJobs,
      recentJobsList,
      latestDonation,
      upcomingEvent,
    ] = await Promise.all([
      // 1. Total active alumni
      Alumni.countDocuments({ isActive: true }),

      // 2. Active coordinators (status='Active' AND isActive=true)
      Coordinator.countDocuments({ status: 'Active', isActive: true }),

      // 3. Upcoming events count (pending status and date >= today)
      Event.countDocuments({
        status: 'pending',
        eventDate: { $gte: today },
      }),

      // 4. Total broadcast messages sent
      Mail.countDocuments({ isBroadcast: true }),

      // 5. Recent mails (last 2 for preview)
      Mail.find({})
        .sort({ createdAt: -1 })
        .limit(2)
        .select('title content createdAt'),

      // 6. Count of accepted mail responses
      MailResponse.countDocuments({ action: 'accept' }),

      // 7. Active job references count
      JobReference.countDocuments({ status: 'approved' }),

      // 8. Recent approved jobs (last 2 for preview)
      JobReference.find({ status: 'approved' })
        .sort({ createdAt: -1 })
        .limit(2)
        .select('role companyName submittedBy')
        .populate('submittedBy', 'name'),

      // 9. Latest successful donation/payment
      Payment.findOne({ status: 'paid' })
        .sort({ paidAt: -1 })
        .select('amount purpose paidAt user')
        .populate('user', 'name'),

      // 10. Next upcoming event details
      Event.findOne({
        status: 'pending',
        eventDate: { $gte: today },
      })
        .sort({ eventDate: 1 })
        .select('eventName eventDate eventDay eventTime venue organizer')
        .populate('organizer', 'branch'),
    ]);

    // Calculate days until next event
    let daysUntilEvent = null;
    let hoursUntilEvent = null;
    if (upcomingEvent) {
      const eventDateTime = new Date(upcomingEvent.eventDate);
      const now = new Date();
      const diffMs = eventDateTime - now;
      daysUntilEvent = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      hoursUntilEvent = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    }

    // Format recent mails for display
    const formattedMails = recentMails.map(mail => ({
      title: mail.title,
      preview: mail.content?.substring(0, 80) + (mail.content?.length > 80 ? '...' : ''),
      createdAt: mail.createdAt,
    }));

    // Format recent jobs for display
    const formattedJobs = recentJobsList.map(job => ({
      role: job.role,
      company: job.companyName,
      referredBy: job.submittedBy?.name || 'Unknown',
    }));

    // Format latest donation
    const formattedDonation = latestDonation ? {
      amount: latestDonation.amount,
      purpose: latestDonation.purpose,
      paidAt: latestDonation.paidAt,
      donorName: latestDonation.user?.name || 'Anonymous',
    } : null;

    // Format upcoming event
    const formattedEvent = upcomingEvent ? {
      name: upcomingEvent.eventName,
      date: upcomingEvent.eventDate,
      day: upcomingEvent.eventDay,
      time: upcomingEvent.eventTime,
      venue: upcomingEvent.venue,
      organizer: upcomingEvent.organizer?.branch || 'TBD',
      daysUntil: daysUntilEvent,
      hoursUntil: hoursUntilEvent,
    } : null;

    return res.status(200).json({
      success: true,
      stats: {
        totalAlumni,
        activeCoordinators,
        upcomingEvents: upcomingEventsCount,
        totalBroadcasts,
      },
      cards: {
        mail: {
          newCount: recentMails.length,
          recentMails: formattedMails,
          acceptedCount: acceptedMailResponses,
        },
        jobs: {
          activeCount: activeJobs,
          recentJobs: formattedJobs,
        },
        donation: formattedDonation,
        event: formattedEvent,
      },
    });
  } catch (error) {
    console.error('[AdminController] getDashboardStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
};

/**
 * Get accepted mail responses for admin panel
 * @route GET /api/admin/mail/accepted-responses
 * @access Private (Admin only)
 */
export const getAcceptedMailResponses = async (req, res) => {
  try {
    // Role check: Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { page = 1, limit = 10, mailId } = req.query;
    const skip = (page - 1) * limit;

    // Build query filter
    const filter = { action: 'accept' };
    if (mailId) {
      filter.mailId = mailId;
    }

    // Fetch accepted responses with mail details
    const [responses, totalCount] = await Promise.all([
      MailResponse.find(filter)
        .populate('mailId', 'title content senderName eventDetails createdAt')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      MailResponse.countDocuments(filter),
    ]);

    const formattedResponses = responses.map(response => ({
      id: response._id,
      recipientEmail: response.recipientEmail,
      submittedAt: response.submittedAt,
      mailInfo: {
        id: response.mailId._id,
        title: response.mailId.title,
        senderName: response.mailId.senderName,
        isEventInvitation: !!response.mailId.eventDetails?.eventName,
        eventName: response.mailId.eventDetails?.eventName,
        sentAt: response.mailId.createdAt,
      },
      alumniData: {
        fullName: response.responseData?.fullName,
        designation: response.responseData?.designation,
        companyName: response.responseData?.companyName,
        contactInfo: {
          mobile: response.responseData?.mobileNo,
          personalEmail: response.responseData?.personalEmail,
          officialEmail: response.responseData?.officialEmail,
          location: response.responseData?.location,
        },
        batch: response.responseData?.batchYear,
      },
    }));

    return res.status(200).json({
      success: true,
      data: {
        responses: formattedResponses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page * limit < totalCount,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('[AdminController] getAcceptedMailResponses error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch accepted mail responses',
      error: error.message,
    });
  }
};
