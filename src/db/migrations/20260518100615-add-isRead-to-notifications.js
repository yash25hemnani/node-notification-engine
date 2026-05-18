'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add column with default false
    await queryInterface.addColumn('notifications', 'isRead', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Ensure all existing rows are explicitly false
    await queryInterface.sequelize.query(`
      UPDATE notifications
      SET "isRead" = false
      WHERE "isRead" IS NULL OR "isRead" = true
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('notifications', 'isRead');
  },
};