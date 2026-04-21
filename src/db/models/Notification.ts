import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

export type NotificationStatus = "queued" | "processing" | "sent" | "failed";

interface NotificationAttributes {
  id: string;
  channel: "email" | "push";
  recipient: string;
  template_slug: string;
  data: object;
  status: NotificationStatus;
  idempotency_key: string | null;
}

interface NotificationCreationAttributes extends Optional<
  NotificationAttributes,
  "id" | "status"
> {}

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public id!: string;
  public channel!: "email" | "push";
  public recipient!: string;
  public template_slug!: string;
  public data!: object;
  public status!: NotificationStatus;
  public idempotency_key!: string | null;
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    channel: {
      type: DataTypes.ENUM("email", "push"),
      allowNull: false,
    },
    recipient: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    template_slug: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("queued", "processing", "sent", "failed"),
      defaultValue: "queued",
    },
    idempotency_key: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: "notifications",
    timestamps: true,
  },
);
