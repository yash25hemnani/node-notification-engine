import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelize";
import { Template } from "./Template";

export class TemplateAttachment extends Model {
  declare id: string;
  declare templateId: string;
  declare fileId: string;
  declare filename: string;
  declare mimeType: string;
  declare size: number;
}

TemplateAttachment.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    templateId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "templates",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    fileId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    filename: {
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
  },
  {
    sequelize,
    tableName: "template_attachments",
  },
);
