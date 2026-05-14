"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the old foreign key constraint with RESTRICT
    await queryInterface.removeConstraint("notifications", "notifications_templateId_fkey");

    // Modify the templateId column to be nullable
    await queryInterface.changeColumn("notifications", "templateId", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "templates",
        key: "id",
      },
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverse: remove the new constraint
    await queryInterface.removeConstraint("notifications", "notifications_templateId_fkey");

    // Restore the old constraint
    await queryInterface.changeColumn("notifications", "templateId", {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "templates",
        key: "id",
      },
      onDelete: "RESTRICT",
    });
  },
};
