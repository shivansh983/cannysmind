'use strict';

const router = require('express').Router();
const { getTasks, createTask, approveTask, joinTask, completeTask } = require('./controller');
const { protect } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');


router.get('/', protect, getTasks);


router.post('/', protect, requireRole('manager', 'admin'), createTask);


router.patch('/:id/approve', protect, requireRole('admin'), approveTask);


router.post('/:id/join', protect, requireRole('user'), joinTask);


router.patch('/:id/complete', protect, completeTask);

module.exports = router;