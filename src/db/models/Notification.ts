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
  // FK to templates table — enforces the template exists at insert time
  templateId: string;
  // Denormalized slug snapshot — stays accurate even if slug is renamed later
  templateSlug: string;
  // Full snapshot of the template at the moment the notification was sent —
  // ensures historical records are unaffected by future template edits
  templateSnapshot: object;
  // Dynamic values merged into the template for this specific send
  data: object | null;
  createdBy: string;
  status: NotificationStatus;
  attemptsMade: number | null;
  failedReason: string | null;
  idempotencyKey: string | null;
}

interface NotificationCreationAttributes extends Optional<
  NotificationAttributes,
  | "id"
  | "status"
  | "displayId"
  | "attemptsMade"
  | "failedReason"
  | "jobId"
  | "idempotencyKey"
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
  public templateId!: string;
  public templateSlug!: string;
  public templateSnapshot!: object;
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
    templateId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "templates",
        key: "id",
      },
      // Keep notification, just remove template reference if template is deleted
      onDelete: "SET NULL",
    },
    templateSlug: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    templateSnapshot: {
      type: DataTypes.JSONB,
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
      allowNull: false,
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

// Auto-generate a unique human-readable display ID before each insert.
// Retries until a non-colliding ID is found — collisions are extremely
// unlikely (1-in-900k per attempt) but handled safely with the loop.
Notification.beforeValidate(async (notification) => {
  // Skip if displayId is already set (e.g. on updates)
  if (notification.displayId) return;

  let displayId: string;
  let exists = true;

  while (exists) {
    const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6-digit
    displayId = `NOTIF-${randomNumber}`;

    const existing = await Notification.findOne({
      where: { displayId },
      attributes: ["id"],
    });

    exists = !!existing;
  }

  notification.displayId = displayId!;
});
