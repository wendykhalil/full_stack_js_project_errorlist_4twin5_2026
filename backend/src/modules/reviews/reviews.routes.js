const express = require("express");
const router = express.Router();
const ctrl = require("./reviews.controller");
const { authRequired } = require("../../middleware/authMiddleware");
const { requireRoles } = require("../../middleware/roleMiddleware");

// Submit a review after a completed service request
router.post("/", authRequired, requireRoles("ARTISAN", "PRESCRIPTEUR"), ctrl.create);

// Get reviews for a user (public)
router.get("/user/:userId", ctrl.getForUser);

// Get reviews I can still submit (completed requests not yet reviewed)
router.get("/pending", authRequired, requireRoles("ARTISAN", "PRESCRIPTEUR"), ctrl.getPending);

// Delete own review
router.delete("/:id", authRequired, ctrl.remove);

module.exports = router;
