const express = require('express');
const controller = require('./translation.controller');

const router = express.Router();

router.get('/resources', controller.getResources);
router.post('/translate', controller.translateText);

module.exports = router;
