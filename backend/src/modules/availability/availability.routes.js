const express = require("express");
const router = express.Router();
const ctrl = require("./availability.controller");
const { authRequired } = require("../../middleware/authMiddleware");
const { requireRoles } = require("../../middleware/roleMiddleware");

// Artisan manages own availability
router.get("/my", authRequired, requireRoles("ARTISAN"), ctrl.getMine);
router.post("/", authRequired, requireRoles("ARTISAN"), ctrl.upsert);
router.delete("/:date", authRequired, requireRoles("ARTISAN"), ctrl.remove);

// Public: anyone can view an artisan's availability
router.get("/artisan/:artisanId", ctrl.getForArtisan);

module.exports = router;
