const express = require("express");
const router = express.Router();
const ctrl = require("./promo.controller");
const { authRequired } = require("../../middleware/authMiddleware");
const { requireRoles } = require("../../middleware/roleMiddleware");

// Public: validate a code (artisan uses this at checkout)
router.post("/validate", authRequired, ctrl.validate);

// Admin: full CRUD
router.get("/", authRequired, requireRoles("ADMIN"), ctrl.list);
router.post("/", authRequired, requireRoles("ADMIN"), ctrl.create);
router.patch("/:id", authRequired, requireRoles("ADMIN"), ctrl.update);
router.delete("/:id", authRequired, requireRoles("ADMIN"), ctrl.remove);

module.exports = router;
