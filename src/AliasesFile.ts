import * as R from 'ramda';

export interface AliasesFileUser {
  localEmail: string // the name of the the alias, no domain part
  aliases: string[]
}

export interface AliasesFileAlias {
  alias: string // the name of the the alias, no domain part
  localEmails: string[] // name(s) of local users that this localEmail is alias of
}

export interface AliasesFile {
  aliases: AliasesFileAlias[]
}

export interface AliasesFileUsers {
  users: AliasesFileUser[]
}

function toAliasesPerUser(alias: AliasesFileAlias): AliasesFileUser[] {
  return alias.localEmails.map(localEmail => ({ localEmail: localEmail, aliases: [alias.alias] }))
}

export function aliasesPerUser(aliasesFile: AliasesFileAlias[]): AliasesFileUsers {
  let asAliasesPerUser: AliasesFileUser[] = R.chain(toAliasesPerUser, aliasesFile)
  let grouped: { [index: string]: AliasesFileUser[] } = R.groupBy(aliasesPerUser => aliasesPerUser.localEmail, asAliasesPerUser)
  
  let users = Object
    .keys(grouped)
    .sort()
    .map(localEmail => {
      let combinedAliases = R.chain(user => user.aliases, grouped[localEmail]).sort()
      return ({ localEmail: localEmail, aliases: combinedAliases })}
    ) 

  return { users }
}