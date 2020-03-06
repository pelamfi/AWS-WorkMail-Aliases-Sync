import * as AWS from 'aws-sdk';
import * as R from 'ramda';
import { EmailGroup } from './EmailMap';
import { WorkmailGroup, EntityMap, WorkmailEntityMap } from './WorkmailMap';

export function addGroupToEntityMap(
  entityMap: EntityMap,
  group: EmailGroup,
  entityId: AWS.WorkMail.WorkMailIdentifier,
): EntityMap {
  // TODO: members should be set to reflect updated state. Possibly add them with AddGroupMember operations
  let workmailGroup: WorkmailGroup = {
    kind: 'WorkmailGroup',
    name: group.name,
    email: group.email,
    entityId,
    members: [],
  };
  let byId = R.assoc(entityId, workmailGroup, entityMap.byEmail);
  let byEmail = R.assoc(group.email.email, workmailGroup, entityMap.byEmail);
  return { byId, byEmail };
}

export function removeGroupFromEntityMap(
  entityMap: EntityMap,
  group: EmailGroup,
  entityId: AWS.WorkMail.WorkMailIdentifier,
): EntityMap {
  let byId: WorkmailEntityMap = R.dissoc(entityId, entityMap.byEmail);
  let byEmail: WorkmailEntityMap = R.dissoc(
    group.email.email,
    entityMap.byEmail,
  );
  return { byId, byEmail };
}
