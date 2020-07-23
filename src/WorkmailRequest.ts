import { WorkmailUpdate } from './AwsWorkMailUtil';
import { EmailOperation } from './EmailOperation';
import { EntityMap,  WorkmailUserAliases,  WorkmailGroupAliases, GroupEntityId } from './WorkmailMap';
import { Email, emailString } from './Email';
import * as R from 'ramda';
import {
  addGroupToEntityMap,
  removeGroupFromEntityMap,
  addUserAliasToEntityMap,
  addGroupAliasToEntityMap,
  addGroupAssociationToEntityMap,
  removeUserAliasFromEntityMap,
  removeGroupAliasFromEntityMap,
} from './WorkmailMapUpdate';

export type EntityMapUpdate = (_: EntityMap) => EntityMap;

export function createAwsWorkmailRequest(
  workmail: WorkmailUpdate,
  entityMap: EntityMap,
  op: EmailOperation,
  verbose: boolean
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

    throw `Can't resolve group ${email} to a Workmail entity`;
  }

  switch (op.kind) {
  case 'AddGroup': {
    if (verbose) {
      console.log(`add group ${op.group.name} (${emailString(op.group.email)})`);
    }

    return workmail
      .addGroup(op.group.name, op.group.email)
      .then((entityId: GroupEntityId) => (entityMap: EntityMap) =>
        addGroupToEntityMap(
          {kind: "WorkmailGroup", entityId, members: [], name: op.group.name, email: op.group.email}, entityMap),
      );
  }
  case 'AddGroupMember': {
    const group = resolveGroup(op.group.email);
    const user = resolveUser(op.member.email);
    if (verbose) {
      console.log(
        `add group member ${op.member.email} to ${op.group.name}`,
      );
    }

    return workmail
      .associateMemberToGroup(group.entity.entityId, user.entity.entityId)
      .then(() => R.curry(addGroupAssociationToEntityMap)(user.entity)(op));
  }
  case 'AddGroupAlias': {
    const group = resolveGroup(op.alias.group.email);
    if (verbose) {
      console.log(`add alias ${emailString(op.alias.email)} to group to ${op.alias.group.name}`);
    }

    return workmail
      .createAlias(group.entity.entityId, op.alias.email)
      .then(() => R.curry(addGroupAliasToEntityMap)(op));
  }
  case 'AddUserAlias': {
    const user = resolveUser(op.alias.user.email);
    if (verbose) {
      console.log(`add alias ${emailString(op.alias.email)} to user ${user.entity.name}`);
    }

    return workmail
      .createAlias(user.entity.entityId, op.alias.email)
      .then(() => R.curry(addUserAliasToEntityMap)(op));
  }
  case 'RemoveGroupAlias': {
    const group = resolveGroup(op.alias.group.email);
    if (verbose) {
      console.log(`remove alias ${emailString(op.alias.email)} from group ${group.entity.name}`);
    }

    return workmail
      .deleteAlias(group.entity.entityId, op.alias.email)
      // Not needed currently for groups because the whole group gets removed and recreated.
      // However the alias limit workaround code generates more granular alias updates.
      .then(() => R.curry(removeGroupAliasFromEntityMap)(op));
  }
  case 'RemoveUserAlias': {
    const user = resolveUser(op.alias.user.email);
    if (verbose) {
      console.log(`remove alias ${emailString(op.alias.email)} from user ${user.entity.name}`);
    }

    return workmail
      .deleteAlias(user.entity.entityId, op.alias.email)
      .then(() => R.curry(removeUserAliasFromEntityMap)(op));
  }
  case 'RemoveGroup': {
    const group = resolveGroup(op.group.email);

    if (verbose) {
      console.log(`remove group ${op.group.name}`);
    }

    return workmail
      .removeGroup(group.entity.entityId)
      .then(() => (entityMap: EntityMap) =>
        removeGroupFromEntityMap(
          group.entity.email,
          entityMap
        )
      );
  }
  }
}
