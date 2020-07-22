import * as R from 'ramda';
import { WorkmailGroup, EntityMap, WorkmailGroupAliases, WorkmailUserAliases, WorkmailUser  } from './WorkmailMap';
import { emailString, Email } from './Email';
import { AddUserAlias, AddGroupMember, AddGroupAlias, RemoveUserAlias } from './EmailOperation';

export function addGroupToEntityMap(
  group: WorkmailGroup,
  entityMap: EntityMap
): EntityMap {
  const groupsByEmail = R.assoc(emailString(group.email), {entity: group, aliases: []}, entityMap.groupsByEmail);
  const usersByEmail = entityMap.usersByEmail;
  return { usersByEmail, groupsByEmail };
}

export function addUserAliasToEntityMap(
  op: AddUserAlias,
  entityMap: EntityMap
): EntityMap {
  const groupsByEmail = entityMap.groupsByEmail;
  const userEmail = emailString(op.alias.user.email)
  const usersByEmail = R.assoc(userEmail, addAliasToUser(entityMap.usersByEmail[userEmail], op), entityMap.usersByEmail);
  return { usersByEmail, groupsByEmail };
}

export function addGroupAliasToEntityMap(
  op: AddGroupAlias,
  entityMap: EntityMap
): EntityMap {
  const groupEmail = emailString(op.alias.group.email)
  const groupsByEmail = R.assoc(groupEmail, addAliasToGroup(entityMap.groupsByEmail[groupEmail], op), entityMap.groupsByEmail);
  const usersByEmail = entityMap.usersByEmail;
  return { usersByEmail, groupsByEmail };
}

export function removeUserAliasFromEntityMap(
  op: RemoveUserAlias,
  entityMap: EntityMap
): EntityMap {
  const userEmail = emailString(op.alias.user.email)
  const groupsByEmail = entityMap.groupsByEmail;
  const usersByEmail = R.assoc(userEmail, removeAliasFromUser(entityMap.usersByEmail[userEmail], op), entityMap.usersByEmail);
  return { usersByEmail, groupsByEmail };
}

export function addGroupAssociationToEntityMap(
  user: WorkmailUser,
  op: AddGroupMember,
  entityMap: EntityMap
): EntityMap {
  const groupEmail = emailString(op.group.email)
  const groupsByEmail = R.assoc(groupEmail, addMemberToGroup(entityMap.groupsByEmail[groupEmail], user), entityMap.groupsByEmail);
  const usersByEmail = entityMap.usersByEmail;
  return { usersByEmail, groupsByEmail };
}

function addAliasToUser(userAliases: WorkmailUserAliases, op: AddUserAlias): WorkmailUserAliases {
  return {entity: userAliases.entity, aliases: [...userAliases.aliases, op.alias.email]}
}

function removeAliasFromUser(userAliases: WorkmailUserAliases, op: RemoveUserAlias): WorkmailUserAliases {
  return {entity: userAliases.entity, aliases: userAliases.aliases.filter(x => x != op.alias.email)}
}

function addAliasToGroup(aliases: WorkmailGroupAliases, op: AddGroupAlias): WorkmailGroupAliases {
  return {entity: aliases.entity, aliases: [...aliases.aliases, op.alias.email]}
}

function addMemberToGroup(groupAliases: WorkmailGroupAliases, user: WorkmailUser): WorkmailGroupAliases {
  return {entity: {...groupAliases.entity, members: [...groupAliases.entity.members, user.entityId]}, aliases: groupAliases.aliases}
}

export function removeGroupFromEntityMap(
  groupEmail: Email,
  entityMap: EntityMap,
): EntityMap {
  const groupsByEmail: { readonly [index: string]: WorkmailGroupAliases } = R.dissoc(
    emailString(groupEmail),
    entityMap.groupsByEmail,
  );
  const usersByEmail = entityMap.usersByEmail;
  return { usersByEmail, groupsByEmail };
}
