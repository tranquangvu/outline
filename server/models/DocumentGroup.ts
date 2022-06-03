import {
  BelongsTo,
  Column,
  Default,
  ForeignKey,
  IsIn,
  Model,
  Table,
  DataType,
  IsUUID,
  PrimaryKey,
} from "sequelize-typescript";
import Collection from "./Collection";
import Document from "./Document";
import Group from "./Group";
import User from "./User";
import Fix from "./decorators/Fix";

@Table({ tableName: "document_groups", modelName: "document_group" })
@Fix
class DocumentGroup extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Default("read_write")
  @IsIn([["read", "read_write", "maintainer"]])
  @Column
  permission: string;

  // associations

  @BelongsTo(() => Collection, "collectionId")
  collection: Collection;

  @ForeignKey(() => Collection)
  @Column(DataType.UUID)
  collectionId: string;

  @BelongsTo(() => Document, "documentId")
  document: Document;

  @ForeignKey(() => Document)
  @Column(DataType.UUID)
  documentId: string;

  @BelongsTo(() => Group, "groupId")
  group: Group;

  @ForeignKey(() => Group)
  @Column(DataType.UUID)
  groupId: string;

  @BelongsTo(() => User, "createdById")
  createdBy: User;
}

export default DocumentGroup;
