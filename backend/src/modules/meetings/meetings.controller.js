const Meeting = require("../../models/Meeting");
const User = require("../../models/User");
const Availability = require("../../models/Availability");
const { sendMeetingConfirmationEmail, sendMeetingStatusChangeEmail } = require("../../utils/emailService");
const { generateMeetingLink } = require("../../utils/meetingLink");

function uid(req) {
  return req.user?._id || req.user?.id;
}

// POST /meetings - Create a new meeting booking
async function createMeeting(req, res, next) {
  try {
    const { artisanId, startDateTime, endDateTime, description, duration } = req.body;
    const prescripteurId = uid(req);

    // Validate required fields
    if (!artisanId || !startDateTime || !endDateTime) {
      return res.status(400).json({
        ok: false,
        message: "artisanId, startDateTime, and endDateTime are required",
      });
    }

    // Validate that end time is after start time
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    if (end <= start) {
      return res.status(400).json({
        ok: false,
        message: "End time must be after start time",
      });
    }

    // Check if artisan exists
    const artisan = await User.findById(artisanId);
    if (!artisan || artisan.role !== "ARTISAN") {
      return res.status(404).json({
        ok: false,
        message: "Artisan not found",
      });
    }

    // Check if prescripteur exists
    const prescripteur = await User.findById(prescripteurId);
    if (!prescripteur) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    // Check artisan availability for this date
    const dayStart = new Date(start);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(start);
    dayEnd.setHours(23, 59, 59, 999);

    const availability = await Availability.findOne({
      artisanId: artisanId,
      date: { $gte: dayStart, $lte: dayEnd },
    });

    if (availability && availability.status === "NOT_AVAILABLE") {
      return res.status(400).json({
        ok: false,
        message: "Artisan is not available on this date",
      });
    }

    // Create the meeting
    const meeting = new Meeting({
      artisanId,
      prescripteurId,
      startDateTime: start,
      endDateTime: end,
      duration: duration || 60,
      description: description || "",
      prescripteurPhone: prescripteur.phone || "",
      prescripteurEmail: prescripteur.email || "",
    });

    await meeting.save();

    // Generate Jitsi Meet link after meeting is created (so we have the ID)
    meeting.googleMeetLink = generateMeetingLink(meeting._id);
    await meeting.save();

    // Send notification emails ASYNCHRONOUSLY (don't block response)
    sendMeetingConfirmationEmail({
      artisanId: artisanId.toString(),
      prescripteurId: prescripteurId.toString(),
      meetingId: meeting._id.toString(),
      artisanName: artisan.firstName + " " + artisan.lastName,
      artisanEmail: artisan.email,
      prescripteurName: prescripteur.firstName + " " + prescripteur.lastName,
      prescripteurEmail: prescripteur.email,
      startDateTime: start,
      endDateTime: end,
      description,
      googleMeetLink: meeting.googleMeetLink,
    }).then(() => {
      // Update notification tracking only if email sent successfully
      meeting.notificationsSent.artisanNotificationSent = true;
      meeting.notificationsSent.prescripteurNotificationSent = true;
      meeting.save().catch(err => console.error("Error updating notification tracking:", err));
    }).catch(err => {
      console.error("Error sending confirmation email:", err);
      // Still save the meeting even if email fails
    });

    return res.status(201).json({
      ok: true,
      message: "Meeting created successfully",
      meeting: meeting.toObject(),
    });
  } catch (err) {
    return next(err);
  }
}

// GET /meetings/artisan - Get meetings for artisan
async function getArtisanMeetings(req, res, next) {
  try {
    const artisanId = uid(req);
    const { status } = req.query;

    if (!artisanId) {
      return res.status(401).json({
        ok: false,
        message: "User not authenticated",
      });
    }

    const filter = { artisanId };
    if (status) {
      filter.status = status;
    }

    const meetings = await Meeting.find(filter)
      .populate("prescripteurId", "firstName lastName email phone")
      .sort({ startDateTime: -1 })
      .lean();

    return res.json({
      ok: true,
      meetings: meetings || [],
    });
  } catch (err) {
    return next(err);
  }
}

