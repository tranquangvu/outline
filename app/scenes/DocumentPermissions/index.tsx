import { observer } from "mobx-react";
import { PlusIcon } from "outline-icons";
import * as React from "react";
import { useTranslation, Trans } from "react-i18next";
import styled from "styled-components";
import Document from "~/models/Document";
import Group from "~/models/Group";
import User from "~/models/User";
import Button from "~/components/Button";
import Divider from "~/components/Divider";
import Flex from "~/components/Flex";
import InputSelectPermission from "~/components/InputSelectPermission";
import Labeled from "~/components/Labeled";
import Modal from "~/components/Modal";
import PaginatedList from "~/components/PaginatedList";
import Switch from "~/components/Switch";
import Text from "~/components/Text";
import useBoolean from "~/hooks/useBoolean";
import useCurrentUser from "~/hooks/useCurrentUser";
import useStores from "~/hooks/useStores";
import useToasts from "~/hooks/useToasts";
import AddGroupsToDocument from "./AddGroupsToDocument";
import AddPeopleToDocument from "./AddPeopleToDocument";
import DocumentGroupMemberListItem from "./components/DocumentGroupMemberListItem";
import MemberListItem from "./components/MemberListItem";

type Props = {
  document: Document;
};

function DocumentPermissions({ document }: Props) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const {
    users,
    auth,
    groups,
    collections,
    documentMemberships,
    documentGroupMemberships,
  } = useStores();
  const { showToast } = useToasts();

  const [
    addGroupModalOpen,
    handleAddGroupModalOpen,
    handleAddGroupModalClose,
  ] = useBoolean();

  const [
    addMemberModalOpen,
    handleAddMemberModalOpen,
    handleAddMemberModalClose,
  ] = useBoolean();

  const handleRemoveUser = React.useCallback(
    async (user) => {
      try {
        await documentMemberships.delete({
          documentId: document.id,
          userId: user.id,
        });
        showToast(
          t(`{{ userName }} was removed from the document`, {
            userName: user.name,
          }),
          {
            type: "success",
          }
        );
      } catch (err) {
        showToast(t("Could not remove user"), {
          type: "error",
        });
      }
    },
    [documentMemberships, showToast, document, t]
  );

  const handleUpdateUser = React.useCallback(
    async (user, permission) => {
      try {
        await documentMemberships.create({
          documentId: document.id,
          userId: user.id,
          permission,
        });
        showToast(
          t(`{{ userName }} permissions were updated`, {
            userName: user.name,
          }),
          {
            type: "success",
          }
        );
      } catch (err) {
        showToast(t("Could not update user"), {
          type: "error",
        });
      }
    },
    [documentMemberships, showToast, t, document.id]
  );

  const handleRemoveGroup = React.useCallback(
    async (group) => {
      try {
        await documentGroupMemberships.delete({
          documentId: document.id,
          groupId: group.id,
        });
        showToast(
          t(`The {{ groupName }} group was removed from the collection`, {
            groupName: group.name,
          }),
          {
            type: "success",
          }
        );
      } catch (err) {
        showToast(t("Could not remove group"), {
          type: "error",
        });
      }
    },
    [documentGroupMemberships, showToast, document.id, t]
  );

  const handleUpdateGroup = React.useCallback(
    async (group, permission) => {
      try {
        await documentGroupMemberships.create({
          documentId: document.id,
          groupId: group.id,
          permission,
        });
        showToast(
          t(`{{ groupName }} permissions were updated`, {
            groupName: group.name,
          }),
          {
            type: "success",
          }
        );
      } catch (err) {
        showToast(t("Could not update user"), {
          type: "error",
        });
      }
    },
    [documentGroupMemberships, showToast, document.id, t]
  );

  const handleChangePermission = React.useCallback(
    async (permission: string) => {
      try {
        await document.save({
          permission,
        });
        showToast(t("Default access permissions were updated"), {
          type: "success",
        });
      } catch (err) {
        showToast(t("Could not update permissions"), {
          type: "error",
        });
      }
    },
    [document, showToast, t]
  );

  const fetchOptions = React.useMemo(
    () => ({
      id: document.id,
      collectionId: document.collectionId,
    }),
    [document.id, document.collectionId]
  );

  const handleSharingChange = React.useCallback(
    async (ev: React.ChangeEvent<HTMLInputElement>) => {
      try {
        await document.save({
          sharing: ev.target.checked,
        });
        showToast(t("Public document sharing permissions were updated"), {
          type: "success",
        });
      } catch (err) {
        showToast(t("Could not update public document sharing"), {
          type: "error",
        });
      }
    },
    [document, showToast, t]
  );

  const documentName = document.title;
  const collectionName = collections?.active?.name;
  const documentGroups = groups.inDocument(document.id, document.collectionId);
  const documentUsers = users.inDocument(document.id, document.collectionId);
  const isEmpty = !documentGroups.length && !documentUsers.length;
  const sharing = document.sharing;
  const teamSharingEnabled = !!auth.team && auth.team.sharing;

  return (
    <Flex column>
      <InputSelectPermission
        onChange={handleChangePermission}
        value={document.permission || ""}
        nude
      />
      <PermissionExplainer size="small">
        {!document.permission && (
          <Trans
            defaults="The <em>{{ documentName }}</em> document is private. Team members have no access to it by default."
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
            defaults="Team members can view <em>{{ documentName }}</em> in the <em>{{ collectionName }}</em> collection by default."
            values={{
              documentName,
              collectionName,
            }}
            components={{
              em: <strong />,
            }}
          />
        )}
        {document.permission === "read_write" && (
          <Trans
            defaults="Team members can view and edit <em>{{ documentName }}</em> in the <em>{{ collectionName }}</em> collection by default."
            values={{
              documentName,
              collectionName,
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
        onChange={handleSharingChange}
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
      <Labeled label={t("Overriden access")}>
        <DocumentPermissionExplainer size="small">
          <Trans>
            This permission overrides all parent collection permission
            configuration. All access must be specified again if additional
            accesses are added in this section.
          </Trans>
        </DocumentPermissionExplainer>
        <Actions gap={8}>
          <Button
            type="button"
            onClick={handleAddGroupModalOpen}
            icon={<PlusIcon />}
            neutral
          >
            {t("Add groups")}
          </Button>
          <Button
            type="button"
            onClick={handleAddMemberModalOpen}
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
              `${group.id}-${document.id}`
            )}
            onRemove={() => handleRemoveGroup(group)}
            onUpdate={(permission) => handleUpdateGroup(group, permission)}
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
            membership={documentMemberships.get(`${item.id}-${document.id}`)}
            canEdit={item.id !== user.id}
            onRemove={() => handleRemoveUser(item)}
            onUpdate={(permission) => handleUpdateUser(item, permission)}
          />
        )}
      />
      <Modal
        title={t(`Add groups to {{ documentName }}`, {
          documentName: document.name,
        })}
        onRequestClose={handleAddGroupModalClose}
        isOpen={addGroupModalOpen}
      >
        <AddGroupsToDocument
          document={document}
          onSubmit={handleAddGroupModalClose}
        />
      </Modal>
      <Modal
        title={t(`Add people to {{ documentName }}`, {
          document: document.name,
        })}
        onRequestClose={handleAddMemberModalClose}
        isOpen={addMemberModalOpen}
      >
        <AddPeopleToDocument
          document={document}
          onSubmit={handleAddMemberModalClose}
        />
      </Modal>
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

const DocumentPermissionExplainer = styled(Text)`
  margin-bottom: 24px;
`;

export default observer(DocumentPermissions);
