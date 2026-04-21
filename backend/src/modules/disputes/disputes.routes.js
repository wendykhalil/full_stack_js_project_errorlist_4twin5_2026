const express = require('express');
const router = express.Router();
const ctrl = require('./disputes.controller');
const { authRequired } = require('../../middleware/authMiddleware');
const { requireRoles } = require('../../middleware/roleMiddleware');

// User
router.post('/', authRequired, ctrl.create);
router.get('/my', authRequired, ctrl.listMine);
router.get('/:id', authRequired, ctrl.getOne);
router.post('/:id/message', authRequired, ctrl.addMessage);

// Admin
router.get('/admin/disputes', authRequired, requireRoles('ADMIN'), ctrl.adminList);
router.patch('/admin/disputes/:id/resolve', authRequired, requireRoles('ADMIN'), ctrl.adminResolve);

module.exports = router;
