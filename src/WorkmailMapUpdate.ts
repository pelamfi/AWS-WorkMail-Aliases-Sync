import * as AWS from 'aws-sdk';
import * as R from 'ramda';
import { EmailGroup } from './EmailMap';
import { WorkmailGroup, EntityMap, WorkmailEntityMap, EntityId, entityIdString, groupEntityId } from './WorkmailMap';
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
    entityId: groupEntityId(entityId),
    members: [],
  };
  const byId = R.assoc(entityId, workmailGroup, entityMap.byId);
  const byEmail = R.assoc(emailString(group.email), workmailGroup, entityMap.byEmail);
  return { byId, byEmail };
}

export function removeGroupFromEntityMap(
  entityMap: EntityMap,
  group: EmailGroup,
  entityId: EntityId,
): EntityMap {
  const byId: WorkmailEntityMap = R.dissoc(entityIdString(entityId), entityMap.byId);
  const byEmail: WorkmailEntityMap = R.dissoc(
    emailString(group.email),
    entityMap.byEmail,
  );
  return { byId, byEmail };
}
