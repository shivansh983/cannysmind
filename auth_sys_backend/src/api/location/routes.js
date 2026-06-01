const router = require('express').Router();
const { createLocation, getLocations } = require('./controller');const { protect } = require('../../middleware/auth.middleware');
const upload = require('../../middleware/upload');

 router.get('/list', protect, getLocations);

router.post('/', protect, upload.single('image'), createLocation);

module.exports = router;