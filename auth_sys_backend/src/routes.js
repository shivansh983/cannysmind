const express = require('express');
const router = express.Router();

const authRoutes = require('./api/auth/routes');
const taskRoutes = require('./api/tasks/routes');
//const productRoutes = require('./product.routes');
const commentRoutes = require('./api/comments/routes'); 
const logRoutes = require('./api/logs/routes');
const userRoutes = require('./api/users/routes');
const locationRoutes = require('./api/location/routes');

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/comments', commentRoutes); 
router.use('/logs', logRoutes);
router.use('/users', userRoutes);
router.use('/location', locationRoutes);
//router.use('/products', productRoutes);

module.exports = router;
