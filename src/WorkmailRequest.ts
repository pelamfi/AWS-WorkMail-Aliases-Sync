import { WorkmailUpdate } from './AwsWorkMailUtil';
import { EmailOperation } from './EmailOperation';
import { EntityMap,  WorkmailUserAliases,  WorkmailGroupAliases, GroupEntityId } from './WorkmailMap';
import { Email, emailString } from './Email';
import {
  addGroupToEntityMap,
  removeGroupFromEntityMap,
  addAliasToEntityMap,
} from './WorkmailMapUpdate';

export type EntityMapUpdate = (_: EntityMap) => EntityMap;

const noEntityMapUpdate: (_: unknown) => EntityMapUpdate = () => (entityMap) =>
  entityMap;

export function createAwsWorkmailRequest(
  workmail: WorkmailUpdate,
  entityMap: EntityMap,
  op: EmailOperation,
): Promise<EntityMapUpdate> {

  function resolveUser(email: Email): WorkmailUserAliases {
    const entityId = entityMap.usersByEmail[emailString(email)];
    if (entityId !== undefined) {
      return entityId;
    }

    throw `Can't resolve user ${email} to a Workmail entity`;
  }

  function resolveGroup(email: Email): WorkmailGroupAliases {
    const entityId = entityMap.groupsByEmail[emailString(email)];
    if (entityId !== undefined) {
      return entityId;
    }

    throw `Can't resolve gropup ${email} to a Workmail entity`;
  }

  switch (op.kind) {
  case 'AddGroup': {
    console.log(`add group ${op.group.name} (${emailString(op.group.email)})`);
    return workmail
      .addGroup(op.group.name, op.group.email)
      .then((entityId: GroupEntityId) => (entityMap: EntityMap) =>
        addGroupToEntityMap(entityMap,
          {kind: "WorkmailGroup", entityId, members: [], name: op.group.name, email: op.group.email}),
      );
  }
  case 'AddGroupMember': {
    const group = resolveGroup(op.group.email);
    const user = resolveUser(op.member.email);
    console.log(
      `add group member ${op.member.email} to ${op.group.name}`,
    );
    return workmail
      .associateMemberToGroup(group.entity.entityId, user.entity.entityId)
      .then(noEntityMapUpdate);
  }
  case 'AddGroupAlias': {
    const group = resolveGroup(op.alias.group.email);
    console.log(`add alias ${emailString(op.alias.email)} to group to ${op.alias.group.name}`);
    return workmail
      .createAlias(group.entity.entityId, op.alias.email)
      .then(noEntityMapUpdate);
  }
  case 'AddUserAlias': {
    const user = resolveUser(op.alias.user.email);
    console.log(`add alias ${emailString(op.alias.email)} to user ${user.entity.name}`);
    return workmail
      .createAlias(user.entity.entityId, op.alias.email)
      .then(() => (entityMap: EntityMap) =>
        addAliasToEntityMap(entityMap, op));
  }
  case 'RemoveGroupAlias': {
    const group = resolveGroup(op.alias.group.email);
    console.log(`remove alias ${emailString(op.alias.email)} from group ${group.entity.name}`);
    return workmail
      .deleteAlias(group.entity.entityId, op.alias.email)
      .then(noEntityMapUpdate);
  }
  case 'RemoveUserAlias': {
    const user = resolveUser(op.alias.user.email);
    console.log(`remove alias ${emailString(op.alias.email)} from user ${user.entity.name}`);
    return workmail
      .deleteAlias(user.entity.entityId, op.alias.email)
      .then(noEntityMapUpdate);
  }
  case 'RemoveGroup': {
    const group = resolveGroup(op.group.email);
    console.log(`remove group ${op.group.name}`);
    return workmail
      .removeGroup(group.entity.entityId)
      .then(() => (entityMap: EntityMap) =>
        removeGroupFromEntityMap(
          entityMap,
          group.entity.email
        )
      );
  }
  }
}
