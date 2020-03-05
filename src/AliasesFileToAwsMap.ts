import * as R from 'ramda';
import {AliasesFileUsers} from './AliasesFile';
import {AliasesFileUser} from './AliasesFile';
import {filterUndef} from './UndefUtil'
import { EmailUserAlias, EmailUser, EmailMap, EmailItem, EmailGroup, generatedGroupName } from './EmailMap';
import { Email } from "./EmailAddr";

export interface Config {
  aliasesFileDomain: string, 
  localUserToEmail: ((localUser: string) => Email|undefined)
  groupPrefix: string
}

export function aliasesFileToEmailMap(aliasesFileUsers: AliasesFileUsers, config: Config): EmailMap {

  function localUserToEmails(localUser: AliasesFileUser): [EmailUser, EmailUserAlias[]]|undefined {
    const localUserEmail = config.localUserToEmail(localUser.localEmail)
    if (localUserEmail?.email === undefined) {
      console.log(`Local email user '${localUser.localEmail}' is not in the configuration file localEmailUserToEmail map. Ignored.`)
      return undefined
    }
    const user: EmailUser = {kind: "EmailUser", email: localUserEmail}
    const aliases = localUser.aliases.map( (alias): EmailUserAlias  => {
      const email = new Email(alias, config.aliasesFileDomain)
      return {kind: "EmailUserAlias", email, user}
    })
    return [user, aliases]
  }

  const emails = filterUndef(aliasesFileUsers.users.map(localUserToEmails))

  const users = emails.map(x => x[0])
  const aliases = R.flatten(emails.map(x => x[1]))

  // To check if there are multiple aliases but for different users
  const allAliasesByEmail = R.groupBy((alias) => alias.email.email, aliases)

  // Aliases that target multiple users are "groups"
  const [groups, regularAliases] = R.partition(alias => allAliasesByEmail[alias.email.email].length > 1, aliases)

  // Email aliases that target multiple users
  const groupEmails = R.uniq(groups.map(x => x.email.email))

  const convertedGroups: EmailItem[] = R.flatten(groupEmails.map( groupEmail => {
      const aliasesOfGroup: EmailUserAlias[] = allAliasesByEmail[groupEmail]
      const email = new Email(groupEmail)
      const members = aliasesOfGroup.map(x => x.user)
      const name = generatedGroupName(email, config)
      const group: EmailGroup = {kind: "EmailGroup", email, name, members: members}
      // NOTE: his code does not generate aliases now. It could match groups targeting same set of users and generate aliases
      //const groupAliases: EmailGroupAlias[] = aliasesOfGroup.map(alias => ({kind: "EmailGroupAlias", group, email: alias.email}))
      return [group] // ...groupAliases, 
    }))

  const results: EmailItem[] = [...convertedGroups, ...users, ...regularAliases]

  return R.zipObj(results.map(a => a.email.email), results)
}