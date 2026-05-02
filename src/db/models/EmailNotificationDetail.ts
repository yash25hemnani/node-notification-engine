import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

interface EmailNotificationDetailAttributes {
  id: string;
  notificationId: string;
  to: string[];
  cc: string[] | null;
  bcc: string[] | null;
  replyTo: string | null;
}

interface EmailNotificationDetailCreationAttributes extends Optional<
  EmailNotificationDetailAttributes,
  "id" | "cc" | "bcc" | "replyTo"
> {}

export class EmailNotificationDetail
  extends Model<
    EmailNotificationDetailAttributes,
    EmailNotificationDetailCreationAttributes
  >
  implements EmailNotificationDetailAttributes
{
  declare id: string;
  declare notificationId: string;
  declare to: string[];
  declare cc: string[] | null;
  declare bcc: string[] | null;
  declare replyTo: string | null;
}

EmailNotificationDetail.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    notificationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "notifications", key: "id" },
      onDelete: "CASCADE",
    },
    to: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    cc: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: null,
    },
    bcc: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: null,
    },
    replyTo: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: "email_notification_details",
  },
);
