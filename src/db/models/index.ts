import { ApiKey } from "./ApiKey";
import { Notification } from "./Notification";
import { RefreshToken } from "./RefreshToken";
import { Template } from "./Template";
import { TemplateAttachment } from "./TemplateAttachment";
import { UploadedFile } from "./UploadedFile";
import { User } from "./User";

// ── User Relations ─────────────────────────────────────
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

User.hasMany(UploadedFile, {
  foreignKey: "uploadedBy",
  as: "uploadedFiles",
});
UploadedFile.belongsTo(User, {
  foreignKey: "uploadedBy",
  as: "uploader",
});

// ── Template Relations ─────────────────────────────────
Template.hasMany(TemplateAttachment, {
  foreignKey: "templateId",
  as: "attachments",
});
TemplateAttachment.belongsTo(Template, {
  foreignKey: "templateId",
  as: "template",
});

// ── Uploaded File Relations ────────────────────────────
UploadedFile.hasMany(TemplateAttachment, {
  foreignKey: "fileId",
  as: "templateLinks",
});
TemplateAttachment.belongsTo(UploadedFile, {
  foreignKey: "fileId",
  as: "file",
});

// ── Exports ────────────────────────────────────────────
export { ApiKey } from "./ApiKey";
export { BrowserSubscription } from "./BrowserSubscription";
export { Notification } from "./Notification";
export { RefreshToken } from "./RefreshToken";
export { Template } from "./Template";
export { User } from "./User";

