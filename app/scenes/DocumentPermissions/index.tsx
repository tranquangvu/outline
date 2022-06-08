import { observer } from "mobx-react";
import { PlusIcon } from "outline-icons";
import * as React from "react";
import { useTranslation, Trans } from "react-i18next";
import styled from "styled-components";
// import Collection from "~/models/Collection";
import Document from "~/models/Document";
import Group from "~/models/Group";
import User from "~/models/User";
import Button from "~/components/Button";
import Divider from "~/components/Divider";
import Flex from "~/components/Flex";
import InputSelectPermission from "~/components/InputSelectPermission";
import Labeled from "~/components/Labeled";
// import Modal from "~/components/Modal";
// import PaginatedEventList from "~/components/PaginatedEventList";
import PaginatedList from "~/components/PaginatedList";
import Switch from "~/components/Switch";
import Text from "~/components/Text";
// import useBoolean from "~/hooks/useBoolean";
import useCurrentUser from "~/hooks/useCurrentUser";
import useStores from "~/hooks/useStores";
// import useToasts from "~/hooks/useToasts";
// import AddGroupsToCollection from "./AddGroupsToCollection";
// import AddPeopleToCollection from "./AddPeopleToCollection";

import DocumentGroupMemberListItem from "./components/DocumentGroupMemberListItem";
import MemberListItem from "./components/MemberListItem";

type Props = {
  document: Document;
};

