"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add column FIRST
    await queryInterface.addColumn("templates", "name", {
      type: Sequelize.STRING,
      allowNull: true, // keep true initially
    });

    // Backfill (optional but recommended)
    await queryInterface.sequelize.query(`
      UPDATE templates SET name = slug
    `);

    // Make it NOT NULL
    await queryInterface.changeColumn("templates", "name", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("templates", "name");
  },
};