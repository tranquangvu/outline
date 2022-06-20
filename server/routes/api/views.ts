import Router from "koa-router";
import { ScopeOptions } from "sequelize";
import auth from "@server/middlewares/authentication";
import { View, Document, Event, Collection } from "@server/models";
import { authorize } from "@server/policies";
import { presentView } from "@server/presenters";
import { assertUuid } from "@server/validation";

const router = new Router();

router.post("views.list", auth(), async (ctx) => {
  const { documentId } = ctx.body;
  assertUuid(documentId, "documentId is required");

  const { user } = ctx.state;
  const viewScope: Readonly<ScopeOptions> = {
    method: ["withViews", user.id],
  };
  const documentMembershipScope: Readonly<ScopeOptions> = {
    method: ["withMembership", user.id],
  };
  const document = await Document.scope([
    "defaultScope",
    viewScope,
    documentMembershipScope,
  ]).findOne({
    where: {
      id: documentId,
    },
    include: [
      {
        model: Collection.scope([documentMembershipScope]),
        as: "collection",
      },
    ],
  });
  authorize(user, "read", document);
  const views = await View.findByDocument(documentId);

  ctx.body = {
    data: views.map(presentView),
  };
});

router.post("views.create", auth(), async (ctx) => {
  const { documentId } = ctx.body;
  assertUuid(documentId, "documentId is required");

  const { user } = ctx.state;
  const viewScope: Readonly<ScopeOptions> = {
    method: ["withViews", user.id],
  };
  const documentMembershipScope: Readonly<ScopeOptions> = {
    method: ["withMembership", user.id],
  };
  const document = await Document.scope([
    "defaultScope",
    viewScope,
    documentMembershipScope,
  ]).findOne({
    where: {
      id: documentId,
    },
    include: [
      {
        model: Collection.scope([documentMembershipScope]),
        as: "collection",
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
