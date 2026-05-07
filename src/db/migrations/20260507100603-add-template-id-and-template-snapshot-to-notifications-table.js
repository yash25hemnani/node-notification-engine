"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("notifications", "templateId", {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "templates",
        key: "id",
      },
      onDelete: "RESTRICT",
    });

    await queryInterface.addColumn("notifications", "templateSnapshot", {
      type: Sequelize.JSONB,
      allowNull: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("notifications", "templateSnapshot");
    await queryInterface.removeColumn("notifications", "templateId");
  },
};