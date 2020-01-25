import * as AWS from 'aws-sdk'
import * as R from 'ramda';
import {Workmail} from './AwsWorkMailUtil';
import {WorkmailMap, WorkmailGroup, WorkmailUser, WorkmailEntityMap, WorkmailEntityCommon} from './WorkmailMap';
import { serialPromisesFlatten } from './PromiseUtil';
import {mapUndef, filterUndef} from './UndefUtil'

async function workmailGroupToEmail(workmail: Workmail, group: WorkmailGroup): Promise<WorkmailEmail[]> {
  let groupDefault: WorkmailGroupDefault[] =
    mapUndef(email => [{kind: "WorkmailGroupDefault", groupEntityId: group.entityId, email: email}], group.email) ?? []

  let currentAliases = workmail.service.listAliases({ EntityId: group.entityId, OrganizationId: workmail.organizationId}).promise()

  let aliases: Promise<WorkmailEmail[]|undefined> = currentAliases.then(
    response => response.Aliases?.map(alias => ({kind: "WorkmailGroupAlias", groupEntityId: group.entityId, email: alias})))

  return aliases.then(aliases => Promise.resolve(R.concat(aliases ?? [], groupDefault)))
}

async function workmailUserToEmail(workmail: Workmail, user: WorkmailUser): Promise<WorkmailEmail[]> {
  let userDefault: WorkmailUserDefault[] =
    mapUndef(email => [{kind: "WorkmailUserDefault", userEntityId: user.entityId, email: email}], user.email) ?? []

  let currentAliases = workmail.service.listAliases({ EntityId: user.entityId, OrganizationId: workmail.organizationId}).promise()

  let aliases: Promise<WorkmailEmail[]|undefined> = currentAliases.then(
    response => response.Aliases?.map(alias => ({kind: "WorkmailUserAlias", userEntityId: user.entityId, email: alias})))

  return aliases.then(aliases => Promise.resolve(R.concat(aliases ?? [], userDefault)))
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

  return {email: entity.Email, name: entity.Name, entityId: entity.Id}
}

function convertGroup(user: AWS.WorkMail.Group): WorkmailGroup|undefined {
  let kind: "WorkmailGroup" = "WorkmailGroup"
  let common = convertEntityCommon(kind, user)
  return mapUndef(common => ({...common, kind}), common)
}

function workmailGroupsToMap(workmailGroups?: AWS.WorkMail.Groups): WorkmailEntityMap {
  let groups = R.pipe(R.map(convertGroup), filterUndef)(workmailGroups ?? [])
  return R.zipObj(groups.map(x => x.entityId), groups)
}

function convertUser(user: AWS.WorkMail.User): WorkmailUser|undefined {
  let kind: "WorkmailUser" = "WorkmailUser"
  let common = convertEntityCommon(kind, user)
  return mapUndef(common => ({...common, kind}), common)
}

function workmailUsersToMap(workmailUsers?: AWS.WorkMail.Users): WorkmailEntityMap {
  let users = R.pipe(R.map(convertUser), filterUndef)(workmailUsers ?? [])
  return R.zipObj(users.map(x => x.entityId), users)
}

function entityMapToEmailMap(workmail: Workmail, entityMap: WorkmailEntityMap): Promise<WorkmailEmailmap> {
  let emailPromises = Object.values(entityMap).map((entity): (() => Promise<WorkmailEmail[]>) =>
    {
      switch (entity.kind) {
        case "WorkmailGroup":
          return () => workmailGroupToEmail(workmail, entity)
        case "WorkmailUser":
          return () => workmailUserToEmail(workmail, entity)
      }
    })

  let emailsPromise = serialPromisesFlatten(emailPromises)

  return emailsPromise.then(
    emails => {
      return R.zipObj(emails.map(x => x.email), emails)
    })
}

export async function getWorkmaillMap(workmail: Workmail): Promise<WorkmailMap> {
  let currentUsersResponse = workmail.service.listUsers({ OrganizationId: workmail.organizationId }).promise()
  let currentGroupsResponse = workmail.service.listGroups({ OrganizationId: workmail.organizationId }).promise()
  let groupsMapPromise = currentGroupsResponse.then(response => workmailGroupsToMap(response.Groups))
  let usersMapPromise = currentUsersResponse.then(response => workmailUsersToMap(response.Users))
  return Promise
    .all([groupsMapPromise, usersMapPromise])
    .then(R.mergeAll)
    .then( async entityMap => {
      let emailMapPromise = entityMapToEmailMap(workmail, entityMap)
      const emailMap = await emailMapPromise;
      return ({
        byEmail: emailMap,
        byEntityId: entityMap
      })})
}