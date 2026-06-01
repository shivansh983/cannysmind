'use strict';

const db = require('../../database/models');
const { createTaskSchema, updateTaskSchema } = require('./validator');

// ─── GET TASKS (Role-Based Viewing) ─────────────────────────────
async function getTasks(req, res) {
  try {
    const { id: userId, role } = req.user;
    let whereClause = {};

    // 1. View Logic based on Role
    if (role === 'admin') {
      whereClause = {}; // Admins see everything
    } else if (role === 'manager') {
      // Managers see unassigned 'open' tasks AND tasks they have claimed
      whereClause = { 
        [db.Sequelize.Op.or]: [
          { status: 'open' },
          { managerId: userId }
        ]
      };
    } else {
      // Users ONLY see tasks explicitly assigned to them
      whereClause = { assigneeId: userId };
    }

    const tasks = await db.Task.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        { model: db.User, as: 'creator', attributes: ['id', 'name', 'userName'] },
        { model: db.User, as: 'manager', attributes: ['id', 'name', 'userName'] },
        { model: db.User, as: 'assignee', attributes: ['id', 'name', 'userName'] }
      ]
    });

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error('Get Tasks Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── 1. ADMIN CREATES TASK ─────────────────────────────────────────
async function createTask(req, res) {
  try {
    // Note: You may need to update your validator schema since maxUsers and approverId are gone!
    const validation = createTaskSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: validation.error.issues,
      });
    }

    const { name, description, deadline, priority } = validation.data;
    const { id: userId } = req.user; // The Admin creating it

    const newTask = await db.Task.create({
      name,
      description,
      deadline,
      priority: priority || 'medium',
      userId,
      status: 'open' // Automatically opens the task for managers to see
    });

    // Write to Audit Log
    await db.TaskLog.create({
      taskId: newTask.id,
      actorId: userId,
      action: 'TASK_CREATED',
      toStatus: 'open'
    });

    return res.status(201).json({ message: 'Task created successfully', task: newTask });
  } catch (error) {
    console.error('Create Task Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── 2. MANAGER CLAIMS TASK ────────────────────────────────────────
async function claimTask(req, res) {
  try {
    const { id } = req.params;
    const { id: managerId } = req.user;

    const task = await db.Task.findByPk(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'open') return res.status(400).json({ error: 'Task is not open for claiming' });

    task.managerId = managerId;
    task.status = 'claimed';
    await task.save();

    await db.TaskLog.create({
      taskId: task.id,
      actorId: managerId,
      action: 'TASK_CLAIMED',
      fromStatus: 'open',
      toStatus: 'claimed'
    });

    return res.status(200).json({ message: 'Task claimed successfully', task });
  } catch (error) {
    console.error('Claim Task Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── 3. MANAGER ASSIGNS TASK ───────────────────────────────────────
async function assignTask(req, res) {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;
    const { id: managerId } = req.user;

    const task = await db.Task.findByPk(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.managerId !== managerId) return res.status(403).json({ error: 'You do not manage this task' });

    const assignee = await db.User.findOne({ where: { id: assigneeId, role: 'user' } });
    if (!assignee) return res.status(400).json({ error: 'Assignee must be an existing standard user' });

    const oldStatus = task.status;
    task.assigneeId = assigneeId;
    task.status = 'assigned';
    await task.save();

    await db.TaskLog.create({
      taskId: task.id,
      actorId: managerId,
      action: 'TASK_ASSIGNED',
      fromStatus: oldStatus,
      toStatus: 'assigned'
    });

    return res.status(200).json({ message: 'Task assigned to user', task });
  } catch (error) {
    console.error('Assign Task Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── 4. USER UPDATES STATUS ────────────────────────────────────────
async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // Expects 'in-progress' or 'completed'
    const { id: userId } = req.user;

    if (!['in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status update. Use in-progress or completed.' });
    }

    const task = await db.Task.findByPk(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.assigneeId !== userId) return res.status(403).json({ error: 'This task is not assigned to you' });

    const oldStatus = task.status;
    task.status = status;
    if (status === 'completed') task.completedAt = new Date();
    await task.save();

    await db.TaskLog.create({
      taskId: task.id,
      actorId: userId,
      action: 'STATUS_CHANGED',
      fromStatus: oldStatus,
      toStatus: status
    });

    return res.status(200).json({ message: `Task marked as ${status}`, task });
  } catch (error) {
    console.error('Update Status Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── 5. MANAGER REOPENS TASK ───────────────────────────────────────
async function reopenTask(req, res) {
  try {
    const { id } = req.params;
    const { comment } = req.body; 
    const { id: actorId, role } = req.user;

    if (!comment) {
      return res.status(400).json({ error: 'A comment is required to reopen a task' });
    }

    const task = await db.Task.findByPk(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (role === 'manager' && task.managerId !== actorId) return res.status(403).json({ error: 'You do not manage this task' });
    if (task.status !== 'completed') return res.status(400).json({ error: 'Only completed tasks can be reopened' });

    const oldStatus = task.status;
    task.status = 'reopened';
    task.completedAt = null; 
    await task.save();

    // Create the feedback comment
    await db.Comment.create({
      taskId: task.id,
      authorId: actorId,
      content: comment
    });

    // Write to Audit Log
    await db.TaskLog.create({
      taskId: task.id,
      actorId,
      action: 'TASK_REOPENED',
      fromStatus: oldStatus,
      toStatus: 'reopened',
      note: comment
    });

    return res.status(200).json({ message: 'Task reopened', task });
  } catch (error) {
    console.error('Reopen Task Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const validation = updateTaskSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: validation.error.issues,
      });
    }

    const updates = validation.data;
    const task = await db.Task.findByPk(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const changedFields = [];
    for (const key of ['name', 'description', 'deadline', 'priority']) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        task[key] = updates[key];
        changedFields.push(key);
      }
    }

    if (changedFields.length === 0) {
      return res.status(400).json({ error: 'No editable fields provided' });
    }

    await task.save();

    await db.TaskLog.create({
      taskId: task.id,
      actorId: req.user.id,
      action: 'TASK_UPDATED',
      note: `Updated ${changedFields.join(', ')}`
    });

    return res.json({ message: 'Task updated successfully', task });
  } catch (err) {
    console.error('Update Task Error:', err);
    return res.status(500).json({ error: 'Update failed' });
  }
}

async function deleteTask(req, res) {
  try {
    const { id } = req.params;
    const task = await db.Task.findByPk(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await db.TaskLog.create({
      taskId: task.id,
      actorId: req.user.id,
      action: 'TASK_DELETED',
      note: `Deleted task "${task.name}"`
    });

    await task.destroy();
    return res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete Task Error:', err);
    return res.status(500).json({ error: 'Delete failed' });
  }
}



module.exports = { getTasks, createTask, claimTask, assignTask, updateStatus, reopenTask,updateTask, deleteTask };
