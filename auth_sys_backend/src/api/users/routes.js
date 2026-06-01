const router = require('express').Router();
const db = require('../../database/models');
const { protect } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { Op } = require('sequelize');

router.get('/search', protect, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ users: [] });

    const users = await db.User.findAll({
      where: {
        role: 'user',
        [Op.or]: [
          { name: { [Op.iLike]: `${q}%` } },
          { userName: { [Op.iLike]: `${q}%` } }
        ]
      },
      attributes: ['id', 'name', 'userName', 'role'],
      order: [['name', 'ASC']],
      limit: 20
    });

    res.json({ users });
  } catch (err) {
    console.error('User search failed:', err);
    res.status(500).json({ message: 'Search failed' });
  }
});

module.exports = router;
