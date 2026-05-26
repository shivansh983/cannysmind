const express = require('express');
const router = express.Router();

const authRoutes = require('./api/auth/routes');
const taskRoutes = require('./api/tasks/routes');
//const productRoutes = require('./product.routes');

router.use('/auth', authRoutes);

router.use('/tasks', taskRoutes);

//router.use('/products', productRoutes);

module.exports = router;