'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Tasks');

    if (!table.deadline) {
      await queryInterface.addColumn('Tasks', 'deadline', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!table.priority) {
      await queryInterface.addColumn('Tasks', 'priority', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'medium',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('Tasks');

    if (table.priority) {
      await queryInterface.removeColumn('Tasks', 'priority');
    }

    if (table.deadline) {
      await queryInterface.removeColumn('Tasks', 'deadline');
    }
  },
};
