import * as AWS from 'aws-sdk'
import * as R from 'ramda';
import {Workmail} from './AwsWorkMailUtil';
import {WorkmailMap, WorkmailGroup, WorkmailUser, WorkmailEntityMap, WorkmailEntityCommon, WorkmailEntity, workmailMapFromEntities as workmailMapFromEntitiesAndEmails} from './WorkmailMap';
import { serialPromisesFlatten, serialPromises } from './PromiseUtil';
import {mapUndef, filterUndef} from './UndefUtil'
import { EmailAddr } from './EmailMap';

async function workmailEntityWithAliases<T extends WorkmailGroup|WorkmailUser>(workmail: Workmail, entity: T): Promise<[T, EmailAddr[]]> {
  return workmail.service
    .listAliases({ EntityId: entity.entityId, OrganizationId: workmail.organizationId}).promise()
    .then( response => {
      let aliases: EmailAddr[] = response.Aliases?.map(alias => new EmailAddr(alias)) ?? []
      return [entity, aliases]
    })
}

function convertEntityCommon(kind: string, entity: AWS.WorkMail.User|AWS.WorkMail.Group): WorkmailEntityCommon|undefined {
  if (entity.Name === undefined) {
    console.log(`Warning: AWS ${kind} without name`)
    return undefined
  }

  if (entity.Id === undefined) {
    console.log(`Warning: AWS ${kind} without entity id`)
    return undefined
  }

  if (entity.Email === undefined) {
    console.log(`Warning: AWS ${kind} without email`)
    return undefined
  }

  return {email: new EmailAddr(entity.Email), name: entity.Name, entityId: entity.Id}
}

function convertGroup(user: AWS.WorkMail.Group): WorkmailGroup|undefined {
  let kind: "WorkmailGroup" = "WorkmailGroup"
  let common = convertEntityCommon(kind, user)
  return mapUndef(common => ({...common, kind}), common)
}

function convertUser(user: AWS.WorkMail.User): WorkmailUser|undefined {
  let kind: "WorkmailUser" = "WorkmailUser"
  let common = convertEntityCommon(kind, user)
  return mapUndef(common => ({...common, kind}), common)
}

function workmailEntitiesWithAliases(workmail, entities: WorkmailEntity[]): Promise<[WorkmailEntity, EmailAddr[]][]> {
  let promises: (() => Promise<[WorkmailEntity, EmailAddr[]]>)[] = entities.map(entity => (() => workmailEntityWithAliases(workmail, entity)))
  return serialPromises(promises)
}

export async function getWorkmailMap(workmail: Workmail): Promise<WorkmailMap> {
  let currentUsersResponse = workmail.service.listUsers({ OrganizationId: workmail.organizationId }).promise()
  let currentGroupsResponse = workmail.service.listGroups({ OrganizationId: workmail.organizationId }).promise()
  
  let groupsPromise: Promise<WorkmailEntity[]> = currentGroupsResponse.then(response => filterUndef(response.Groups?.map(convertGroup) ?? []))
  let usersPromise: Promise<WorkmailEntity[]> = currentUsersResponse.then(response => filterUndef(response.Users?.map(convertUser) ?? []))
  
  let entitiesPromise: Promise<WorkmailEntity[]> = groupsPromise.then(groups => usersPromise.then(users => R.concat(groups, users)))
  
  return entitiesPromise
    .then(R.curry(workmailEntitiesWithAliases)(workmail))
    .then(workmailMapFromEntitiesAndEmails)
}