const express = require('express');
const router = express.Router();
const controller = require('./controller');
const validateZod = require('../../middleware/validateZod');
const { authSchema, loginSchema } = require('./validator');

router.post('/signup', validateZod(authSchema), controller.signup);

router.post('/login', validateZod(loginSchema), controller.login);

router.post('/logout', controller.logout);

module.exports = router;