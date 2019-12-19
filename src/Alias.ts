import * as R from 'ramda';

export interface AliasesUser {
  localEmail: string // the name of the the alias, no domain part
  aliases: string[]
}

export interface Alias {
  localEmail: string // the name of the the alias, no domain part
  targets: string[] // name(s) of local users that this localEmail is alias of
}

export interface AliasesFile {
  aliases: Alias[]
}

export interface AliasesPerUser {
  users: AliasesUser[]
}

function toAliasesPerUser(alias: Alias): AliasesUser[] {
  return alias.targets.map(target => ({localEmail: alias.localEmail, aliases:[target]}))
}

export function aliasesPerUser(aliasesFile: AliasesFile): AliasesPerUser {
  let asAliasesPerUser: AliasesUser[] = R.chain(toAliasesPerUser, aliasesFile.aliases)
  let grouped: {[index: string]: AliasesUser[]} = R.groupBy(aliasesPerUser => aliasesPerUser.localEmail, asAliasesPerUser)
  let localEmails: string[] = Object.keys(grouped)
  let users: AliasesUser[] = R.chain(localEmail => grouped[localEmail].map(aliasUser => ({localEmail: localEmail, aliases: aliasUser.aliases})), localEmails)
  return {users}
}