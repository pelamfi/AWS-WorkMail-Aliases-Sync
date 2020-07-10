import * as AWS from 'aws-sdk';
import { Workmail } from './AwsWorkMailUtil';
import { EmailOperation } from './EmailOperation';
import { EntityMap,  groupEntityIdString, userEntityIdString, WorkmailUserAliases,  WorkmailGroupAliases, groupEntityId } from './WorkmailMap';
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
            const entityId = groupEntityId(result.GroupId);
            const registerRequest: AWS.WorkMail.Types.RegisterToWorkMailRequest = {
              OrganizationId: workmail.organizationId,
              EntityId: groupEntityIdString(entityId),
              Email: emailString(op.group.email),
            };
            return workmail.service
              .registerToWorkMail(registerRequest)
              .promise()
              .then(() => (entityMap: EntityMap) =>
                addGroupToEntityMap(entityMap, 
                  {kind: "WorkmailGroup", entityId, members: [], name: op.group.name, email: op.group.email}),
              );
          }
        });
    }
    case 'AddGroupMember': {
      const group = resolveGroup(op.group.email);
      const user = resolveUser(op.member.email);
      const request: AWS.WorkMail.Types.AssociateMemberToGroupRequest = {
        OrganizationId: workmail.organizationId,
        GroupId: groupEntityIdString(group.entity.entityId),
        MemberId: userEntityIdString(user.entity.entityId),
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
      const group = resolveGroup(op.alias.group.email);
      const aliasEmail = emailString(op.alias.email);
      const request = {
        OrganizationId: workmail.organizationId,
        EntityId: groupEntityIdString(group.entity.entityId),
        Alias: aliasEmail,
      };
      console.log(`add alias ${aliasEmail} to group to ${op.alias.group.name}`);
      return workmail.service
        .createAlias(request)
        .promise()
        .then(noEntityMapUpdate);
    }
    case 'AddUserAlias': {
      const user = resolveUser(op.alias.user.email);
      const aliasEmail = emailString(op.alias.email);
      const request = {
        OrganizationId: workmail.organizationId,
        EntityId: userEntityIdString(user.entity.entityId),
        Alias: aliasEmail,
      };
      console.log(`add alias ${aliasEmail} to user ${user.entity.name}`);
      return workmail.service
        .createAlias(request)
        .promise()
        .then(noEntityMapUpdate);
    }
    case 'RemoveGroupAlias': {
      const group = resolveGroup(op.alias.group.email);
      const aliasEmail = emailString(op.alias.email);
      const request = {
        OrganizationId: workmail.organizationId,
        EntityId: groupEntityIdString(group.entity.entityId),
        Alias: aliasEmail,
      };
      console.log(`remove alias ${aliasEmail} from group ${group.entity.name}`);
      return workmail.service
        .deleteAlias(request)
        .promise()
        .then(noEntityMapUpdate);
    }
    case 'RemoveUserAlias': {
      const user = resolveUser(op.alias.user.email);
      const aliasEmail = emailString(op.alias.email);
      const request = {
        OrganizationId: workmail.organizationId,
        EntityId: userEntityIdString(user.entity.entityId),
        Alias: aliasEmail,
      };
      console.log(`remove alias ${aliasEmail} from user ${user.entity.name}`);
      return workmail.service
        .deleteAlias(request)
        .promise()
        .then(noEntityMapUpdate);
    }
    case 'RemoveGroup': {
      const group = resolveGroup(op.group.email);
      const unregisterRequest: AWS.WorkMail.Types.DeregisterFromWorkMailRequest = {
        OrganizationId: workmail.organizationId,
        EntityId: groupEntityIdString(group.entity.entityId),
      };
      const request: AWS.WorkMail.Types.DeleteGroupRequest = {
        OrganizationId: workmail.organizationId,
        GroupId: groupEntityIdString(group.entity.entityId),
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
                group.entity.email,
              ),
            ),
        );
    }
  }
}
