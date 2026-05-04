import { DataTypes, Model, NonAttribute } from "sequelize";
import { sequelize } from "../sequelize";
import { Template } from "./Template";
import { UploadedFile } from "./UploadedFile";

export class TemplateAttachment extends Model {
  declare id: string;
  declare templateId: string;
  declare fileId: string;
  declare filename: string;
  declare mimeType: string;
  declare size: number;
  declare file: NonAttribute<UploadedFile>;
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
      references: {
        model: "uploaded_files",
        key: "id",
      },
      onDelete: "CASCADE",
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
