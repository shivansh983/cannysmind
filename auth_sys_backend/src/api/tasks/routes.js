'use strict';

const router = require('express').Router();
const { 
  getTasks, 
  createTask, 
  claimTask, 
  assignTask, 
  updateStatus, 
  reopenTask,
  updateTask,
  deleteTask
} = require('./controller');
const { protect } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');


router.get('/', protect, getTasks);


router.post('/', protect, requireRole('admin'), createTask);


router.patch('/:id/claim', protect, requireRole('manager'), claimTask);


router.patch('/:id/assign', protect, requireRole('manager'), assignTask);


router.patch('/:id/status', protect, requireRole('user'), updateStatus);


router.patch('/:id/reopen', protect, requireRole('admin', 'manager'), reopenTask);

router.patch('/:id', protect, requireRole('admin'), updateTask);

router.delete('/:id', protect, requireRole('admin'), deleteTask);

module.exports = router;
