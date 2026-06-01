'use strict';
const router = require('express').Router();
const { getTaskLogs, getActivityFeed } = require('./controller');
const { protect } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

router.get('/task/:taskId', protect, getTaskLogs);

router.get('/feed', protect, requireRole('admin', 'manager'), getActivityFeed);

module.exports = router;