const router = require('express').Router();
const { createLocation, getLocations } = require('./controller');
const { protect } = require('../../middleware/auth.middleware');
const upload = require('../../middleware/upload');

router.get('/', protect, getLocations);

router.post('/', protect, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error("MULTER ERROR:", err.message);
            return res.status(400).json({ error: err.message });
        }
        console.log("🚨 FILE ARRIVED! Field:", req.file ? req.file.fieldname : 'NO FILE');
        next();
    });
}, createLocation);

module.exports = router;