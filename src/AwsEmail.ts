import * as AWS from 'aws-sdk'
import * as R from 'ramda';

export interface Workmail {
  service: AWS.WorkMail,
  organizationId: string,
}

export interface AwsUserDefaultEmail {
  kind: "AwsUserDefaultEmail",
  userEntityId: AWS.WorkMail.WorkMailIdentifier,
  email: string
}

export interface AwsUserAlias {
  kind: "AwsUserAlias"
  userEntityId: AWS.WorkMail.WorkMailIdentifier,
  email: string
}

export interface AwsGroupDefaultEmail {
  kind: "AwsGroupDefaultEmail",
  groupEntityId: AWS.WorkMail.WorkMailIdentifier,
  email: string
}

export interface AwsGroupAlias {
  kind: "AwsGroupAlias",
  groupEntityId: AWS.WorkMail.WorkMailIdentifier,
  email: string
}


export type AwsEmail = AwsUserDefaultEmail | AwsUserAlias | AwsGroupDefaultEmail | AwsGroupAlias

export type AwsEmailMap = {[index: string]: AwsEmail}

export interface AddUserAlias {
  kind: "AddUserAlias",
  userEntityId: AWS.WorkMail.WorkMailIdentifier,
  aliasEmail: string
}

export interface RemoveUserAlias {
  kind: "RemoveUserAlias",
  userEntityId: AWS.WorkMail.WorkMailIdentifier,
  aliasEmail: string
}

export interface RemoveGroupAlias {
  kind: "RemoveGroupAlias",
  groupEntityId: AWS.WorkMail.WorkMailIdentifier,
  aliasEmail: string
}

export interface AddGroupAlias {
  kind: "AddGroupAlias",
  groupEntityId: AWS.WorkMail.WorkMailIdentifier,
  aliasEmail: string
}

export type AwsEmailOperation = AddUserAlias | RemoveUserAlias | RemoveGroupAlias | AddGroupAlias

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



function serialPromises(promises: (() => Promise<AwsEmail[]>)[]): Promise<AwsEmail[]> {
  let initial: Promise<AwsEmail[]> = Promise.resolve<AwsEmail[]>([])
  return promises
    .reduce((a, b) => a.then(prev => b().then(next => R.concat(prev, next))), initial)
}

export async function getAwsEmailMap(workmail: Workmail): Promise<AwsEmailMap> {
  let currentUsersResponse = workmail.service.listUsers({ OrganizationId: workmail.organizationId }).promise()
  let currentGroupsResponse = workmail.service.listGroups({ OrganizationId: workmail.organizationId }).promise()
  let currentGroups = currentGroupsResponse.then(response => serialPromises(response.Groups?.map(group => () => awsGroupToEmail(workmail, group)) ?? []))
  let currentUsers = currentUsersResponse.then(response => serialPromises(response.Users?.map(user => () => awsUserToEmail(workmail, user)) ?? []))
  let emails: Promise<AwsEmail[]> = Promise.all([currentGroups, currentUsers]).then(R.flatten)
  return emails.then(emails => R.zipObj(emails.map(x => x.email), emails))
}