// GET /meetings/prescripteur - Get meetings for prescripteur
async function getPrescripteurMeetings(req, res, next) {
  try {
    const prescripteurId = uid(req);
    const { status } = req.query;

    if (!prescripteurId) {
      return res.status(401).json({
        ok: false,
        message: "User not authenticated",
      });
    }

    const filter = { prescripteurId };
    if (status) {
      filter.status = status;
    }

    const meetings = await Meeting.find(filter)
      .populate("artisanId", "firstName lastName email phone")
      .sort({ startDateTime: -1 })
      .lean();

    return res.json({
      ok: true,
      meetings: meetings || [],
    });
  } catch (err) {
    return next(err);
  }
}

// GET /meetings/:id - Get meeting details
async function getMeeting(req, res, next) {
  try {
    const { id } = req.params;
    const userId = uid(req);

    const meeting = await Meeting.findById(id)
      .populate("artisanId", "firstName lastName email phone")
      .populate("prescripteurId", "firstName lastName email phone");

    if (!meeting) {
      return res.status(404).json({
        ok: false,
        message: "Meeting not found",
      });
    }

    // Check if user is authorized to view this meeting
    if (String(meeting.artisanId._id) !== String(userId) && String(meeting.prescripteurId._id) !== String(userId)) {
      return res.status(403).json({
        ok: false,
        message: "Not authorized to view this meeting",
      });
    }

    return res.json({
      ok: true,
      meeting: meeting.toObject(),
    });
  } catch (err) {
    return next(err);
  }
}

// PATCH /meetings/:id/accept - Accept meeting (artisan only)
async function acceptMeeting(req, res, next) {
  try {
    const { id } = req.params;
    const artisanId = uid(req);

    const meeting = await Meeting.findById(id)
      .populate("prescripteurId", "firstName lastName email phone");

    if (!meeting) {
      return res.status(404).json({
        ok: false,
        message: "Meeting not found",
      });
    }

    // Compare as strings to avoid ObjectId comparison issues
    if (String(meeting.artisanId) !== String(artisanId)) {
      console.error(`Authorization error: meeting.artisanId=${String(meeting.artisanId)} vs artisanId=${String(artisanId)}`);
      return res.status(403).json({
        ok: false,
        message: "Only the artisan can accept this meeting",
      });
    }

    if (meeting.status !== "PENDING") {
      return res.status(400).json({
        ok: false,
        message: "Only pending meetings can be accepted",
      });
    }

    meeting.status = "ACCEPTED";
    meeting.acceptedAt = new Date();
    await meeting.save();

    // Send status change notification ASYNCHRONOUSLY
    const artisan = await User.findById(meeting.artisanId);
    sendMeetingStatusChangeEmail({
      meeting: meeting.toObject(),
      artisanName: artisan.firstName + " " + artisan.lastName,
      prescripteurEmail: meeting.prescripteurId.email,
      prescripteurName: meeting.prescripteurId.firstName + " " + meeting.prescripteurId.lastName,
      status: "accepted",
    }).catch(err => console.error("Error sending status change email:", err));

    return res.json({
      ok: true,
      message: "Meeting accepted successfully",
      meeting: meeting.toObject(),
    });
  } catch (err) {
    return next(err);
  }
}

