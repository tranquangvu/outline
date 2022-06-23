import { ScopeOptions } from "sequelize";
import {
  Document,
  Collection,
  DocumentUser,
  DocumentGroup,
} from "@server/models";
import {
  buildUser,
  buildTeam,
  buildGroup,
  buildDocument,
  buildCollection,
} from "@server/test/factories";
import { flushdb } from "@server/test/support";
import { serialize } from "./index";

beforeEach(() => flushdb());

describe("read_write collection", () => {
  it("should allow read write permissions for team member", async () => {
    const team = await buildTeam();
    const user = await buildUser({
      teamId: team.id,
    });
    const collection = await buildCollection({
      teamId: team.id,
      permission: "read_write",
    });
    const document = await buildDocument({
      teamId: team.id,
      collectionId: collection.id,
    });
    document.documentMemberships = [];
    document.documentGroupMemberships = [];
    const abilities = serialize(user, document);
    expect(abilities.read).toEqual(true);
    expect(abilities.download).toEqual(true);
    expect(abilities.update).toEqual(true);
    expect(abilities.createChildDocument).toEqual(true);
    expect(abilities.archive).toEqual(true);
    expect(abilities.delete).toEqual(true);
    expect(abilities.share).toEqual(true);
    expect(abilities.move).toEqual(true);
  });
});

describe("read collection", () => {
  it("should allow read only permissions permissions for team member", async () => {
    const team = await buildTeam();
    const user = await buildUser({
      teamId: team.id,
    });
    const collection = await buildCollection({
      teamId: team.id,
      permission: "read",
    });
    const document = await buildDocument({
      teamId: team.id,
      collectionId: collection.id,
    });
    document.documentMemberships = [];
    document.documentGroupMemberships = [];
    const abilities = serialize(user, document);
    expect(abilities.read).toEqual(true);
    expect(abilities.download).toEqual(true);
    expect(abilities.update).toEqual(false);
    expect(abilities.createChildDocument).toEqual(false);
    expect(abilities.archive).toEqual(false);
    expect(abilities.delete).toEqual(false);
    expect(abilities.share).toEqual(false);
    expect(abilities.move).toEqual(false);
  });
});

describe("private collection", () => {
  it("should allow no permissions for team member", async () => {
    const team = await buildTeam();
    const user = await buildUser({
      teamId: team.id,
    });
    const collection = await buildCollection({
      teamId: team.id,
      permission: null,
    });
    const document = await buildDocument({
      teamId: team.id,
      collectionId: collection.id,
    });
    document.documentMemberships = [];
    document.documentGroupMemberships = [];
    const abilities = serialize(user, document);
    expect(abilities.read).toEqual(false);
    expect(abilities.download).toEqual(false);
    expect(abilities.update).toEqual(false);
    expect(abilities.createChildDocument).toEqual(false);
    expect(abilities.archive).toEqual(false);
    expect(abilities.delete).toEqual(false);
    expect(abilities.share).toEqual(false);
    expect(abilities.move).toEqual(false);
  });
});

