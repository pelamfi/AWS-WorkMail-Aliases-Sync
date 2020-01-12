import * as AWS from 'aws-sdk'
import * as R from 'ramda';
import {Workmail} from './AwsWorkMailUtil';
import {AwsEmail, AwsUserDefaultEmail, AwsGroupDefaultEmail, AwsEmailMap, WorkmailGroup, WorkmailUser, WorkmailEntityMap, WorkmailEmailmap, WorkmailEntityCommon} from './AwsEmailMap';
import { serialPromisesFlatten } from './PromiseUtil';
import {mapUndef, filterUndef} from './UndefUtil'

async function awsGroupToEmail(workmail: Workmail, group: WorkmailGroup): Promise<AwsEmail[]> {
  let groupDefault: AwsGroupDefaultEmail[] =
    mapUndef(email => [{kind: "AwsGroupDefaultEmail", groupEntityId: group.entityId, email: email}], group.email) ?? []

  let currentAliases = workmail.service.listAliases({ EntityId: group.entityId, OrganizationId: workmail.organizationId}).promise()

  let aliases: Promise<AwsEmail[]|undefined> = currentAliases.then(
    response => response.Aliases?.map(alias => ({kind: "AwsGroupAlias", groupEntityId: group.entityId, email: alias})))

  return aliases.then(aliases => Promise.resolve(R.concat(aliases ?? [], groupDefault)))
}

async function awsUserToEmail(workmail: Workmail, user: WorkmailUser): Promise<AwsEmail[]> {
  let userDefault: AwsUserDefaultEmail[] =
    mapUndef(email => [{kind: "AwsUserDefaultEmail", userEntityId: user.entityId, email: email}], user.email) ?? []

  let currentAliases = workmail.service.listAliases({ EntityId: user.entityId, OrganizationId: workmail.organizationId}).promise()

  let aliases: Promise<AwsEmail[]|undefined> = currentAliases.then(
    response => response.Aliases?.map(alias => ({kind: "AwsUserAlias", userEntityId: user.entityId, email: alias})))

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

function awsGroupsToMap(awsGroups?: AWS.WorkMail.Groups): WorkmailEntityMap {
  let groups = R.pipe(R.map(convertGroup), filterUndef)(awsGroups ?? [])
  return R.zipObj(groups.map(x => x.entityId), groups)
}

function convertUser(user: AWS.WorkMail.User): WorkmailUser|undefined {
  let kind: "WorkmailUser" = "WorkmailUser"
  let common = convertEntityCommon(kind, user)
  return mapUndef(common => ({...common, kind}), common)
}

function awsUsersToMap(awsUsers?: AWS.WorkMail.Users): WorkmailEntityMap {
  let users = R.pipe(R.map(convertUser), filterUndef)(awsUsers ?? [])
  return R.zipObj(users.map(x => x.entityId), users)
}

function entityMapToEmailMap(workmail: Workmail, entityMap: WorkmailEntityMap): Promise<WorkmailEmailmap> {
  let emailPromises = Object.values(entityMap).map((entity): (() => Promise<AwsEmail[]>) =>
    {
      switch (entity.kind) {
        case "WorkmailGroup":
          return () => awsGroupToEmail(workmail, entity)
        case "WorkmailUser":
          return () => awsUserToEmail(workmail, entity)
      }
    })

  let emailsPromise = serialPromisesFlatten(emailPromises)

  return emailsPromise.then(
    emails => {
      return R.zipObj(emails.map(x => x.email), emails)
    })
}

export async function getAwsEmailMap(workmail: Workmail): Promise<AwsEmailMap> {
  let currentUsersResponse = workmail.service.listUsers({ OrganizationId: workmail.organizationId }).promise()
  let currentGroupsResponse = workmail.service.listGroups({ OrganizationId: workmail.organizationId }).promise()
  let groupsMapPromise = currentGroupsResponse.then(response => awsGroupsToMap(response.Groups))
  let usersMapPromise = currentUsersResponse.then(response => awsUsersToMap(response.Users))
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