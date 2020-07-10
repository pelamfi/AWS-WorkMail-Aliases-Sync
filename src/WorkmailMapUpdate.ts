import * as R from 'ramda';
import { WorkmailGroup, EntityMap, WorkmailGroupAliases  } from './WorkmailMap';
import { emailString, Email } from './Email';

export function addGroupToEntityMap(
  entityMap: EntityMap,
  group: WorkmailGroup
): EntityMap {
  // TODO: members should be set to reflect updated state. Possibly add them with AddGroupMember operations
  const groupsByEmail = R.assoc(emailString(group.email), {entity: group, aliases: []}, entityMap.groupsByEmail);
  const usersByEmail = entityMap.usersByEmail;
  return { usersByEmail, groupsByEmail };
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
