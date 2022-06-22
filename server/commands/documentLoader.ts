import invariant from "invariant";
import { Op, ScopeOptions } from "sequelize";
import isUUID from "validator/lib/isUUID";
import {
  NotFoundError,
  InvalidRequestError,
  AuthorizationError,
  AuthenticationError,
} from "@server/errors";
import {
  Collection,
  Document,
  Share,
  User,
  Team,
  Group,
  GroupUser,
  DocumentGroup,
  DocumentUser,
  CollectionGroup,
  CollectionUser,
} from "@server/models";
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
          model: Document.unscoped(),
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
      document = await Document.findByPk(id, {
        userId: user ? user.id : undefined,
        paranoid: false,
      });
      // otherwise, if the user has an authenticated session make sure to load
      // with their details so that we can return the correct policies, they may
      // be able to edit the shared document
    } else if (user) {
      document = await Document.findOne({
        where: {
          id: share.document.id,
        },
        include: [
          {
            model: DocumentUser,
            as: "documentMemberships",
            where: {
              userId: user?.id,
            },
            required: false,
          },
          {
            model: DocumentGroup,
            as: "documentGroupMemberships",
            required: false,
            // use of "separate" property: sequelize breaks when there are
            // nested "includes" with alternating values for "required"
            // see https://github.com/sequelize/sequelize/issues/9869
            separate: true,
            // include for groups that are members of this collection,
            // of which userId is a member of, resulting in:
            // CollectionGroup [inner join] Group [inner join] GroupUser [where] userId
            include: [
              {
                model: Group,
                as: "group",
                required: true,
                include: [
                  {
                    model: GroupUser,
                    as: "groupMemberships",
                    required: true,
                    where: {
                      userId: user?.id,
                    },
                  },
                ],
              },
            ],
          },
          {
            model: Collection,
            include: [
              {
                model: CollectionUser,
                as: "memberships",
                where: {
                  userId: user.id,
                },
                required: false,
              },
              {
                model: CollectionGroup,
                as: "collectionGroupMemberships",
                required: false,
                // use of "separate" property: sequelize breaks when there are
                // nested "includes" with alternating values for "required"
                // see https://github.com/sequelize/sequelize/issues/9869
                separate: true,
                // include for groups that are members of this collection,
                // of which userId is a member of, resulting in:
                // CollectionGroup [inner join] Group [inner join] GroupUser [where] userId
                include: [
                  {
                    model: Group,
                    as: "group",
                    required: true,
                    include: [
                      {
                        model: GroupUser,
                        as: "groupMemberships",
                        required: true,
                        where: {
                          userId: user?.id,
                        },
                      },
                    ],
                  },
                ],
              },
            ],
            as: "collection",
          },
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

    if (!user) {
      document.documentMemberships = [];
      document.documentGroupMemberships = [];
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
    if (id && !isUUID(id)) {
      throw NotFoundError();
    }

    document = await Document.findOne({
      where: {
        id,
      },
      include: [
        {
          model: DocumentUser,
          as: "documentMemberships",
          where: {
            userId: user?.id,
          },
          required: false,
        },
        {
          model: DocumentGroup,
          as: "documentGroupMemberships",
          required: false,
          separate: true,
          include: [
            {
              model: Group,
              as: "group",
              required: true,
              include: [
                {
                  model: GroupUser,
                  as: "groupMemberships",
                  required: true,
                  where: {
                    userId: user?.id,
                  },
                },
              ],
            },
          ],
        },
        {
          model: Collection,
          include: [
            {
              model: CollectionUser,
              as: "memberships",
              where: {
                userId: user?.id,
              },
              required: false,
            },
            {
              model: CollectionGroup,
              as: "collectionGroupMemberships",
              required: false,
              separate: true,
              include: [
                {
                  model: Group,
                  as: "group",
                  required: true,
                  include: [
                    {
                      model: GroupUser,
                      as: "groupMemberships",
                      required: true,
                      where: {
                        userId: user?.id,
                      },
                    },
                  ],
                },
              ],
            },
          ],
          as: "collection",
        },
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
  }

  return {
    document,
    share,
    collection,
  };
}
