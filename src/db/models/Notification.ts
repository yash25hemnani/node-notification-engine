import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

export type NotificationStatus = "queued" | "processing" | "sent" | "failed";

interface NotificationAttributes {
  id: string;
  displayId: string;
  channel: "email" | "push";
  customerId: string;
  customerEmail: string;
  recipient: string;
  templateSlug: string;
  data: object;
  createdBy: string;
  status: NotificationStatus;
  idempotencyKey: string | null;
}

interface NotificationCreationAttributes extends Optional<
  NotificationAttributes,
  "id" | "status" | "displayId"
> {}

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public id!: string;
  public displayId!: string;
  public channel!: "email" | "push";
  public customerId!: string;
  public customerEmail!: string;
  public recipient!: string;
  public templateSlug!: string;
  public data!: object;
  public createdBy!: string;
  public status!: NotificationStatus;
  public idempotencyKey!: string | null;
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    displayId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    channel: {
      type: DataTypes.ENUM("email", "push"),
      allowNull: false,
    },
    customerId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    recipient: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    templateSlug: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    createdBy: {
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
    idempotencyKey: {
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
      where: { displayId: displayId },
      attributes: ["id"],
    });

    exists = !!existingNotification;
  }

  notification.displayId = displayId!;
});