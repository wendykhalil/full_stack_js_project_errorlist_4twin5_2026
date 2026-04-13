const express = require("express");
const router = express.Router();
const ctrl = require("./promo.controller");
const { authRequired } = require("../../middleware/authMiddleware");
const { requireRoles } = require("../../middleware/roleMiddleware");
const { validateCreatePromo, validateUpdatePromo, validatePromoValidate } = require("../../middleware/validations/promoValidator");

router.post("/validate", authRequired, validatePromoValidate, ctrl.validate);
router.get("/", authRequired, requireRoles("ADMIN"), ctrl.list);
router.post("/", authRequired, requireRoles("ADMIN"), validateCreatePromo, ctrl.create);
router.patch("/:id", authRequired, requireRoles("ADMIN"), validateUpdatePromo, ctrl.update);
router.delete("/:id", authRequired, requireRoles("ADMIN"), ctrl.remove);

module.exports = router;
