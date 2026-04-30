import { ApiKey } from "./ApiKey";
import { Notification } from "./Notification";
import { RefreshToken } from "./RefreshToken";
import { User } from "./User";

User.hasMany(RefreshToken, { foreignKey: "userId", as: "tokens" });
RefreshToken.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(ApiKey, { foreignKey: "userId", as: "apiKeys" });
ApiKey.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Notification, {
  foreignKey: "createdBy",
  as: "createdNotifications",
});

Notification.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

export { ApiKey } from "./ApiKey";
export { Notification } from "./Notification";
export { Template } from "./Template";
export { BrowserSubscription } from "./BrowserSubscription";
export { User } from "./User";
export { RefreshToken } from "./RefreshToken";
