"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("templates", "user_id", {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("templates", "user_id");
  },
};