import * as R from 'ramda';
import {AliasesFileUsers} from './AliasesFile';
import {AliasesFileUser} from './AliasesFile';
import {WorkmailEmailmap, AwsUserAlias} from './AwsEmailMap';
import {emailAddDomain} from './EmailUtil'

export function aliasesFileToAwsMap(aliasesFileUsers: AliasesFileUsers, aliasesFileDomain: string, localUserToEntityId: ((localEmail: string) => AWS.WorkMail.WorkMailIdentifier|undefined)): WorkmailEmailmap {

  // TODO: Handle more than 100 aliases by creating groups

  function localUserToAwsAlias(localUser: AliasesFileUser): AwsUserAlias[] {
    let userEntityId = localUserToEntityId(localUser.localEmail)
    if (userEntityId === null) {
      throw `No AWS user for local user ${localUser.localEmail}`
    } else {
      return localUser.aliases.map( (alias): AwsUserAlias  => {
        let email = emailAddDomain(alias, aliasesFileDomain)
        return {kind: "AwsUserAlias", userEntityId: userEntityId || "", email}
      })
    }
  }

  let allAliases = R.flatten(aliasesFileUsers.users.map(localUserToAwsAlias))

  let allAliasesByEmail = R.groupBy((alias) => alias.email, allAliases)

  let [groups, regularAliases] = R.partition(alias => allAliasesByEmail[alias.email].length > 1, allAliases)

  console.log(groups) // TODO: Handle cases where multiple users have same alias, create groups

  return R.zipObj(regularAliases.map(a => a.email), regularAliases)
}