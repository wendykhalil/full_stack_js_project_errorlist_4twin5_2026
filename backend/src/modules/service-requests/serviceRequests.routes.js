const express = require("express");
const router = express.Router();
const ctrl = require("./serviceRequests.controller");
const { authRequired } = require("../../middleware/authMiddleware");
const { requireRoles } = require("../../middleware/roleMiddleware");
const { validateCreateServiceRequest, validateUpdateServiceRequest, validateApply } = require("../../middleware/validations/serviceRequestValidator");

// Prescripteur
router.post("/", authRequired, requireRoles("PRESCRIPTEUR"), validateCreateServiceRequest, ctrl.create);
router.get("/my", authRequired, requireRoles("PRESCRIPTEUR"), ctrl.listMine);
router.get("/my/:id", authRequired, requireRoles("PRESCRIPTEUR"), ctrl.getOne);
router.put("/my/:id", authRequired, requireRoles("PRESCRIPTEUR"), validateUpdateServiceRequest, ctrl.update);
router.delete("/my/:id", authRequired, requireRoles("PRESCRIPTEUR"), ctrl.remove);
router.patch("/my/:id/status", authRequired, requireRoles("PRESCRIPTEUR"), ctrl.changeStatus);
router.patch("/my/:id/applications/:appId/accept", authRequired, requireRoles("PRESCRIPTEUR"), ctrl.acceptApplication);
router.patch("/my/:id/applications/:appId/reject", authRequired, requireRoles("PRESCRIPTEUR"), ctrl.rejectApplication);

// Artisan
router.get("/open", authRequired, requireRoles("ARTISAN"), ctrl.listOpen);
router.get("/open/:id", authRequired, requireRoles("ARTISAN"), ctrl.getOpenOne);
router.post("/:id/apply", authRequired, requireRoles("ARTISAN"), validateApply, ctrl.apply);
router.get("/my-applications", authRequired, requireRoles("ARTISAN"), ctrl.myApplications);

module.exports = router;
