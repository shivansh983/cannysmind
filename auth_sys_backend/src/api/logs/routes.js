'use strict';
const router = require('express').Router();
const { getTaskLogs, getActivityFeed } = require('./controller');
const { protect } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

// GET /api/logs/task/:taskId - Get the history timeline for a single task
router.get('/task/:taskId', protect, getTaskLogs);

// GET /api/logs/feed - Get the global dashboard feed (Blocked for regular users)
router.get('/feed', protect, requireRole('admin', 'manager'), getActivityFeed);

module.exports = router;