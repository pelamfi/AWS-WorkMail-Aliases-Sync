import * as AWS from 'aws-sdk'
import {Workmail} from './AwsWorkMailUtil';
import {AwsEmailOperation} from './AwsEmailOperation';
import {WorkmailEntityMap} from './WorkmailMap';

export function executeAwsEmailOperation(workmail: Workmail, entityMap: WorkmailEntityMap, op: AwsEmailOperation): AWS.Request<any, AWS.AWSError> {
  switch (op.kind) {
    case "AddGroupAlias": {
      let request = {OrganizationId: workmail.organizationId, EntityId: op.groupEntityId, Alias: op.aliasEmail}
      console.log(`add alias ${op.aliasEmail} to group ${entityMap[op.groupEntityId]?.name}`)
      return workmail.service.createAlias(request)
    }
    case "AddUserAlias": {
      let request = {OrganizationId: workmail.organizationId, EntityId: op.userEntityId, Alias: op.aliasEmail}
      console.log(`add alias ${op.aliasEmail} to user ${entityMap[op.userEntityId]?.name}`)
      return workmail.service.createAlias(request)
    }
    case "RemoveGroupAlias": {
      let request = {OrganizationId: workmail.organizationId, EntityId: op.groupEntityId, Alias: op.aliasEmail}
      console.log(`remove alias ${op.aliasEmail} from group ${entityMap[op.groupEntityId]?.name}`)
      return workmail.service.deleteAlias(request)
    }
    case "RemoveUserAlias": {
      let request = {OrganizationId: workmail.organizationId, EntityId: op.userEntityId, Alias: op.aliasEmail}
      console.log(`remove alias ${op.aliasEmail} from user ${entityMap[op.userEntityId]?.name}`)
      return workmail.service.deleteAlias(request)
    }
  }
}