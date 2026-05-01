import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

export type NotificationStatus = "waiting" | "active" | "completed" | "failed";

interface NotificationAttributes {
  id: string;
  displayId: string; 
  jobId: string;
  channel: "email" | "push";
  customerId: string;
  customerEmail: string;
  recipient: string;
  templateSlug: string;
  data: object | null;
  createdBy: string;
  status: NotificationStatus;
  attemptsMade: number | null;
  failedReason: string | null;
  idempotencyKey: string | null;
}

interface NotificationCreationAttributes extends Optional<
  NotificationAttributes,
  "id" | "status" | "displayId" | "attemptsMade" | "failedReason" | "jobId"
> {}

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public id!: string;
  public displayId!: string;
  public jobId!: string;
  public channel!: "email" | "push";
  public customerId!: string;
  public customerEmail!: string;
  public recipient!: string;
  public templateSlug!: string;
  public data!: object | null;
  public createdBy!: string;
  public status!: NotificationStatus;
  public attemptsMade!: number | null;
  public failedReason!: string | null;
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
    jobId: {
      type: DataTypes.STRING,
      allowNull: true,
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
      allowNull: true,
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
      type: DataTypes.ENUM("waiting", "active", "completed", "failed"),
      defaultValue: "waiting",
    },
    attemptsMade: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    failedReason: {
      type: DataTypes.STRING,
      allowNull: true,
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
