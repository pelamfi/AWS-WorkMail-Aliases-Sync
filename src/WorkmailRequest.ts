import * as AWS from 'aws-sdk';
import { Workmail } from './AwsWorkMailUtil';
import { EmailOperation } from './EmailOperation';
import { EntityMap, WorkmailEntityCommon, entityIdString } from './WorkmailMap';
import { Email, emailString } from './Email';
import {
  addGroupToEntityMap,
  removeGroupFromEntityMap,
} from './WorkmailMapUpdate';

export type EntityMapUpdate = (_: EntityMap) => EntityMap;

const noEntityMapUpdate: (_: unknown) => EntityMapUpdate = () => (entityMap) =>
  entityMap;

export function createAwsWorkmailRequest(
  workmail: Workmail,
  entityMap: EntityMap,
  op: EmailOperation,
): Promise<EntityMapUpdate> {
  function resolveEntityId(email: Email): WorkmailEntityCommon {
    const entity = entityMap.byEmail[emailString(email)];
    if (entity !== undefined) {
      return entity;
    }

    throw `Can't resolve ${email} to a Workmail entityId`;
  }

  switch (op.kind) {
    case 'AddGroup': {
      const request: AWS.WorkMail.Types.CreateGroupRequest = {
        OrganizationId: workmail.organizationId,
        Name: op.group.name,
      };
      console.log(`add group ${op.group.name} (${op.group.email})`);
      return workmail.service
        .createGroup(request)
        .promise()
        .then((result) => {
          if (result.GroupId === undefined) {
            console.log(
              `adding group ${op.group.name} failed, no entityId received`,
            );
            return (x) => x;
          } else {
            const entityId = result.GroupId;
            const registerRequest: AWS.WorkMail.Types.RegisterToWorkMailRequest = {
              OrganizationId: workmail.organizationId,
              EntityId: entityId,
              Email: emailString(op.group.email),
            };
            return workmail.service
              .registerToWorkMail(registerRequest)
              .promise()
              .then(() => (entityMap: EntityMap) =>
                addGroupToEntityMap(entityMap, op.group, entityId),
              );
          }
        });
    }
    case 'AddGroupMember': {
      const groupEntity = resolveEntityId(op.group.email);
      const userEntity = resolveEntityId(op.member.email);
      const request: AWS.WorkMail.Types.AssociateMemberToGroupRequest = {
        OrganizationId: workmail.organizationId,
        GroupId: entityIdString(groupEntity.entityId),
        MemberId: entityIdString(userEntity.entityId),
      };
      console.log(
        `add group member ${op.member.email} to ${op.group.name}`,
      );
      return workmail.service
        .associateMemberToGroup(request)
        .promise()
        .then(noEntityMapUpdate);
    }
    case 'AddGroupAlias': {
      const groupEntity = resolveEntityId(op.alias.group.email);
      const aliasEmail = emailString(op.alias.email);
      const request = {
        OrganizationId: workmail.organizationId,
        EntityId: entityIdString(groupEntity.entityId),
        Alias: aliasEmail,
      };
      console.log(`add alias ${aliasEmail} to group to ${op.alias.group.name}`);
      return workmail.service
        .createAlias(request)
        .promise()
        .then(noEntityMapUpdate);
    }
    case 'AddUserAlias': {
      const userEntity = resolveEntityId(op.alias.user.email);
      const aliasEmail = emailString(op.alias.email);
      const request = {
        OrganizationId: workmail.organizationId,
        EntityId: entityIdString(userEntity.entityId),
        Alias: aliasEmail,
      };
      console.log(`add alias ${aliasEmail} to user ${userEntity.name}`);
      return workmail.service
        .createAlias(request)
        .promise()
        .then(noEntityMapUpdate);
    }
    case 'RemoveGroupAlias': {
      const groupEntity = resolveEntityId(op.alias.group.email);
      const aliasEmail = emailString(op.alias.email);
      const request = {
        OrganizationId: workmail.organizationId,
        EntityId: entityIdString(groupEntity.entityId),
        Alias: aliasEmail,
      };
      console.log(`remove alias ${aliasEmail} from group ${groupEntity.name}`);
      return workmail.service
        .deleteAlias(request)
        .promise()
        .then(noEntityMapUpdate);
    }
    case 'RemoveUserAlias': {
      const userEntity = resolveEntityId(op.alias.user.email);
      const aliasEmail = emailString(op.alias.email);
      const request = {
        OrganizationId: workmail.organizationId,
        EntityId: entityIdString(userEntity.entityId),
        Alias: aliasEmail,
      };
      console.log(`remove alias ${aliasEmail} from user ${userEntity.name}`);
      return workmail.service
        .deleteAlias(request)
        .promise()
        .then(noEntityMapUpdate);
    }
    case 'RemoveGroup': {
      const groupEntity = resolveEntityId(op.group.email);
      const unregisterRequest: AWS.WorkMail.Types.DeregisterFromWorkMailRequest = {
        OrganizationId: workmail.organizationId,
        EntityId: entityIdString(groupEntity.entityId),
      };
      const request: AWS.WorkMail.Types.DeleteGroupRequest = {
        OrganizationId: workmail.organizationId,
        GroupId: entityIdString(groupEntity.entityId),
      };
      console.log(`remove group ${op.group.name}`);
      return workmail.service
        .deregisterFromWorkMail(unregisterRequest)
        .promise()
        .then(() =>
          workmail.service
            .deleteGroup(request)
            .promise()
            .then(() => (entityMap: EntityMap) =>
              removeGroupFromEntityMap(
                entityMap,
                op.group,
                groupEntity.entityId,
              ),
            ),
        );
    }
  }
}
