import * as R from 'ramda';
import {AliasesFileUsers} from './AliasesFile';
import {AliasesFileUser} from './AliasesFile';
import {emailAddDomain} from './EmailUtil'
import {filterUndef} from './UndefUtil'
import { EmailUserAlias, EmailAddr, EmailUser, EmailMap } from './EmailMap';

export function aliasesFileToEmailMap(aliasesFileUsers: AliasesFileUsers, aliasesFileDomain: string, localUserToEmail: ((localUser: string) => EmailAddr|undefined)): EmailMap {

  function localUserToEmails(localUser: AliasesFileUser): [EmailUser, EmailUserAlias[]]|undefined {
    let localUserEmail = localUserToEmail(localUser.localEmail)
    if (localUserEmail === undefined) {
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

  let allAliases = filterUndef(R.flatten(aliasesFileUsers.users.map(localUserToEmails)))

  let allAliasesByEmail = R.groupBy((alias) => alias.email.email, allAliases)

  let [groups, regularAliases] = R.partition(alias => allAliasesByEmail[alias.email.email].length > 1, allAliases)

  console.log("TODO, handle groups", groups.length) // TODO: Handle cases where multiple users have same alias, create groups

  return R.zipObj(regularAliases.map(a => a.email.email), regularAliases)
}