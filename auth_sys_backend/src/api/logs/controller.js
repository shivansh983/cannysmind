'use strict';
const db = require('../../database/models');

// Fetch the history for a single specific task (Shown at the bottom of the Task Details screen)
async function getTaskLogs(req, res) {
  try {
    const { taskId } = req.params;
    const logs = await db.TaskLog.findAll({
      where: { taskId },
      include: [{ model: db.User, as: 'actor', attributes: ['id', 'name', 'role'] }],
      order: [['createdAt', 'DESC']] // Newest actions at the top
    });
    
    return res.status(200).json({ logs });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Fetch the global activity feed for the Admin/Manager dashboard
async function getActivityFeed(req, res) {
  try {
    const { id: userId, role } = req.user;
    let whereClause = {};

    if (role === 'admin') {
      whereClause = {}; // Admins see every action in the entire company
    } else if (role === 'manager') {
      whereClause = { actorId: userId }; // Managers see their own action history
    } else {
      return res.status(403).json({ error: 'Standard users do not have access to the global feed.' });
    }

    const logs = await db.TaskLog.findAll({
      where: whereClause,
      include: [
        { model: db.User, as: 'actor', attributes: ['id', 'name', 'role'] },
        { model: db.Task, as: 'task', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50 // Keep the payload light
    });

    return res.status(200).json({ logs });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getTaskLogs, getActivityFeed };