import * as R from 'ramda';
import {AliasesFileUsers} from './AliasesFile';
import {AliasesFileUser} from './AliasesFile';
import {emailAddDomain} from './EmailUtil'
import {filterUndef} from './UndefUtil'
import { EmailUserAlias, EmailAddr, EmailUser, EmailMap, Email, EmailGroup, generatedGroupName } from './EmailMap';

export function aliasesFileToEmailMap(aliasesFileUsers: AliasesFileUsers, aliasesFileDomain: string, localUserToEmail: ((localUser: string) => EmailAddr|undefined)): EmailMap {

  function localUserToEmails(localUser: AliasesFileUser): [EmailUser, EmailUserAlias[]]|undefined {
    let localUserEmail = localUserToEmail(localUser.localEmail)
    if (localUserEmail?.email === undefined) {
      console.log(`Local email user '${localUser.localEmail}' is not in the configuration file localEmailUserToEmail map. Ignored.`)
      return undefined
    }
    let user: EmailUser = {kind: "EmailUser", email: localUserEmail}
    let aliases = localUser.aliases.map( (alias): EmailUserAlias  => {
      let email = emailAddDomain(alias, aliasesFileDomain)
      return {kind: "EmailUserAlias", email: new EmailAddr(email), user}
    })
    return [user, aliases]
  }

  let emails = filterUndef(aliasesFileUsers.users.map(localUserToEmails))

  let users = emails.map(x => x[0])
  let aliases = R.flatten(emails.map(x => x[1]))

  // To check if there are multiple aliases but for different users
  let allAliasesByEmail = R.groupBy((alias) => alias.email.email, aliases)

  // Aliases that target multiple users are "groups"
  let [groups, regularAliases] = R.partition(alias => allAliasesByEmail[alias.email.email].length > 1, aliases)

  // Email aliases that target multiple users
  let groupEmails = R.uniq(groups.map(x => x.email.email))

  let convertedGroups: Email[] = R.flatten(groupEmails.map( groupEmail => {
      let aliasesOfGroup: EmailUserAlias[] = allAliasesByEmail[groupEmail]
      let email = new EmailAddr(groupEmail)
      let members = aliasesOfGroup.map(x => x.user)
      let name = generatedGroupName(email)
      let group: EmailGroup = {kind: "EmailGroup", email, name, members: members}
      // NOTE: his code does not generate aliases now. It could match groups targeting same set of users and generate aliases
      //let groupAliases: EmailGroupAlias[] = aliasesOfGroup.map(alias => ({kind: "EmailGroupAlias", group, email: alias.email}))
      return [group] // ...groupAliases, 
    }))

  let results: Email[] = [...convertedGroups, ...users, ...regularAliases]

  return R.zipObj(results.map(a => a.email.email), results)
}