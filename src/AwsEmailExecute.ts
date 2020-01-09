import * as AWS from 'aws-sdk'
import {Workmail} from './AwsWorkMailUtil';
import {AwsEmailOperation} from './AwsEmailOperation';

export function executeAwsEmailOperation(workmail: Workmail, op: AwsEmailOperation): AWS.Request<any, AWS.AWSError> {
  switch (op.kind) {
    case "AddGroupAlias": {
      let request = {OrganizationId: workmail.organizationId, EntityId: op.groupEntityId, Alias: op.aliasEmail}
      return workmail.service.createAlias(request)
    }
    case "AddUserAlias": {
      let request = {OrganizationId: workmail.organizationId, EntityId: op.userEntityId, Alias: op.aliasEmail}
      return workmail.service.createAlias(request)
    }
    case "RemoveGroupAlias": {
      let request = {OrganizationId: workmail.organizationId, EntityId: op.groupEntityId, Alias: op.aliasEmail}
      return workmail.service.deleteAlias(request)
    }
    case "RemoveUserAlias": {
      let request = {OrganizationId: workmail.organizationId, EntityId: op.userEntityId, Alias: op.aliasEmail}
      return workmail.service.deleteAlias(request)
    }
  }
}