'use strict';

const db = require('../../database/models');
const { createTaskSchema } = require('./validator');



async function getTasks(req, res) {
  try {
    const { id: userId, role } = req.user;

    let whereClause = {};

    if (role === 'admin') {
      whereClause = {};
    } else if (role === 'manager') {
      whereClause = { userId };
    } else {
      whereClause = { approvalStatus: 'approved' };
    }

    const tasks = await db.Task.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: db.User,
          as: 'owner',
          attributes: ['id', 'name', 'userName'],
        },
        {
          model: db.User,
          as: 'joinedUsers',
          attributes: ['id', 'name', 'userName'],
          through: { attributes: [] }, 
        },
      ],
    });

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error('Get Tasks Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}



async function createTask(req, res) {
  try {
    const validation = createTaskSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: validation.error.issues,
      });
    }

    const { name, description, approverId, maxUsers } = req.body;
    const { id: userId, role } = req.user;


    const approvalStatus = role === 'admin' ? 'approved' : 'pending';

    const newTask = await db.Task.create({
      name,
      description,
      userId,
      approverId: approverId || null,
      maxUsers: maxUsers || 5,
      approvalStatus,
    });

    return res.status(201).json({
      message: role === 'admin'
        ? 'Task created and approved'
        : 'Task created and sent for approval',
      task: newTask,
    });
  } catch (error) {
    console.error('Create Task Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}



async function approveTask(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be "approved" or "rejected"',
      });
    }

    const task = await db.Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.approvalStatus !== 'pending') {
      return res.status(400).json({
        error: `Task is already "${task.approvalStatus}". Only pending tasks can be actioned.`,
      });
    }

    task.approvalStatus = status;
    task.approverId = req.user.id;
    await task.save();

    return res.status(200).json({
      message: `Task successfully ${status}`,
      task,
    });
  } catch (error) {
    console.error('Approve Task Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}



async function joinTask(req, res) {
  try {
    const { id: taskId } = req.params;
    const { id: userId } = req.user;

    const task = await db.Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.approvalStatus !== 'approved') {
      return res.status(400).json({
        error: 'This task is not available to join yet',
      });
    }

    const alreadyJoined = await db.TaskMembers.findOne({
      where: { taskId, userId },
    });

    if (alreadyJoined) {
      return res.status(400).json({ error: 'You have already joined this task' });
    }

    const currentCount = await db.TaskMembers.count({
      where: { taskId },
    });

    if (currentCount >= task.maxUsers) {
      return res.status(400).json({
        error: `Task is full (${currentCount}/${task.maxUsers} members)`,
      });
    }

    await db.TaskMembers.create({ taskId, userId });

    const updatedTask = await db.Task.findByPk(taskId, {
      include: [{
        model: db.User,
        as: 'joinedUsers',
        attributes: ['id', 'name', 'userName'],
        through: { attributes: [] },
      }],
    });

    return res.status(200).json({
      message: 'Successfully joined task',
      task: updatedTask,
      spotsRemaining: task.maxUsers - (currentCount + 1),
    });
  } catch (error) {
    console.error('Join Task Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}



async function completeTask(req, res) {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const task = await db.Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden: Only the task creator can complete this task',
      });
    }

    task.completedAt = new Date();
    task.isActive = false;
    await task.save();

    const updatedTask = await db.Task.findByPk(id);

    return res.status(200).json({
      message: 'Task completed successfully',
      task: updatedTask,
      timeTaken: updatedTask.duration,
    });
  } catch (error) {
    console.error('Complete Task Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getTasks, createTask, approveTask, joinTask, completeTask };