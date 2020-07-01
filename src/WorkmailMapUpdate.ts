import * as AWS from 'aws-sdk';
import * as R from 'ramda';
import { EmailGroup } from './EmailMap';
import { WorkmailGroup, EntityMap, WorkmailEntityMap } from './WorkmailMap';
import { emailString } from './Email';

export function addGroupToEntityMap(
  entityMap: EntityMap,
  group: EmailGroup,
  entityId: AWS.WorkMail.WorkMailIdentifier,
): EntityMap {
  // TODO: members should be set to reflect updated state. Possibly add them with AddGroupMember operations
  const workmailGroup: WorkmailGroup = {
    kind: 'WorkmailGroup',
    name: group.name,
    email: group.email,
    entityId,
    members: [],
  };
  const byId = R.assoc(entityId, workmailGroup, entityMap.byId);
  const byEmail = R.assoc(emailString(group.email), workmailGroup, entityMap.byEmail);
  return { byId, byEmail };
}

export function removeGroupFromEntityMap(
  entityMap: EntityMap,
  group: EmailGroup,
  entityId: AWS.WorkMail.WorkMailIdentifier,
): EntityMap {
  const byId: WorkmailEntityMap = R.dissoc(entityId, entityMap.byEmail);
  const byEmail: WorkmailEntityMap = R.dissoc(
    emailString(group.email),
    entityMap.byEmail,
  );
  return { byId, byEmail };
}
