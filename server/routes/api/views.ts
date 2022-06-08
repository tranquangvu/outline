import Router from "koa-router";
import { ScopeOptions } from "sequelize";
import auth from "@server/middlewares/authentication";
import {
  View,
  Document,
  Event,
  DocumentGroup,
  DocumentUser,
  Group,
  GroupUser,
} from "@server/models";
import { authorize } from "@server/policies";
import { presentView } from "@server/presenters";
import { assertUuid } from "@server/validation";

const router = new Router();

router.post("views.list", auth(), async (ctx) => {
  const { documentId, collectionId } = ctx.body;
  assertUuid(documentId, "documentId is required");
  assertUuid(collectionId, "collectionId is required");

  const { user } = ctx.state;
  const collectionScope: Readonly<ScopeOptions> = {
    method: ["withCollection", user.id],
  };
  const viewScope: Readonly<ScopeOptions> = {
    method: ["withViews", user.id],
  };
  const document = await Document.scope([
    "defaultScope",
    collectionScope,
    viewScope,
  ]).findOne({
    where: {
      id: documentId,
      collectionId,
    },
    include: [
      {
        model: DocumentUser,
        as: "documentMemberships",
        where: {
          userId: user.id,
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
                  userId: user.id,
                },
              },
            ],
          },
        ],
      },
    ],
  });
  console.log(document?.collection.memberships);
  authorize(user, "read", document);
  const views = await View.findByDocument(documentId);

  ctx.body = {
    data: views.map(presentView),
  };
});

router.post("views.create", auth(), async (ctx) => {
  const { documentId, collectionId } = ctx.body;
  assertUuid(documentId, "documentId is required");
  assertUuid(collectionId, "collectionId is required");

  const { user } = ctx.state;
  const collectionScope: Readonly<ScopeOptions> = {
    method: ["withCollection", user.id],
  };
  const viewScope: Readonly<ScopeOptions> = {
    method: ["withViews", user.id],
  };
  const document = await Document.scope([
    "defaultScope",
    collectionScope,
    viewScope,
  ]).findOne({
    where: {
      id: documentId,
      collectionId,
    },
    include: [
      {
        model: DocumentUser,
        as: "documentMemberships",
        where: {
          userId: user.id,
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
                  userId: user.id,
                },
              },
            ],
          },
        ],
      },
    ],
  });
  authorize(user, "read", document);

  const view = await View.incrementOrCreate({
    documentId,
    userId: user.id,
  });

  await Event.create({
    name: "views.create",
    actorId: user.id,
    documentId: document.id,
    collectionId: document.collectionId,
    teamId: user.teamId,
    data: {
      title: document.title,
    },
    ip: ctx.request.ip,
  });
  view.user = user;

  ctx.body = {
    data: presentView(view),
  };
});

export default router;
