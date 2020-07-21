import * as AWS from 'aws-sdk';
import { Config } from './ScriptConfig';
import { GroupEntityId, UserEntityId, entityIdString, groupEntityIdString, groupEntityId, userEntityIdString } from './WorkmailMap';
import { Email, emailString } from './Email';

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
    return service
      .createAlias({OrganizationId: organizationId, EntityId: entityIdString(entityId), Alias: emailString(alias)})
      .promise()
      .then(() => Promise.resolve())
  }
  
  function deleteAlias(entityId: GroupEntityId | UserEntityId, alias: Email) {
    return service
      .deleteAlias({OrganizationId: organizationId, 
        EntityId: entityIdString(entityId), 
        Alias: emailString(alias)})
      .promise()
      .then(() => Promise.resolve())
  }

  function removeGroup(groupEntityId: GroupEntityId) {
    return service
      .deregisterFromWorkMail({OrganizationId: organizationId, EntityId: groupEntityIdString(groupEntityId)})
      .promise()
      .then(() => service.deleteGroup({OrganizationId: organizationId, 
        GroupId: groupEntityIdString(groupEntityId)}).promise())
      .then(() => Promise.resolve())
  }

  function associateMemberToGroup(groupEntityId: GroupEntityId, userEntityId: UserEntityId) {
    return service
      .associateMemberToGroup({OrganizationId: organizationId, 
        GroupId: groupEntityIdString(groupEntityId), 
        MemberId: userEntityIdString(userEntityId)})
      .promise()
      .then(() => Promise.resolve())
  }

  function addGroup(name: string, email: Email): Promise<GroupEntityId> {
    return service
      .createGroup({OrganizationId: organizationId, Name: name})
      .promise()
      .then((result) => {
        const rawEntityId = result.GroupId  
        if (rawEntityId === undefined) {
          const message = `adding group ${name} failed, no entityId received`;  
          return Promise.reject(new Error(message));
        
        } else {
          return service
            .registerToWorkMail({OrganizationId: organizationId, EntityId: rawEntityId, Email: emailString(email)})
            .promise()
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