describe("document read_write permission", () => {
  it("should allow read write permissions for team member", async () => {
    const team = await buildTeam();
    const user = await buildUser({
      teamId: team.id,
    });
    const collection = await buildCollection({
      teamId: team.id,
      permission: "read_write",
    });
    const document = await buildDocument({
      teamId: team.id,
      collectionId: collection.id,
      permission: "read_write",
    });
    const membershipScope: Readonly<ScopeOptions> = {
      method: ["withMembership", user.id],
    };
    // reload to get membership
    const reloaded = await Document.scope([membershipScope]).findOne({
      where: {
        id: document.id,
      },
      include: [
        {
          model: Collection.scope([membershipScope]),
          as: "collection",
        },
      ],
    });
    const abilities = serialize(user, reloaded);
    expect(abilities.read).toEqual(true);
    expect(abilities.update).toEqual(true);
    expect(abilities.share).toEqual(true);
  });

  it("should allow read write permissions for member who has document read_write permissions in private collection", async () => {
    const team = await buildTeam();
    const user = await buildUser({
      teamId: team.id,
    });
    const collection = await buildCollection({
      teamId: team.id,
      permission: null,
    });
    const document = await buildDocument({
      teamId: team.id,
      collectionId: collection.id,
      permission: "read_write",
    });
    await DocumentUser.create({
      createdById: user.id,
      collectionId: collection.id,
      documentId: document.id,
      userId: user.id,
      permission: "read_write",
    });
    const membershipScope: Readonly<ScopeOptions> = {
      method: ["withMembership", user.id],
    };
    // reload to get membership
    const reloaded = await Document.scope([membershipScope]).findOne({
      where: {
        id: document.id,
      },
      include: [
        {
          model: Collection.scope([membershipScope]),
          as: "collection",
        },
      ],
    });
    const abilities = serialize(user, reloaded);
    expect(abilities.read).toEqual(true);
    expect(abilities.update).toEqual(true);
    expect(abilities.share).toEqual(true);
  });

  it("should allow override with read only membership permission", async () => {
    const team = await buildTeam();
    const user = await buildUser({
      teamId: team.id,
    });
    const collection = await buildCollection({
      teamId: team.id,
      permission: null,
    });
    const document = await buildDocument({
      teamId: team.id,
      collectionId: collection.id,
      permission: "read_write",
    });
    await DocumentUser.create({
      createdById: user.id,
      collectionId: collection.id,
      documentId: document.id,
      userId: user.id,
      permission: "read",
    });
    const membershipScope: Readonly<ScopeOptions> = {
      method: ["withMembership", user.id],
    };
    // reload to get membership
    const reloaded = await Document.scope([membershipScope]).findOne({
      where: {
        id: document.id,
      },
      include: [
        {
          model: Collection.scope([membershipScope]),
          as: "collection",
        },
      ],
    });
    const abilities = serialize(user, reloaded);
    expect(abilities.read).toEqual(true);
    expect(abilities.update).toEqual(false);
    expect(abilities.share).toEqual(false);
  });
});

describe("document read permission", () => {
  it("should allow read permissions for team member", async () => {
    const team = await buildTeam();
    const user = await buildUser({
      teamId: team.id,
    });
    const collection = await buildCollection({
      teamId: team.id,
      permission: "read",
    });
    const document = await buildDocument({
      teamId: team.id,
      collectionId: collection.id,
      permission: "read",
    });
    const membershipScope: Readonly<ScopeOptions> = {
      method: ["withMembership", user.id],
    };
    // reload to get membership
    const reloaded = await Document.scope([membershipScope]).findOne({
      where: {
        id: document.id,
      },
      include: [
        {
          model: Collection.scope([membershipScope]),
          as: "collection",
        },
      ],
    });
    const abilities = serialize(user, reloaded);
    expect(abilities.read).toEqual(true);
    expect(abilities.update).toEqual(false);
    expect(abilities.share).toEqual(false);
  });

  it("should allow read only permissions for member who has document read only permissions in private collection", async () => {
    const team = await buildTeam();
    const user = await buildUser({
      teamId: team.id,
    });
    const collection = await buildCollection({
      teamId: team.id,
      permission: null,
    });
    const document = await buildDocument({
      teamId: team.id,
      collectionId: collection.id,
      permission: "read_write",
    });
    await DocumentUser.create({
      createdById: user.id,
      collectionId: collection.id,
      documentId: document.id,
      userId: user.id,
      permission: "read",
    });
    const membershipScope: Readonly<ScopeOptions> = {
      method: ["withMembership", user.id],
    };
    // reload to get membership
    const reloaded = await Document.scope([membershipScope]).findOne({
      where: {
        id: document.id,
      },
      include: [
        {
          model: Collection.scope([membershipScope]),
          as: "collection",
        },
      ],
    });
    const abilities = serialize(user, reloaded);
    expect(abilities.read).toEqual(true);
    expect(abilities.update).toEqual(false);
    expect(abilities.share).toEqual(false);
  });

  it("should allow override with read_write membership permission", async () => {
    const team = await buildTeam();
    const user = await buildUser({
      teamId: team.id,
    });
    const collection = await buildCollection({
      teamId: team.id,
      permission: null,
    });
    const document = await buildDocument({
      teamId: team.id,
      collectionId: collection.id,
      permission: "read",
    });
    await DocumentUser.create({
      createdById: user.id,
      collectionId: collection.id,
      documentId: document.id,
      userId: user.id,
      permission: "read_write",
    });
    const membershipScope: Readonly<ScopeOptions> = {
      method: ["withMembership", user.id],
    };
    // reload to get membership
    const reloaded = await Document.scope([membershipScope]).findOne({
      where: {
        id: document.id,
      },
      include: [
        {
          model: Collection.scope([membershipScope]),
          as: "collection",
        },
      ],
    });
    const abilities = serialize(user, reloaded);
    expect(abilities.read).toEqual(true);
    expect(abilities.update).toEqual(true);
    expect(abilities.share).toEqual(true);
  });
});

