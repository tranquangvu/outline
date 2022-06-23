import { DocumentUser } from "@server/models";

type Membership = {
  id: string;
  userId: string;
  collectionId: string;
  permission: string;
  documentId: string;
};

export default (membership: DocumentUser): Membership => {
  return {
    id: `${membership.userId}-${membership.documentId}`,
    userId: membership.userId,
    collectionId: membership.collectionId,
    documentId: membership.documentId,
    permission: membership.permission,
  };
};
