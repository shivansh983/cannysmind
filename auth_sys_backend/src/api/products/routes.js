const router = require('express').Router();
const { createProduct } = require('../controllers/product.controller');

router.post('/', createProduct);

module.exports = router;