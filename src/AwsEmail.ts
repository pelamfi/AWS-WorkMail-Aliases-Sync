import * as AWS from 'aws-sdk'
import * as ScriptConfig from './ScriptConfig'
import * as AliasesFileParse from '../src/AliasesFileParse';
import * as Alias from '../src/Alias';
import { readFileSync } from 'fs';
import * as R from 'ramda';
import {emailDomain, emailLocal} from '../src/EmailUtil'

interface Workmail {
  service: AWS.WorkMail,
  organizationId: string,
}

interface DefaultEmail {
  kind: "DefaultEmail",
  user: AWS.WorkMail.User,
  email: string
}

interface UserAlias {
  kind: "UserAlias"
  user: AWS.WorkMail.User,
  email: string
}

interface GroupDefaultEmail {
  kind: "GroupDefaultEmail",
  group: AWS.WorkMail.Group,
  email: string
}

interface GroupAlias {
  kind: "GroupAlias",
  group: AWS.WorkMail.Group,
  email: string
}


type Email = DefaultEmail | UserAlias | GroupDefaultEmail | GroupAlias

type EmailMap = {[index: string]: Email}

interface AddUserAlias {
  kind: "AddUserAlias",
  user: AWS.WorkMail.User,
  aliasEmail: string
}

interface RemoveUserAlias {
  kind: "RemoveUserAlias",
  user: AWS.WorkMail.User,
  aliasEmail: string
}

type Operation = AddUserAlias | RemoveUserAlias

async function userToEmail(workmail: Workmail, user: AWS.WorkMail.User): Promise<Email[]> {
  let userDefault: DefaultEmail[]
  if (user.Email == undefined) {
    console.log(`User ${user.Name} has no email`)
    userDefault = []
  } else {
    userDefault = [{kind: "DefaultEmail", user, email: user.Email}]
  }
  let currentAliases = workmail.service.listAliases({ EntityId: user.Id, OrganizationId: workmail.organizationId}).promise()
  let aliases: Promise<Email[]> = currentAliases.then(response => response.Aliases.map(alias => ({kind: "UserAlias", user, email: alias})))
  return aliases.then(aliases => Promise.resolve(R.concat(aliases, userDefault)))
}

async function groupToEmail(workmail: Workmail, group: AWS.WorkMail.Group): Promise<Email[]> {
  let groupDefault: GroupDefaultEmail[]
  if (group.Email == undefined) {
    console.log(`Group ${group.Name} has no email, skipping`)
    return Promise.resolve([])
  } else {
    groupDefault = [{kind: "GroupDefaultEmail", group, email: group.Email}]
  }

  let currentAliases = workmail.service.listAliases({ EntityId: group.Id, OrganizationId: workmail.organizationId}).promise()
  let aliases: Promise<Email[]> = currentAliases.then(response => response.Aliases.map(alias => ({kind: "GroupAlias", group, email: alias})))
  return aliases.then(aliases => Promise.resolve(R.concat(aliases, groupDefault)))
}

let initial: Promise<Email[]> = Promise.resolve<Email[]>([])

function serialPromises(promises: (() => Promise<Email[]>)[]): Promise<Email[]> {
  return promises
    .reduce((a, b) => a.then(prev => b().then(next => R.concat(prev, next))), initial)
}

export async function getEmailMap(workmail: Workmail): Promise<EmailMap> {
  let currentUsersResponse = workmail.service.listUsers({ OrganizationId: workmail.organizationId }).promise()
  let currentGroupsResponse = workmail.service.listGroups({ OrganizationId: workmail.organizationId }).promise()
  let currentGroups = currentGroupsResponse.then(response => serialPromises(response.Groups.map(group => () => groupToEmail(workmail, group))))
  let currentUsers = currentUsersResponse.then(response => serialPromises(response.Users.map(user => () => userToEmail(workmail, user))))
  let emails: Promise<Email[]> = Promise.all([currentGroups, currentUsers]).then(R.flatten)
  return emails.then(emails => R.zipObj(emails.map(x => x.email), emails))
}