"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("notifications", "display_id", {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });

    await queryInterface.addColumn("notifications", "created_by", {
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
    await queryInterface.removeColumn("notifications", "created_by");
    await queryInterface.removeColumn("notifications", "display_id");
  },
};