import * as React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import DocumentGroupMembership from "~/models/DocumentGroupMembership";
import Group from "~/models/Group";
import GroupListItem from "~/components/GroupListItem";
import InputSelect, { Props as SelectProps } from "~/components/InputSelect";
import CollectionGroupMemberMenu from "~/menus/CollectionGroupMemberMenu";

type Props = {
  group: Group;
  documentGroupMembership: DocumentGroupMembership | null | undefined;
  onUpdate: (permission: string) => void;
  onRemove: () => void;
};

const DocumentGroupMemberListItem = ({
  group,
  documentGroupMembership,
  onUpdate,
  onRemove,
}: Props) => {
  const { t } = useTranslation();
  const PERMISSIONS = React.useMemo(
    () => [
      {
        label: t("View only"),
        value: "read",
      },
      {
        label: t("View and edit"),
        value: "read_write",
      },
    ],
    [t]
  );

  return (
    <GroupListItem
      group={group}
      showAvatar
      renderActions={({ openMembersModal }) => (
        <>
          <Select
            label={t("Permissions")}
            options={PERMISSIONS}
            value={
              documentGroupMembership
                ? documentGroupMembership.permission
                : undefined
            }
            onChange={onUpdate}
            ariaLabel={t("Permissions")}
            labelHidden
            nude
          />
          <CollectionGroupMemberMenu
            onMembers={openMembersModal}
            onRemove={onRemove}
          />
        </>
      )}
    />
  );
};

const Select = styled(InputSelect)`
  margin: 0;
  font-size: 14px;
  border-color: transparent;
  box-shadow: none;
  color: ${(props) => props.theme.textSecondary};

  select {
    margin: 0;
  }
` as React.ComponentType<SelectProps>;

export default DocumentGroupMemberListItem;