function DocumentPermissions({ document }: Props) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const {
    // memberships,
    //collectionGroupMemberships,
    users,
    groups,
    auth,
    documentMemberships,
    documentGroupMemberships,
  } = useStores();
  // const { showToast } = useToasts();

  // const [
  //   addGroupModalOpen,
  //   handleAddGroupModalOpen,
  //   // handleAddGroupModalClose,
  // ] = useBoolean();

  // const [
  //   addMemberModalOpen,
  //   handleAddMemberModalOpen,
  //   handleAddMemberModalClose,
  // ] = useBoolean();

  // const handleRemoveUser = React.useCallback(
  //   async (user) => {
  //     try {
  //       await documentMembership.delete({
  //         collectionId: document.collectionId,
  //         documentId: document.id,
  //         userId: user.id,
  //       });
  //       showToast(
  //         t(`{{ userName }} was removed from the document`, {
  //           userName: user.name,
  //         }),
  //         {
  //           type: "success",
  //         }
  //       );
  //     } catch (err) {
  //       showToast(t("Could not remove user"), {
  //         type: "error",
  //       });
  //     }
  //   },
  //   [documentMembership, showToast, document, t]
  // );

  // const handleUpdateUser = React.useCallback(
  //   async (user, permission) => {
  //     try {
  //       await documentMembership.create({
  //         collectionId: document.collectionId,
  //         documentId: document.id,
  //         userId: user.id,
  //         permission,
  //       });
  //       showToast(
  //         t(`{{ userName }} permissions were updated`, {
  //           userName: user.name,
  //         }),
  //         {
  //           type: "success",
  //         }
  //       );
  //     } catch (err) {
  //       showToast(t("Could not update user"), {
  //         type: "error",
  //       });
  //     }
  //   },
  //   [documentMembership, showToast, document]
  // );

  // const handleRemoveGroup = React.useCallback(
  //   async (group) => {
  //     try {
  //       await collectionGroupMemberships.delete({
  //         collectionId: document.id,
  //         groupId: group.id,
  //       });
  //       showToast(
  //         t(`The {{ groupName }} group was removed from the collection`, {
  //           groupName: group.name,
  //         }),
  //         {
  //           type: "success",
  //         }
  //       );
  //     } catch (err) {
  //       showToast(t("Could not remove group"), {
  //         type: "error",
  //       });
  //     }
  //   },
  //   [collectionGroupMemberships, showToast, collection, t]
  // );

  // const handleUpdateGroup = React.useCallback(
  //   async (group, permission) => {
  //     try {
  //       await collectionGroupMemberships.create({
  //         collectionId: collection.id,
  //         groupId: group.id,
  //         permission,
  //       });
  //       showToast(
  //         t(`{{ groupName }} permissions were updated`, {
  //           groupName: group.name,
  //         }),
  //         {
  //           type: "success",
  //         }
  //       );
  //     } catch (err) {
  //       showToast(t("Could not update user"), {
  //         type: "error",
  //       });
  //     }
  //   },
  //   [collectionGroupMemberships, showToast, collection, t]
  // );

  // const handleChangePermission = React.useCallback(
  //   async (permission: string) => {
  //     try {
  //       await collection.save({
  //         permission,
  //       });
  //       showToast(t("Default access permissions were updated"), {
  //         type: "success",
  //       });
  //     } catch (err) {
  //       showToast(t("Could not update permissions"), {
  //         type: "error",
  //       });
  //     }
  //   },
  //   [collection, showToast, t]
  // );

  const fetchOptions = React.useMemo(
    () => ({
      id: document.id,
      collectionId: document.collectionId,
    }),
    [document.id, document.collectionId]
  );

  // const handleSharingChange = React.useCallback(
  //   async (ev: React.ChangeEvent<HTMLInputElement>) => {
  //     try {
  //       await collection.save({
  //         sharing: ev.target.checked,
  //       });
  //       showToast(t("Public document sharing permissions were updated"), {
  //         type: "success",
  //       });
  //     } catch (err) {
  //       showToast(t("Could not update public document sharing"), {
  //         type: "error",
  //       });
  //     }
  //   },
  //   [collection, showToast, t]
  // );

  const documentName = document.name;
  const documentGroups = groups.inDocument(document.id, document.collectionId);
  const documentUsers = users.inDocument(document.id, document.collectionId);
  const isEmpty = !documentGroups.length && !documentUsers.length;
  const sharing = document.sharing;
  const teamSharingEnabled = !!auth.team && auth.team.sharing;

  return (
    <Flex column>
      <InputSelectPermission
        onChange={() => console.log("InputSelectPermission")}
        value={document.permission || ""}
        nude
      />
      <PermissionExplainer size="small">
        {!document.permission && (
          <Trans
            defaults="The <em>{{ documentName }}</em> collection is private. Team members have no access to it by default."
            values={{
              documentName,
            }}
            components={{
              em: <strong />,
            }}
          />
        )}
        {document.permission === "read" && (
          <Trans
            defaults="Team members can view documents in the <em>{{ documentName }}</em> collection by default."
            values={{
              documentName,
            }}
            components={{
              em: <strong />,
            }}
          />
        )}
        {document.permission === "read_write" && (
          <Trans
            defaults="Team members can view and edit documents in the <em>{{ documentName }}</em> collection by
          default."
            values={{
              documentName,
            }}
            components={{
              em: <strong />,
            }}
          />
        )}
      </PermissionExplainer>
      <Switch
        id="sharing"
        label={t("Public document sharing")}
        onChange={() => console.log("handleSharingChange")}
        checked={sharing && teamSharingEnabled}
        disabled={!teamSharingEnabled}
        note={
          teamSharingEnabled ? (
            <Trans>
              When enabled, documents can be shared publicly on the internet.
            </Trans>
          ) : (
            <Trans>
              Public sharing is currently disabled in the team security
              settings.
            </Trans>
          )
        }
      />
      <Labeled label={t("Additional access")}>
        <Actions gap={8}>
          <Button
            type="button"
            onClick={() => console.log("handleAddGroupModalOpen")}
            icon={<PlusIcon />}
            neutral
          >
            {t("Add groups")}
          </Button>
          <Button
            type="button"
            onClick={() => console.log("handleAddMemberModalOpen")}
            icon={<PlusIcon />}
            neutral
          >
            {t("Add people")}
          </Button>
        </Actions>
      </Labeled>
      <Divider />
      {isEmpty && (
        <Empty>
          <Trans>
            Add specific access for individual groups and team members
          </Trans>
        </Empty>
      )}
      <PaginatedList
        items={documentGroups}
        fetch={documentGroupMemberships.fetchPage}
        options={fetchOptions}
        renderItem={(group: Group) => (
          <DocumentGroupMemberListItem
            key={group.id}
            group={group}
            documentGroupMembership={documentGroupMemberships.get(
              `${group.id}-${document.collectionId}-${document.id}`
            )}
            onRemove={() => console.log("handleRemoveGroup(group)")}
            onUpdate={() =>
              console.log("handleUpdateGroup(group, permission))")
            }
          />
        )}
      />
      {documentGroups.length ? <Divider /> : null}
      <PaginatedList
        key={`collection-users-${document.permission || "none"}`}
        items={documentUsers}
        fetch={documentMemberships.fetchPage}
        options={fetchOptions}
        renderItem={(item: User) => (
          <MemberListItem
            key={item.id}
            user={item}
            membership={documentMemberships.get(
              `${item.id}-${document.collectionId}-${document.id}`
            )}
            canEdit={item.id !== user.id}
            onRemove={() => console.log("handleRemoveUser(item)")}
            onUpdate={() => console.log("handleUpdateUser(item, permission)")}
          />
        )}
      />
      {/* <Modal
        title={t(`Add groups to {{ collectionName }}`, {
          collectionName: collection.name,
        })}
        onRequestClose={handleAddGroupModalClose}
        isOpen={addGroupModalOpen}
      >
        <AddGroupsToCollection
          collection={collection}
          onSubmit={handleAddGroupModalClose}
        />
      </Modal> */}
      {/* <Modal
        title={t(`Add people to {{ collectionName }}`, {
          collectionName: collection.name,
        })}
        onRequestClose={handleAddMemberModalClose}
        isOpen={addMemberModalOpen}
      >
        <AddPeopleToCollection
          collection={collection}
          onSubmit={handleAddMemberModalClose}
        />
      </Modal> */}
    </Flex>
  );
}

const Empty = styled(Text)`
  margin-top: 8px;
`;

const PermissionExplainer = styled(Text)`
  margin-top: -8px;
  margin-bottom: 24px;
`;

const Actions = styled(Flex)`
  margin-bottom: 12px;
`;

export default observer(DocumentPermissions);
