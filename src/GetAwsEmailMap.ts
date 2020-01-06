import * as AWS from 'aws-sdk'
import * as R from 'ramda';
import {Workmail} from './AwsWorkMailUtil';
import {AwsEmail, AwsUserDefaultEmail, AwsGroupDefaultEmail, AwsEmailMap} from './AwsEmailMap';
import { serialPromises } from './PromiseUtil';

async function awsUserToEmail(workmail: Workmail, user: AWS.WorkMail.User): Promise<AwsEmail[]> {
  let userDefault: AwsUserDefaultEmail[]
  let userEntityId = user.Id ?? "no entity id"
  if (user.Email == undefined) {
    console.log(`User ${user.Name} has no email`)
    userDefault = []
  } else {
    userDefault = [{kind: "AwsUserDefaultEmail", userEntityId, email: user.Email}]
  }
  let currentAliases = workmail.service.listAliases({ EntityId: userEntityId, OrganizationId: workmail.organizationId}).promise()
  let aliases: Promise<AwsEmail[] | undefined> = currentAliases.then(response => response.Aliases?.map(alias => ({kind: "AwsUserAlias", userEntityId, email: alias})))
  return aliases.then(aliases => Promise.resolve(R.concat(aliases ?? [], userDefault)))
}

async function awsGroupToEmail(workmail: Workmail, group: AWS.WorkMail.Group): Promise<AwsEmail[]> {
  let groupDefault: AwsGroupDefaultEmail[]
  let groupEntityId = group.Id ?? "no group entity id"
  if (group.Email == undefined) {
    console.log(`Group ${group.Name} has no email, skipping`)
    return Promise.resolve([])
  } else {
    groupDefault = [{kind: "AwsGroupDefaultEmail", groupEntityId: groupEntityId, email: group.Email}]
  }

  let currentAliases = workmail.service.listAliases({ EntityId: groupEntityId, OrganizationId: workmail.organizationId}).promise()
  let aliases: Promise<AwsEmail[]|undefined> = currentAliases.then(response => response.Aliases?.map(alias => ({kind: "AwsGroupAlias", groupEntityId, email: alias})))
  return aliases.then(aliases => Promise.resolve(R.concat(aliases ?? [], groupDefault)))
}

function serialAwsPromises(promises: (() => Promise<AwsEmail[]>)[]): Promise<AwsEmail[]> {
  return serialPromises(promises, [] as any[], R.concat)
}

export async function getAwsEmailMap(workmail: Workmail): Promise<AwsEmailMap> {
  let currentUsersResponse = workmail.service.listUsers({ OrganizationId: workmail.organizationId }).promise()
  let currentGroupsResponse = workmail.service.listGroups({ OrganizationId: workmail.organizationId }).promise()
  let currentGroups = currentGroupsResponse.then(response => serialAwsPromises(response.Groups?.map(group => () => awsGroupToEmail(workmail, group)) ?? []))
  let currentUsers = currentUsersResponse.then(response => serialAwsPromises(response.Users?.map(user => () => awsUserToEmail(workmail, user)) ?? []))
  let emails: Promise<AwsEmail[]> = Promise.all([currentGroups, currentUsers]).then(R.flatten)
  return emails.then(emails => R.zipObj(emails.map(x => x.email), emails))
}