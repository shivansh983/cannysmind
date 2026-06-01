'use strict';
const db = require('../../database/models');

async function addComment(req, res) {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const { id: authorId } = req.user;

    if (!content) return res.status(400).json({ error: 'Content is required' });

    const task = await db.Task.findByPk(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const comment = await db.Comment.create({ taskId, authorId, content });

    await db.TaskLog.create({
      taskId,
      actorId: authorId,
      action: 'COMMENT_ADDED',
      note: 'Added a new comment'
    });

    const fullComment = await db.Comment.findByPk(comment.id, {
      include: [{ model: db.User, as: 'author', attributes: ['id', 'name', 'role'] }]
    });

    return res.status(201).json({ message: 'Comment added', comment: fullComment });
  } catch (error) {
    console.error('Add Comment Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getComments(req, res) {
  try {
    const { taskId } = req.params;
    const comments = await db.Comment.findAll({
      where: { taskId },
      include: [{ model: db.User, as: 'author', attributes: ['id', 'name', 'role'] }],
      order: [['createdAt', 'ASC']]
    });
    
    return res.status(200).json({ comments });
  } catch (error) {
    console.error('Get Comments Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { addComment, getComments };
