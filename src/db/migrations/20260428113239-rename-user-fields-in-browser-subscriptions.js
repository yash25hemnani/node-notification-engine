// migrations/xxxx-rename-user-fields-in-browser-subscriptions.ts

module.exports = {
  async up(queryInterface) {
    await queryInterface.renameColumn(
      "browser_subscriptions",
      "userId",
      "customerId",
    );

    await queryInterface.renameColumn(
      "browser_subscriptions",
      "userEmail",
      "customerEmail",
    );
  },

  async down(queryInterface) {
    await queryInterface.renameColumn(
      "browser_subscriptions",
      "customerId",
      "userId",
    );

    await queryInterface.renameColumn(
      "browser_subscriptions",
      "customerEmail",
      "userEmail",
    );
  },
};
