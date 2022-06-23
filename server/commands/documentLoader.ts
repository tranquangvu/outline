import invariant from "invariant";
import { Op, ScopeOptions } from "sequelize";
import isUUID from "validator/lib/isUUID";
import { SLUG_URL_REGEX } from "@shared/utils/urlHelpers";
import {
  NotFoundError,
  InvalidRequestError,
  AuthorizationError,
  AuthenticationError,
} from "@server/errors";
import { Collection, Document, Share, User, Team } from "@server/models";
import { authorize, can } from "@server/policies";

type Props = {
  id?: string;
  shareId?: string;
  user?: User;
};

type Result = {
  document: Document;
  share?: Share;
  collection: Collection;
};

export default async function loadDocument({
  id,
  shareId,
  user,
}: Props): Promise<Result> {
  let document;
  let collection;
  let share;

  if (!shareId && !(id && user)) {
    throw AuthenticationError(`Authentication or shareId required`);
  }

  if (shareId) {
    const collectionScope: Readonly<ScopeOptions> = {
      method: ["withCollectionPermissions", user?.id],
    };
    const membershipScope: Readonly<ScopeOptions> = {
      method: ["withMembership", user?.id],
    };
    share = await Share.findOne({
      where: {
        revokedAt: {
          [Op.is]: null,
        },
        id: shareId,
      },
      include: [
        {
          // unscoping here allows us to return unpublished documents
          model: Document.scope([collectionScope, membershipScope]),
          include: [
            {
              model: User,
              as: "createdBy",
              paranoid: false,
            },
            {
              model: User,
              as: "updatedBy",
              paranoid: false,
            },
          ],
          required: true,
          as: "document",
        },
      ],
    });

    if (!share || share.document.archivedAt) {
      throw InvalidRequestError("Document could not be found for shareId");
    }

    // It is possible to pass both an id and a shareId to the documents.info
    // endpoint. In this case we'll load the document based on the `id` and check
    // if the provided share token allows access. This is used by the frontend
    // to navigate nested documents from a single share link.
    if (id) {
      // document = await Document.findByPk(id, {
      //   userId: user ? user.id : undefined,
      //   paranoid: false,
      // });
      document = await Document.scope([
        collectionScope,
        membershipScope,
      ]).findOne({
        where: {
          id,
        },
        include: [
          {
            model: User,
            as: "createdBy",
            paranoid: false,
          },
          {
            model: User,
            as: "updatedBy",
            paranoid: false,
          },
        ],
      });
      // otherwise, if the user has an authenticated session make sure to load
      // with their details so that we can return the correct policies, they may
      // be able to edit the shared document
    } else if (user) {
      // document = await Document.findByPk(share.documentId, {
      //   userId: user.id,
      //   paranoid: false,
      // });
      document = await Document.scope([
        collectionScope,
        membershipScope,
      ]).findOne({
        where: {
          id: share.documentId,
        },
        include: [
          {
            model: User,
            as: "createdBy",
            paranoid: false,
          },
          {
            model: User,
            as: "updatedBy",
            paranoid: false,
          },
        ],
      });
    } else {
      document = share.document;
    }

    if (!document) {
      throw NotFoundError("Document could not be found for shareId");
    }

    if (!document.collection.memberships) {
      document.collection.memberships = [];
    }

    if (!document.collection.collectionGroupMemberships) {
      document.collection.collectionGroupMemberships = [];
    }

    // If the user has access to read the document, we can just update
    // the last access date and return the document without additional checks.
    const canReadDocument = user && can(user, "read", document);

    if (canReadDocument) {
      await share.update({
        lastAccessedAt: new Date(),
      });

      // Cannot use document.collection here as it does not include the
      // documentStructure by default through the relationship.
      collection = await Collection.findByPk(document.collectionId);
      if (!collection) {
        throw NotFoundError("Collection could not be found for document");
      }

      return {
        document,
        share,
        collection,
      };
    }

    // "published" === on the public internet.
    // We already know that there's either no logged in user or the user doesn't
    // have permission to read the document, so we can throw an error.
    if (!share.published) {
      throw AuthorizationError();
    }

    // It is possible to disable sharing at the collection so we must check
    collection = await Collection.findByPk(document.collectionId);
    invariant(collection, "collection not found");

    if (!collection.sharing) {
      throw AuthorizationError();
    }

    // If we're attempting to load a document that isn't the document originally
    // shared then includeChildDocuments must be enabled and the document must
    // still be active and nested within the shared document
    if (share.document.id !== document.id) {
      if (!share.includeChildDocuments) {
        throw AuthorizationError();
      }

      const childDocumentIds = await share.document.getChildDocumentIds({
        archivedAt: {
          [Op.is]: null,
        },
      });
      if (!childDocumentIds.includes(document.id)) {
        throw AuthorizationError();
      }
    }

    // It is possible to disable sharing at the team level so we must check
    const team = await Team.findByPk(document.teamId);
    invariant(team, "team not found");

    if (!team.sharing) {
      throw AuthorizationError();
    }

    await share.update({
      lastAccessedAt: new Date(),
    });
  } else {
    // document = await Document.findByPk(id as string, {
    //   userId: user ? user.id : undefined,
    //   paranoid: false,
    // });

    const collectionScope: Readonly<ScopeOptions> = {
      method: ["withCollectionPermissions", user?.id],
    };
    const membershipScope: Readonly<ScopeOptions> = {
      method: ["withMembership", user?.id],
    };

    if (id && !isUUID(id)) {
      const match = id.match(SLUG_URL_REGEX);

      if (match) {
        document = await Document.scope([
          collectionScope,
          membershipScope,
        ]).findOne({
          where: {
            urlId: match?.[1],
          },
          include: [
            {
              model: User,
              as: "createdBy",
              paranoid: false,
            },
            {
              model: User,
              as: "updatedBy",
              paranoid: false,
            },
          ],
        });
      }
    } else {
      document = await Document.scope([
        collectionScope,
        membershipScope,
      ]).findOne({
        where: {
          id,
        },
        include: [
          {
            model: User,
            as: "createdBy",
            paranoid: false,
          },
          {
            model: User,
            as: "updatedBy",
            paranoid: false,
          },
        ],
      });
    }

    if (!document) {
      throw NotFoundError();
    }

    const collectionMembershipScope: Readonly<ScopeOptions> = {
      method: ["withMembership", user ? user.id : undefined],
    };
    collection = await Collection.scope([collectionMembershipScope]).findOne({
      where: {
        id: document.collectionId,
      },
    });

    if (collection) {
      document.collection = collection;
    } else {
      collection = document.collection;
    }

    if (document.deletedAt) {
      // don't send data if user cannot restore deleted doc
      user && authorize(user, "restore", document);
    } else {
      user && authorize(user, "read", document);
    }

    collection = document.collection;
  }

  return {
    document,
    share,
    collection,
  };
}
