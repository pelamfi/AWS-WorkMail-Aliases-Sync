import * as AWS from 'aws-sdk';
import { Config } from './ScriptConfig';
import { GroupEntityId, UserEntityId, entityIdString, groupEntityIdString, groupEntityId, userEntityIdString } from './WorkmailMap';
import { Email, emailString } from './Email';
import { retry } from './Retry';
import { eitherThrow } from './EitherUtil';

export interface Workmail {
  service: AWS.WorkMail, // TODO: Add a wrapper for querying too
  organizationId: string,
  update: WorkmailUpdate  
}

export interface WorkmailUpdate {
  createAlias(entityId: GroupEntityId | UserEntityId, alias: Email): Promise<void>;
  deleteAlias(entityId: GroupEntityId | UserEntityId, alias: Email): Promise<void>;
  removeGroup(groupEntityId: GroupEntityId): Promise<void>;
  associateMemberToGroup(groupEntityId: GroupEntityId, userEntityId: UserEntityId): Promise<void>;
  addGroup(name: string, email: Email): Promise<GroupEntityId>;
}
  
export function openWorkmail(scriptConfig: Config): Workmail {
  configureAws(scriptConfig);

  const service = createWorkmailService(scriptConfig);     
  const organizationId = scriptConfig.workmailOrganizationId;
  
  function createAlias(entityId: GroupEntityId | UserEntityId, alias: Email) {
    return retry(() => service
      .createAlias({OrganizationId: organizationId, EntityId: entityIdString(entityId), Alias: emailString(alias)})
      .promise(), "createAlias")
      .then(eitherThrow)
      .then(() => Promise.resolve())
  }
  
  function deleteAlias(entityId: GroupEntityId | UserEntityId, alias: Email) {
    return retry(() => service
      .deleteAlias({OrganizationId: organizationId, 
        EntityId: entityIdString(entityId), 
        Alias: emailString(alias)})
      .promise(), "deleteAlias")
      .then(eitherThrow)
      .then(() => Promise.resolve())
  }

  function removeGroup(groupEntityId: GroupEntityId) {
    return retry(() => service
      .deregisterFromWorkMail({OrganizationId: organizationId, EntityId: groupEntityIdString(groupEntityId)})
      .promise(), "removeGroup/deregister")
      .then(eitherThrow)
      .then(() => retry(() => service.deleteGroup({OrganizationId: organizationId,
        GroupId: groupEntityIdString(groupEntityId)}).promise(), "removeGroup/delete")
        .then(eitherThrow))
      .then(() => Promise.resolve())
  }

  function associateMemberToGroup(groupEntityId: GroupEntityId, userEntityId: UserEntityId) {
    return retry(() => service
      .associateMemberToGroup({OrganizationId: organizationId, 
        GroupId: groupEntityIdString(groupEntityId), 
        MemberId: userEntityIdString(userEntityId)})
      .promise(), "associateMemberToGroup")
      .then(() => Promise.resolve())
  }

  function addGroup(name: string, email: Email): Promise<GroupEntityId> {
    return retry(() => service
      .createGroup({OrganizationId: organizationId, Name: name})
      .promise(), "addGroup/create")
      .then(eitherThrow)
      .then((result) => {
        const rawEntityId = result.GroupId  
        if (rawEntityId === undefined) {
          const message = `adding group ${name} failed, no entityId received`;  
          return Promise.reject(new Error(message));
        
        } else {
          return retry(() => service
            .registerToWorkMail({OrganizationId: organizationId, EntityId: rawEntityId, Email: emailString(email)})
            .promise(), "addGroup/register")
            .then(eitherThrow)
            .then(() => Promise.resolve(groupEntityId(rawEntityId)))
        }
      });
  }

  return {
    organizationId,
    service,  
    update: {createAlias, deleteAlias, removeGroup, associateMemberToGroup, addGroup}
  };
}

function configureAws(scriptConfig: Config): void {
  console.log('Configuring the AWS connection.')

  AWS.config.setPromisesDependency(null);
  AWS.config.loadFromPath(scriptConfig.awsConfigFile);
}

function createWorkmailService(scriptConfig: Config): AWS.WorkMail {
  return new AWS.WorkMail({
    endpoint: scriptConfig.workmailEndpoint,
  });
}

