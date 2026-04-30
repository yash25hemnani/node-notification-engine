import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

export type NotificationStatus = "queued" | "processing" | "sent" | "failed";

interface NotificationAttributes {
  id: string;
  display_id: string;
  channel: "email" | "push";
  customer_id: string;
  customer_email: string;
  recipient: string;
  template_slug: string;
  data: object;
  created_by: string;
  status: NotificationStatus;
  idempotency_key: string | null;
}

interface NotificationCreationAttributes extends Optional<
  NotificationAttributes,
  "id" | "status" | "display_id"
> {}

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public id!: string;
  public display_id!: string;
  public channel!: "email" | "push";
  public customer_id!: string;
  public customer_email!: string;
  public recipient!: string;
  public template_slug!: string;
  public data!: object;
  public created_by!: string;
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
    display_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    channel: {
      type: DataTypes.ENUM("email", "push"),
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customer_email: {
      type: DataTypes.STRING,
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
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
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


Notification.beforeValidate(async (notification) => {
  let displayId: string;
  let exists = true;

  while (exists) {
    const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6-digit
    displayId = `NOTIF-${randomNumber}`;

    const existingNotification = await Notification.findOne({
      where: { display_id: displayId },
      attributes: ["id"],
    });

    exists = !!existingNotification;
  }

  notification.display_id = displayId!;
});