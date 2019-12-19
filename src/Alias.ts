import * as R from 'ramda';

export interface AliasesUser {
  localEmail: string // the name of the the alias, no domain part
  aliases: string[]
}

export interface Alias {
  alias: string // the name of the the alias, no domain part
  localEmails: string[] // name(s) of local users that this localEmail is alias of
}

export interface AliasesFile {
  aliases: Alias[]
}

export interface AliasesPerUser {
  users: AliasesUser[]
}

function toAliasesPerUser(alias: Alias): AliasesUser[] {
  return alias.localEmails.map(localEmail => ({localEmail: localEmail, aliases:[alias.alias]}))
}

export function aliasesPerUser(aliasesFile: AliasesFile): AliasesPerUser {
  let asAliasesPerUser: AliasesUser[] = R.chain(toAliasesPerUser, aliasesFile.aliases)
  let grouped: {[index: string]: AliasesUser[]} = R.groupBy(aliasesPerUser => aliasesPerUser.localEmail, asAliasesPerUser)
  let localEmails: string[] = Object.keys(grouped)
  let users: AliasesUser[] = R.chain(localEmail => grouped[localEmail].map(aliasUser => ({localEmail: localEmail, aliases: aliasUser.aliases})), localEmails)
  return {users}
}