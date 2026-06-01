'use strict';
const db = require('../../database/models');

async function getTaskLogs(req, res) {
  try {
    const { taskId } = req.params;
    const logs = await db.TaskLog.findAll({
      where: { taskId },
      include: [{ model: db.User, as: 'actor', attributes: ['id', 'name', 'role'] }],
      order: [['createdAt', 'DESC']] 
    });
    
    return res.status(200).json({ logs });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getActivityFeed(req, res) {
  try {
    const { id: userId, role } = req.user;
    let whereClause = {};

    if (role === 'admin') {
      whereClause = {}; 
    } else if (role === 'manager') {
      whereClause = { actorId: userId }; 
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
      limit: 50 
    });

    return res.status(200).json({ logs });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getTaskLogs, getActivityFeed };