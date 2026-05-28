'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate(models) {
      Comment.belongsTo(models.Task, { foreignKey: 'taskId', as: 'task' });
      Comment.belongsTo(models.User, { foreignKey: 'authorId', as: 'author' });
    }
  }
  Comment.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    taskId: { type: DataTypes.STRING(6), allowNull: false },
    authorId: { type: DataTypes.UUID, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false }
  }, { sequelize, modelName: 'Comment', tableName: 'Comments' });
  return Comment;
};