// PATCH /meetings/:id/reject - Reject meeting (artisan only)
async function rejectMeeting(req, res, next) {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const artisanId = uid(req);

    const meeting = await Meeting.findById(id)
      .populate("prescripteurId", "firstName lastName email phone");

    if (!meeting) {
      return res.status(404).json({
        ok: false,
        message: "Meeting not found",
      });
    }

    // Compare as strings to avoid ObjectId comparison issues
    if (String(meeting.artisanId) !== String(artisanId)) {
      console.error(`Authorization error: meeting.artisanId=${String(meeting.artisanId)} vs artisanId=${String(artisanId)}`);
      return res.status(403).json({
        ok: false,
        message: "Only the artisan can reject this meeting",
      });
    }

    if (meeting.status !== "PENDING") {
      return res.status(400).json({
        ok: false,
        message: "Only pending meetings can be rejected",
      });
    }

    meeting.status = "REJECTED";
    meeting.rejectedAt = new Date();
    meeting.notes = notes || "";
    await meeting.save();

    // Send status change notification ASYNCHRONOUSLY
    const artisan = await User.findById(meeting.artisanId);
    sendMeetingStatusChangeEmail({
      meeting: meeting.toObject(),
      artisanName: artisan.firstName + " " + artisan.lastName,
      prescripteurEmail: meeting.prescripteurId.email,
      prescripteurName: meeting.prescripteurId.firstName + " " + meeting.prescripteurId.lastName,
      status: "rejected",
    }).catch(err => console.error("Error sending status change email:", err));

    return res.json({
      ok: true,
      message: "Meeting rejected successfully",
      meeting: meeting.toObject(),
    });
  } catch (err) {
    return next(err);
  }
}

// DELETE /meetings/:id - Cancel meeting
async function cancelMeeting(req, res, next) {
  try {
    const { id } = req.params;
    const userId = uid(req);

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        ok: false,
        message: "Meeting not found",
      });
    }

    // Check authorization
    if (String(meeting.artisanId) !== String(userId) && String(meeting.prescripteurId) !== String(userId)) {
      return res.status(403).json({
        ok: false,
        message: "Not authorized to cancel this meeting",
      });
    }

    if (meeting.status === "COMPLETED" || meeting.status === "CANCELLED") {
      return res.status(400).json({
        ok: false,
        message: "Cannot cancel a completed or already cancelled meeting",
      });
    }

    meeting.status = "CANCELLED";
    await meeting.save();

    return res.json({
      ok: true,
      message: "Meeting cancelled successfully",
      meeting: meeting.toObject(),
    });
  } catch (err) {
    return next(err);
  }
}

// DELETE /meetings/:id - Delete a meeting
async function deleteMeeting(req, res, next) {
  try {
    const { id } = req.params;
    const userId = uid(req);

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({
        ok: false,
        message: "Meeting not found",
      });
    }

    // Check authorization - only artisan or prescripteur of this meeting can delete it
    if (String(meeting.artisanId) !== String(userId) && String(meeting.prescripteurId) !== String(userId)) {
      return res.status(403).json({
        ok: false,
        message: "Not authorized to delete this meeting",
      });
    }

    // Actually delete the meeting from database
    await Meeting.findByIdAndDelete(id);

    return res.json({
      ok: true,
      message: "Meeting deleted successfully",
    });
  } catch (err) {
    return next(err);
  }
}

// GET /meetings/artisan/:artisanId/availability - Get artisan availability
async function getArtisanAvailability(req, res, next) {
  try {
    const { artisanId } = req.params;
    const { month } = req.query; // Format: 2026-04

    const filter = { artisanId };

    if (month) {
      const [y, m] = month.split("-").map(Number);
      filter.date = {
        $gte: new Date(y, m - 1, 1),
        $lt: new Date(y, m, 1),
      };
    }

    const availability = await Availability.find(filter).sort({ date: 1 }).lean();

    // Get conflicting meetings
    const startOfMonth = month ? new Date(month + "-01") : new Date();
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const meetings = await Meeting.find({
      artisanId,
      status: { $in: ["ACCEPTED", "PENDING"] },
      startDateTime: { $gte: startOfMonth, $lt: endOfMonth },
    }).lean();

    return res.json({
      ok: true,
      availability,
      meetings,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createMeeting,
  getArtisanMeetings,
  getPrescripteurMeetings,
  getMeeting,
  acceptMeeting,
  rejectMeeting,
  cancelMeeting,
  deleteMeeting,
  getArtisanAvailability,
};
