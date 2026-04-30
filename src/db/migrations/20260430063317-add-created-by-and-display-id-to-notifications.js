"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("notifications", "displayId", {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });

    await queryInterface.addColumn("notifications", "createdBy", {
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
    await queryInterface.removeColumn("notifications", "createdBy");
    await queryInterface.removeColumn("notifications", "displayId");
  },
};