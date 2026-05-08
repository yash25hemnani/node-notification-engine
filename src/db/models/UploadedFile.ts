import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelize";

import { ForeignKey } from "sequelize";
import { Notification } from "./Notification";

export class UploadedFile extends Model {
  declare id: string;
  declare filename: string;
  declare originalName: string;
  declare mimeType: string;
  declare size: number;
  declare path: string;
  declare uploadedBy: string | null;
  declare notificationId: ForeignKey<string> | null;
  declare notification?: Notification;
  declare source: string;
}

UploadedFile.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uploadedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notificationId: {
      type: DataTypes.UUID, // match the PK type of Notification
      allowNull: true,
      references: {
        model: "notifications",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    source: {
      type: DataTypes.ENUM("local", "upload"),
      allowNull: false,
      defaultValue: "local",
    },
  },
  {
    sequelize,
    tableName: "uploaded_files",
  },
);
