module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn("uploaded_files", "notificationId", {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "notifications",
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    await queryInterface.addIndex("uploaded_files", ["notificationId"]);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("uploaded_files", ["notificationId"]);
    await queryInterface.removeColumn("uploaded_files", "notificationId");
  },
};