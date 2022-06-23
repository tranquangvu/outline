import invariant from "invariant";
import { action, runInAction } from "mobx";
import DocumentGroupMembership from "~/models/DocumentGroupMembership";
import { PaginationParams } from "~/types";
import { client } from "~/utils/ApiClient";
import BaseStore, { RPCAction } from "./BaseStore";
import RootStore from "./RootStore";

export default class DocumentGroupMembershipsStore extends BaseStore<
  DocumentGroupMembership
> {
  actions = [RPCAction.Create, RPCAction.Delete];

  constructor(rootStore: RootStore) {
    super(rootStore, DocumentGroupMembership);
  }

  @action
  fetchPage = async (
    params: PaginationParams | undefined
  ): Promise<DocumentGroupMembership[]> => {
    this.isFetching = true;

    try {
      const res = await client.post(`/documents.group_memberships`, params);
      invariant(res?.data, "Data not available");

      let models: DocumentGroupMembership[] = [];
      runInAction(`DocumentGroupMembershipsStore#fetchPage`, () => {
        res.data.groups.forEach(this.rootStore.groups.add);
        models = res.data.documentGroupMemberships?.map(this.add);
        this.isLoaded = true;
      });

      return models;
    } finally {
      this.isFetching = false;
    }
  };

  @action
  async create({
    documentId,
    groupId,
    permission,
  }: {
    documentId: string;
    groupId: string;
    permission: string;
  }) {
    const res = await client.post("/documents.add_group", {
      id: documentId,
      groupId,
      permission,
    });
    invariant(res?.data, "Document membership data should be available");

    const cgm = res.data.documentGroupMemberships.map(this.add);
    return cgm[0];
  }

  @action
  async delete({
    documentId,
    groupId,
  }: {
    documentId: string;
    groupId: string;
  }) {
    await client.post("/documents.remove_group", {
      id: documentId,
      groupId,
    });
    this.remove(`${groupId}-${documentId}`);
  }

  @action
  removeCollectionMemberships = (documentId: string) => {
    this.data.forEach((membership, key) => {
      if (key.includes(documentId)) {
        this.remove(key);
      }
    });
  };
}
