'use strict';
const router = require('express').Router();
const { addComment, getComments } = require('./controller');
const { protect } = require('../../middleware/auth.middleware');

router.get('/:taskId', protect, getComments);

router.post('/:taskId', protect, addComment);

module.exports = router;