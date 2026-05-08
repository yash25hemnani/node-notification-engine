module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn("uploaded_files", "source", {
      type: DataTypes.ENUM("local", "upload"),
      allowNull: false,
      defaultValue: "local",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("uploaded_files", "source");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_uploaded_files_source";');
  },
};