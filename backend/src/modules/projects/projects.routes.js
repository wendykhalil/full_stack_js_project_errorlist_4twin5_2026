const express = require('express');
const { authRequired } = require('../../middleware/authMiddleware');
const { requireRoles } = require('../../middleware/roleMiddleware');
const { uploadProjectImages } = require('../../middleware/uploadProjects');
const controller = require('./projects.controller');

const router = express.Router();

// Artisan
router.get('/my', authRequired, requireRoles('ARTISAN'), controller.listMyProjects);
router.post('/', authRequired, requireRoles('ARTISAN'), uploadProjectImages, controller.createProject);
router.get('/:id', authRequired, requireRoles('ARTISAN', 'PRESCRIPTEUR'), controller.getProjectById);
router.put('/:id', authRequired, requireRoles('ARTISAN'), uploadProjectImages, controller.updateProject);
router.delete('/:id', authRequired, requireRoles('ARTISAN'), controller.deleteProject);

// Prescripteur
router.get('/', authRequired, requireRoles('PRESCRIPTEUR'), controller.listAllProjects);

module.exports = router;
