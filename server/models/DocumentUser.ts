import {
  Column,
  ForeignKey,
  BelongsTo,
  Default,
  IsIn,
  Table,
  DataType,
  Model,
  PrimaryKey,
  IsUUID,
} from "sequelize-typescript";
import Collection from "./Collection";
import Document from "./Document";
import User from "./User";
import Fix from "./decorators/Fix";

@Table({ tableName: "document_users", modelName: "document_user" })
@Fix
class DocumentUser extends Model {
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

  @BelongsTo(() => User, "userId")
  user: User;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId: string;

  @BelongsTo(() => User, "createdById")
  createdBy: User;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  createdById: string;
}

export default DocumentUser;
