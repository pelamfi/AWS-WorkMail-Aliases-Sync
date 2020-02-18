import * as AWS from 'aws-sdk'
import {Workmail} from './AwsWorkMailUtil';
import {EmailOperation} from './EmailOperation';
import {EntityMap, WorkmailEntityCommon} from './WorkmailMap';
import { EmailAddr } from './EmailMap';

export function executeAwsEmailOperation(workmail: Workmail, entityMap: EntityMap, op: EmailOperation): AWS.Request<any, AWS.AWSError> {

  function resolveEntityId(email: EmailAddr): WorkmailEntityCommon {
    let entity = entityMap.byEmail[email.email]
    if (entity !== undefined) {
      return entity
    }

    throw `Can't resolve ${email.email} to a Workmail entityId`
  }

  switch (op.kind) {
    case "AddGroup": {
      let request: AWS.WorkMail.Types.CreateGroupRequest = {OrganizationId: workmail.organizationId, Name: "group-" + op.group.email.email}
      console.log(`add group ${op.group.email.email}`)
      return workmail.service.createGroup(request)
    }
    case "AddGroupMember": {
      let groupEntity = resolveEntityId(op.group.email)
      let userEntity = resolveEntityId(op.member.email)
      let request: AWS.WorkMail.Types.AssociateMemberToGroupRequest = {OrganizationId: workmail.organizationId, GroupId: groupEntity.entityId, MemberId: userEntity.entityId}
      console.log(`add group member ${op.group.email.email} ${op.member.email.email}`)
      return workmail.service.associateMemberToGroup(request)
    }
    case "AddGroupAlias": {
      let groupEntity = resolveEntityId(op.alias.group.email)
      let aliasEmail = op.alias.email.email
      let request = {OrganizationId: workmail.organizationId, EntityId: groupEntity.entityId, Alias: aliasEmail}
      console.log(`add alias ${aliasEmail} to group ${groupEntity.name}`)
      return workmail.service.createAlias(request)
    }
    case "AddUserAlias": {
      let userEntity = resolveEntityId(op.alias.user.email)
      let aliasEmail = op.alias.email.email
      let request = {OrganizationId: workmail.organizationId, EntityId: userEntity.entityId, Alias: aliasEmail}
      console.log(`add alias ${aliasEmail} to user ${userEntity.name}`)
      return workmail.service.createAlias(request)
    }
    case "RemoveGroupAlias": {
      let groupEntity = resolveEntityId(op.alias.group.email)
      let aliasEmail = op.alias.email.email
      let request = {OrganizationId: workmail.organizationId, EntityId: groupEntity.entityId, Alias: aliasEmail}
      console.log(`remove alias ${aliasEmail} from group ${groupEntity.name}`)
      return workmail.service.deleteAlias(request)
    }
    case "RemoveUserAlias": {
      let userEntity = resolveEntityId(op.alias.user.email)
      let aliasEmail = op.alias.email.email
      let request = {OrganizationId: workmail.organizationId, EntityId: userEntity.entityId, Alias: aliasEmail}
      console.log(`remove alias ${aliasEmail} from user ${userEntity.name}`)
      return workmail.service.deleteAlias(request)
    }
  }
}