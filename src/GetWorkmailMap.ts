import * as AWS from 'aws-sdk'
import * as R from 'ramda';
import {Workmail} from './AwsWorkMailUtil';
import {WorkmailMap, WorkmailGroup, WorkmailUser, WorkmailEntityCommon, WorkmailEntity, workmailMapFromEntities as workmailMapFromEntitiesAndEmails} from './WorkmailMap';
import { serialPromises } from './PromiseUtil';
import {mapUndef, filterUndef} from './UndefUtil'
import { isGeneratedGroupName } from './EmailMap';
import { EmailAddr } from "./EmailAddr";

async function workmailEntityWithAliases<T extends WorkmailGroup|WorkmailUser>(workmail: Workmail, entity: T): Promise<[T, EmailAddr[]]> {
  return workmail.service
    .listAliases({ EntityId: entity.entityId, OrganizationId: workmail.organizationId}).promise()
    .then( response => {
      const aliases: EmailAddr[] = response.Aliases
        ?.filter(alias => alias != entity.email?.email) // also the primary email is returned as an alias
        .map(alias => new EmailAddr(alias)) ?? []
      return [entity, aliases]
    })
}

type WorkmailUserMap = {readonly [index: string]: WorkmailUser}

async function workmailGroupWithMembers(workmail: Workmail, userMap: WorkmailUserMap, group: WorkmailGroup): Promise<WorkmailGroup> {
  return workmail.service
    .listGroupMembers({ GroupId: group.entityId, OrganizationId: workmail.organizationId}).promise()
    .then( response => {
      const memberIds = filterUndef(response.Members?.map(member => member?.Id) ?? [])
      const members: WorkmailUser[] = filterUndef(memberIds.map(memberId => userMap[memberId]))
      return {...group, members}
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

function convertGroup(group: AWS.WorkMail.Group): WorkmailGroup|undefined {
  const kind: "WorkmailGroup" = "WorkmailGroup"
  const common = convertEntityCommon(kind, group)
  return mapUndef(common => ({...common, kind}), common)
}

function convertUser(user: AWS.WorkMail.User): WorkmailUser|undefined {
  const kind: "WorkmailUser" = "WorkmailUser"
  const common = convertEntityCommon(kind, user)
  return mapUndef(common => ({...common, kind}), common)
}

function workmailEntitiesWithAliases(workmail, entities: WorkmailEntity[]): Promise<[WorkmailEntity, EmailAddr[]][]> {
  const promises: (() => Promise<[WorkmailEntity, EmailAddr[]]>)[] = entities
    .map(entity => (() => workmailEntityWithAliases(workmail, entity)))
  return serialPromises(promises)
}

async function groupsWithMembers(workmail: Workmail, userMap: WorkmailUserMap, groups: WorkmailGroup[]): Promise<WorkmailGroup[]> {
  const promises: (() => Promise<WorkmailGroup>)[] = 
    groups.map(group => (() => workmailGroupWithMembers(workmail, userMap, group)))
  return serialPromises(promises)
}

async function getWorkmailUsers(workmail: Workmail): Promise<WorkmailUser[]> {
  return workmail.service
    .listUsers({ OrganizationId: workmail.organizationId })
    .promise()
    .then(response => filterUndef(response.Users?.map(convertUser) ?? []))
}

async function getWorkmailGroups(workmail: Workmail, users: WorkmailUser[]): Promise<WorkmailGroup[]> {
  const userMap: WorkmailUserMap = R.zipObj(users.map(x => x.entityId), users)

  return workmail.service
    .listGroups({ OrganizationId: workmail.organizationId })
    .promise()
    .then(response => response.Groups ?? [])
    .then(filterUndef)
    .then(groups => groups.filter(x => isGeneratedGroupName(x.Name ?? "")))
    .then(R.map(convertGroup))
    .then(filterUndef)
    .then(groups => groupsWithMembers(workmail, userMap, groups))
}

export async function getWorkmailMap(workmail: Workmail): Promise<WorkmailMap> {
  return getWorkmailUsers(workmail)
    .then(users => 
      getWorkmailGroups(workmail, users)
      .then(groups => [...users, ...groups])
    )
    .then(R.curry(workmailEntitiesWithAliases)(workmail))
    .then(workmailMapFromEntitiesAndEmails)
}