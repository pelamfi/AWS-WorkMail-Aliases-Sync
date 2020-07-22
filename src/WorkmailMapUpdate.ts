import * as R from 'ramda';
import { WorkmailGroup, EntityMap, WorkmailGroupAliases, WorkmailUserAliases  } from './WorkmailMap';
import { emailString, Email } from './Email';
import { AddUserAlias } from './EmailOperation';

export function addGroupToEntityMap(
  entityMap: EntityMap,
  group: WorkmailGroup
): EntityMap {
  const groupsByEmail = R.assoc(emailString(group.email), {entity: group, aliases: []}, entityMap.groupsByEmail);
  const usersByEmail = entityMap.usersByEmail;
  return { usersByEmail, groupsByEmail };
}

export function addAliasToEntityMap(
  entityMap: EntityMap,
  op: AddUserAlias,
): EntityMap {
  const groupsByEmail = entityMap.groupsByEmail;
  const userEmail = emailString(op.alias.user.email)
  const usersByEmail = R.assoc(userEmail, addAliasToUser(entityMap.usersByEmail[userEmail], op), entityMap.usersByEmail);
  return { usersByEmail, groupsByEmail };
}

function addAliasToUser(userAliases: WorkmailUserAliases, op: AddUserAlias): WorkmailUserAliases {
  return {entity: userAliases.entity, aliases: [...userAliases.aliases, op.alias.email]}
}

export function removeGroupFromEntityMap(
  entityMap: EntityMap,
  groupEmail: Email
): EntityMap {
  const groupsByEmail: { readonly [index: string]: WorkmailGroupAliases } = R.dissoc(
    emailString(groupEmail),
    entityMap.groupsByEmail,
  );
  const usersByEmail = entityMap.usersByEmail;
  return { usersByEmail, groupsByEmail };
}
