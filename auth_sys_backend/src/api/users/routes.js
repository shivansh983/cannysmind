const router = require('express').Router();
const db = require('../../database/models');
const { protect } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { Op } = require('sequelize');

router.get('/search', protect, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { q } = req.query;
    const users = await db.User.findAll({
      where: { 
        name: { [Op.like]: `${q}%` } 
      },
      attributes: ['id', 'name']
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Search failed' });
  }
});

module.exports = router;