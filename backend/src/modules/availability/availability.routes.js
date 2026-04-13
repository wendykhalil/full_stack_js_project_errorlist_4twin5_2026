const express = require("express");
const router = express.Router();
const ctrl = require("./availability.controller");
const { authRequired } = require("../../middleware/authMiddleware");
const { requireRoles } = require("../../middleware/roleMiddleware");
const { validateUpsertAvailability, validateDateParam } = require("../../middleware/validations/availabilityValidator");

router.get("/my", authRequired, requireRoles("ARTISAN"), ctrl.getMine);
router.post("/", authRequired, requireRoles("ARTISAN"), validateUpsertAvailability, ctrl.upsert);
router.delete("/:date", authRequired, requireRoles("ARTISAN"), validateDateParam, ctrl.remove);
router.get("/artisan/:artisanId", ctrl.getForArtisan);

module.exports = router;
