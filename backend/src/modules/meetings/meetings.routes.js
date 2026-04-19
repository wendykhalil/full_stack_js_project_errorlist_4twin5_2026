const express = require("express");
const router = express.Router();
const ctrl = require("./meetings.controller");
const { authRequired } = require("../../middleware/authMiddleware");
const { requireRoles } = require("../../middleware/roleMiddleware");

// Create meeting (prescripteur books with artisan)
router.post("/", authRequired, requireRoles("PRESCRIPTEUR"), ctrl.createMeeting);

// Get meetings for artisan
router.get("/artisan/list", authRequired, requireRoles("ARTISAN"), ctrl.getArtisanMeetings);

// Get meetings for prescripteur
router.get("/prescripteur/list", authRequired, requireRoles("PRESCRIPTEUR"), ctrl.getPrescripteurMeetings);

// Get artisan availability (public - for calendar UI)
router.get("/availability/:artisanId", ctrl.getArtisanAvailability);

// Get meeting details
router.get("/:id", authRequired, ctrl.getMeeting);

// Accept meeting (artisan only)
router.patch("/:id/accept", authRequired, requireRoles("ARTISAN"), ctrl.acceptMeeting);

// Reject meeting (artisan only)
router.patch("/:id/reject", authRequired, requireRoles("ARTISAN"), ctrl.rejectMeeting);

// Cancel meeting
router.patch("/:id/cancel", authRequired, ctrl.cancelMeeting);

// Delete meeting
router.delete("/:id", authRequired, ctrl.deleteMeeting);

module.exports = router;
