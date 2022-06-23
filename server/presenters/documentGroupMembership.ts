import { DocumentGroup } from "@server/models";

type Membership = {
  id: string;
  groupId: string;
  collectionId: string;
  documentId: string;
  permission: string;
};

export default (membership: DocumentGroup): Membership => {
  return {
    id: `${membership.groupId}-${membership.documentId}`,
    groupId: membership.groupId,
    collectionId: membership.collectionId,
    documentId: membership.documentId,
    permission: membership.permission,
  };
};
