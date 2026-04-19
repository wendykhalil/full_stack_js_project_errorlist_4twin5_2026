const express = require("express");
const router = express.Router();
const ctrl = require("./reviews.controller");
const { authRequired } = require("../../middleware/authMiddleware");
const { requireRoles } = require("../../middleware/roleMiddleware");
const { validateReview } = require("../../middleware/validations/reviewValidator");

router.post("/", authRequired, requireRoles("ARTISAN", "PRESCRIPTEUR"), validateReview, ctrl.create);
router.get("/user/:userId", ctrl.getForUser);
router.get("/artisan/:artisanId", ctrl.getForUser); // Alias for getting reviews for an artisan
router.get("/pending", authRequired, requireRoles("ARTISAN", "PRESCRIPTEUR"), ctrl.getPending);
router.delete("/:id", authRequired, ctrl.remove);

module.exports = router;