describe("no permission", () => {
  it("should allow no permissions for team member", async () => {
    const team = await buildTeam();
    const user = await buildUser({
      teamId: team.id,
    });
    const collection = await buildCollection({
      teamId: team.id,
      permission: null,
    });
    const document = await buildDocument({
      teamId: team.id,
      collectionId: collection.id,
      permission: null,
    });
    const membershipScope: Readonly<ScopeOptions> = {
      method: ["withMembership", user.id],
    };
    // reload to get membership
    const reloaded = await Document.scope([membershipScope]).findOne({
      where: {
        id: document.id,
      },
      include: [
        {
          model: Collection.scope([membershipScope]),
          as: "collection",
        },
      ],
    });
    const abilities = serialize(user, reloaded);
    expect(abilities.read).toEqual(false);
    expect(abilities.download).toEqual(false);
    expect(abilities.update).toEqual(false);
    expect(abilities.createChildDocument).toEqual(false);
    expect(abilities.archive).toEqual(false);
    expect(abilities.delete).toEqual(false);
    expect(abilities.share).toEqual(false);
    expect(abilities.move).toEqual(false);
  });

  it("should allow override with team member document membership permission", async () => {
    const team = await buildTeam();
    const user = await buildUser({
      teamId: team.id,
    });
    const collection = await buildCollection({
      teamId: team.id,
      permission: null,
    });
    const document = await buildDocument({
      teamId: team.id,
      collectionId: collection.id,
      permission: null,
    });
    await DocumentUser.create({
      createdById: user.id,
      collectionId: collection.id,
      documentId: document.id,
      userId: user.id,
      permission: "read_write",
    });
    const membershipScope: Readonly<ScopeOptions> = {
      method: ["withMembership", user.id],
    };
    // reload to get membership
    const reloaded = await Document.scope([membershipScope]).findOne({
      where: {
        id: document.id,
      },
      include: [
        {
          model: Collection.scope([membershipScope]),
          as: "collection",
        },
      ],
    });
    const abilities = serialize(user, reloaded);
    expect(abilities.read).toEqual(true);
    expect(abilities.update).toEqual(true);
    expect(abilities.share).toEqual(true);
  });

  it("should allow override with team member document group membership permission", async () => {
    const team = await buildTeam();
    const user = await buildUser({
      teamId: team.id,
    });
    const collection = await buildCollection({
      teamId: team.id,
      permission: null,
    });
    const document = await buildDocument({
      teamId: team.id,
      collectionId: collection.id,
      permission: null,
    });
    const group = await buildGroup({
      teamId: user.teamId,
    });
    await group.$add("user", user, {
      through: {
        createdById: user.id,
      },
    });
    await DocumentGroup.create({
      createdById: user.id,
      collectionId: collection.id,
      documentId: document.id,
      groupId: group.id,
      permission: "read_write",
    });
    const membershipScope: Readonly<ScopeOptions> = {
      method: ["withMembership", user.id],
    };
    // reload to get membership
    const reloaded = await Document.scope([membershipScope]).findOne({
      where: {
        id: document.id,
      },
      include: [
        {
          model: Collection.scope([membershipScope]),
          as: "collection",
        },
      ],
    });
    const abilities = serialize(user, reloaded);
    expect(abilities.read).toEqual(true);
    expect(abilities.update).toEqual(true);
    expect(abilities.share).toEqual(true);
  });
});
