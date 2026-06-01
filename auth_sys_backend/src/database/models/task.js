'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      Task.belongsTo(models.User, { foreignKey: 'userId', as: 'creator' });
      Task.belongsTo(models.User, { foreignKey: 'managerId', as: 'manager' });
      Task.belongsTo(models.User, { foreignKey: 'assigneeId', as: 'assignee' });

      Task.hasMany(models.Comment, { foreignKey: 'taskId', as: 'comments' });
      Task.hasMany(models.TaskLog, { foreignKey: 'taskId', as: 'logs' });
    }
  }

  Task.init({
    id: {
      type: DataTypes.STRING(6),
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.TEXT,
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    priority: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'medium',
      validate: {
        isIn: {
          args: [['low', 'medium', 'high', 'critical']],
          msg: 'Invalid priority',
        },
      },
    },
    
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'open',
      validate: {
        isIn: {
          args: [['open', 'claimed', 'assigned', 'in-progress', 'completed', 'reopened']],
          msg: 'Invalid status',
        },
      },
    },

    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    completedAt: DataTypes.DATE,
    duration: {
      type: DataTypes.VIRTUAL,
      get() {
        const started = this.getDataValue('startedAt');
        const completed = this.getDataValue('completedAt');
        if (started && completed) {
          const diffInMs = completed.getTime() - started.getTime();
          return `${Math.floor(diffInMs / 60000)} minutes`;
        }
        return 'Pending';
      },
    },
    
    userId: { type: DataTypes.UUID, allowNull: false },      
    managerId: { type: DataTypes.UUID, allowNull: true },   
    assigneeId: { type: DataTypes.UUID, allowNull: true },   
  }, {
    sequelize,
    modelName: 'Task',
    tableName: 'Tasks',
    hooks: {
      beforeValidate: (task) => {
        if (!task.id) {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let result = '';
          for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          task.id = result;
        }
      },
    },
  });

  return Task;
};
