import * as AWS from 'aws-sdk'
import * as R from 'ramda';
import {Workmail} from './AwsWorkMailUtil';
import {WorkmailMap, WorkmailGroup, WorkmailUser, WorkmailEntityCommon, WorkmailEntity, workmailMapFromEntities as workmailMapFromEntitiesAndEmails, EntityMap, WorkmailEntityMap} from './WorkmailMap';
import { serialPromises } from './PromiseUtil';
import {mapUndef, filterUndef} from './UndefUtil'
import { isGeneratedGroupName, EmailGroup, Config } from './EmailMap';
import { Email } from "./EmailAddr";

async function workmailEntityWithAliases<T extends WorkmailGroup|WorkmailUser>(workmail: Workmail, entity: T): Promise<[T, Email[]]> {
  return workmail.service
    .listAliases({ EntityId: entity.entityId, OrganizationId: workmail.organizationId}).promise()
    .then( response => {
      const aliases: Email[] = response.Aliases
        ?.filter(alias => alias != entity.email?.email) // also the primary email is returned as an alias
        .map(alias => new Email(alias)) ?? []
      return [entity, aliases]
    })
}

type WorkmailUserMap = {readonly [index: string]: WorkmailUser}

async function workmailGroupWithMembers(workmail: Workmail, userMap: WorkmailUserMap, group: WorkmailGroup): Promise<WorkmailGroup> {
  return workmail.service
    .listGroupMembers({ GroupId: group.entityId, OrganizationId: workmail.organizationId}).promise()
    .then( (response): WorkmailGroup => {
      const memberIds = filterUndef(response.Members?.map(member => member?.Id) ?? [])
      const members: WorkmailUser[] = filterUndef(memberIds.map(memberId => userMap[memberId]))
      return {...group, members}
    })
}

function convertEntityCommon(kind: string, entity: AWS.WorkMail.User|AWS.WorkMail.Group): WorkmailEntityCommon|undefined {
  if (entity.State === "DELETED") {
    return undefined // filter out ghosts
  }

  if (entity.Name === undefined) {
    console.log(`Warning: AWS ${kind} without name`)
    return undefined
  }

  if (entity.Id === undefined) {
    console.log(`Warning: AWS ${kind} without entity id`)
    return undefined
  }

  if (entity.Email === undefined) {
    console.log(`Warning: AWS ${kind} ${entity.Name} without email`)
    return undefined
  }

  return {email: new Email(entity.Email), name: entity.Name, entityId: entity.Id}
}

function convertGroup(group: AWS.WorkMail.Group): WorkmailGroup|undefined {
  const kind: "WorkmailGroup" = "WorkmailGroup"
  const common = convertEntityCommon(kind, group)
  return mapUndef(common => ({...common, kind, members: []}), common) // members are fetched separately
}

function convertUser(user: AWS.WorkMail.User): WorkmailUser|undefined {
  if (user.State == "DISABLED") {
    return undefined // filter out disabled users (includes default system users)
  }

  const kind: "WorkmailUser" = "WorkmailUser"
  const common = convertEntityCommon(kind, user)
  return mapUndef(common => ({...common, kind}), common)
}

function workmailEntitiesWithAliases(workmail, entities: WorkmailEntity[]): Promise<[WorkmailEntity, Email[]][]> {
  const promises: (() => Promise<[WorkmailEntity, Email[]]>)[] = entities
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

async function getWorkmailGroups(workmail: Workmail, users: WorkmailUser[], config: Config): Promise<WorkmailGroup[]> {
  const userMap: WorkmailUserMap = R.zipObj(users.map(x => x.entityId), users)

  return workmail.service
    .listGroups({ OrganizationId: workmail.organizationId })
    .promise()
    .then(response => response.Groups ?? [])
    .then(filterUndef)
    .then(groups => groups.filter(x => isGeneratedGroupName(x.Name ?? "", config)))
    .then(R.map(convertGroup))
    .then(filterUndef)
    .then(groups => groupsWithMembers(workmail, userMap, groups))
}

export async function getWorkmailMap(workmail: Workmail, config: Config): Promise<WorkmailMap> {
  return getWorkmailUsers(workmail)
    .then(users => 
      getWorkmailGroups(workmail, users, config)
      .then(groups => [...users, ...groups])
    )
    .then(R.curry(workmailEntitiesWithAliases)(workmail))
    .then(workmailMapFromEntitiesAndEmails)
}

export function addGroupToEntityMap(entityMap: EntityMap, group: EmailGroup, entityId: AWS.WorkMail.WorkMailIdentifier): EntityMap {
  // TODO: members should be set to reflect updated state. Possibly add them with AddGroupMember operations
  let workmailGroup: WorkmailGroup = {kind: "WorkmailGroup", name: group.name, email: group.email, entityId, members: []}
  let byId = R.assoc(entityId, workmailGroup, entityMap.byEmail)
  let byEmail = R.assoc(group.email.email, workmailGroup, entityMap.byEmail)
  return {byId, byEmail}
}

export function removeGroupFromEntityMap(entityMap: EntityMap, group: EmailGroup, entityId: AWS.WorkMail.WorkMailIdentifier): EntityMap {
  let byId: WorkmailEntityMap = R.dissoc(entityId, entityMap.byEmail)
  let byEmail: WorkmailEntityMap = R.dissoc(group.email.email, entityMap.byEmail)
  return {byId, byEmail}
}
