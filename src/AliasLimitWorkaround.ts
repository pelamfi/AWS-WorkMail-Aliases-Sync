
import * as R from 'ramda';
import { EmailMap, EmailUserAlias } from './EmailMap';

export function aliasLimitWorkaround(emailMap: EmailMap): EmailMap {

  let userAliases = Object.values(emailMap).filter( x => x.kind == "EmailUserAlias" ) as EmailUserAlias[]

  let groupByUserEmail = R.groupBy((email: EmailUserAlias): string => email.user.email.email)

  let grouped: {[index: string]: EmailUserAlias[]} = groupByUserEmail(userAliases)

  let aliasLimit = 80 // 100 really

  type EmailAddrMap = {[index: string]: EmailUserAlias}

  let excessAliases: EmailAddrMap = R.mergeAll(Object
    .values(grouped)
    .map((aliasesForUser: EmailUserAlias[]): EmailAddrMap => {
      let excess = R.drop(aliasLimit, aliasesForUser)
      return R.zipObj(excess.map(x => x.email.email), excess)
      }
    ))

  function isNotExcess(email: EmailUserAlias) {
    return excessAliases[email.email.email] === undefined
  }

  let filtered = Object.values(emailMap).filter(isNotExcess)
  return R.zipObj(filtered.map(x => x.email.email), filtered)
}
