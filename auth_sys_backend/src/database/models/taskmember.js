'use strict';
const { Model } = require('sequelize');


module.exports = (sequelize, DataTypes) => {
  class TaskMembers extends Model {
    static associate(models) {
     
    }
  }

  TaskMembers.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    taskId: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'TaskMembers',
    tableName: 'TaskMembers',
  });

  return TaskMembers;
};