const express = require('express');
const router = express.Router();
const ctrl = require('./reports.controller');
const { authRequired } = require('../../middleware/authMiddleware');
const { requireRoles } = require('../../middleware/roleMiddleware');

// User: submit a report
router.post('/', authRequired, ctrl.create);
router.get('/my', authRequired, ctrl.listMine);

// Admin
router.get('/admin/reports', authRequired, requireRoles('ADMIN'), ctrl.adminList);
router.patch('/admin/reports/:id/action', authRequired, requireRoles('ADMIN'), ctrl.adminAction);

module.exports = router;
