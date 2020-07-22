import * as R from 'ramda';
import { WorkmailGroup, EntityMap, WorkmailGroupAliases, WorkmailUserAliases, WorkmailUser  } from './WorkmailMap';
import { emailString, Email } from './Email';
import { AddUserAlias, AddGroupMember } from './EmailOperation';

export function addGroupToEntityMap(
  group: WorkmailGroup,
  entityMap: EntityMap
): EntityMap {
  const groupsByEmail = R.assoc(emailString(group.email), {entity: group, aliases: []}, entityMap.groupsByEmail);
  const usersByEmail = entityMap.usersByEmail;
  return { usersByEmail, groupsByEmail };
}

export function addAliasToEntityMap(
  op: AddUserAlias,
  entityMap: EntityMap
): EntityMap {
  const groupsByEmail = entityMap.groupsByEmail;
  const userEmail = emailString(op.alias.user.email)
  const usersByEmail = R.assoc(userEmail, addAliasToUser(entityMap.usersByEmail[userEmail], op), entityMap.usersByEmail);
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
