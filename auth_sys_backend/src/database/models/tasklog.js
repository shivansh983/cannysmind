'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TaskLog extends Model {
    static associate(models) {
      TaskLog.belongsTo(models.Task, { foreignKey: 'taskId', as: 'task' });
      TaskLog.belongsTo(models.User, { foreignKey: 'actorId', as: 'actor' });
    }
  }
  TaskLog.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    taskId: { type: DataTypes.STRING(6), allowNull: false },
    actorId: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    fromStatus: { type: DataTypes.STRING, allowNull: true },
    toStatus: { type: DataTypes.STRING, allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true }
  }, { sequelize, modelName: 'TaskLog', tableName: 'TaskLogs' });
  return TaskLog;
};