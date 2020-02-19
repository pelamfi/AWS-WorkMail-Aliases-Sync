import * as R from 'ramda';

export interface AliasesFileUser {
  readonly localEmail: string // the name of the the alias, no domain part
  readonly aliases: string[]
}

export interface AliasesFileAlias {
  readonly alias: string // the name of the the alias, no domain part
  readonly localEmails: string[] // name(s) of local users that this localEmail is alias of
}

export interface AliasesFile {
  readonly aliases: AliasesFileAlias[]
}

export interface AliasesFileUsers {
  readonly users: AliasesFileUser[]
}

function toAliasesPerUser(alias: AliasesFileAlias): AliasesFileUser[] {
  return alias.localEmails.map(localEmail => ({ localEmail: localEmail, aliases: [alias.alias] }))
}

export function aliasesPerUser(aliasesFile: AliasesFileAlias[]): AliasesFileUsers {
  const asAliasesPerUser: AliasesFileUser[] = R.chain(toAliasesPerUser, aliasesFile)
  const grouped: { [index: string]: AliasesFileUser[] } = R.groupBy(aliasesPerUser => aliasesPerUser.localEmail, asAliasesPerUser)
  
  const users = Object
    .keys(grouped)
    .sort()
    .map((localEmail): AliasesFileUser => {
      const combinedAliases: string[] = R.uniq(R.chain(user => user.aliases, grouped[localEmail]).sort())
      return ({ localEmail: localEmail, aliases: combinedAliases })}
    ) 

  return { users }
}