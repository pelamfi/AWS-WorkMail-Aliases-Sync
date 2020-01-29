import {EmailOperation} from './EmailOperation';
import * as R from 'ramda';
import {filterUndef} from './UndefUtil'
import { EmailMap } from './EmailMap';

export function awsMapSync(currentMap: EmailMap, targetMap: EmailMap): EmailOperation[] {

  let removals = R.keys(currentMap).map((email): EmailOperation|undefined => {
    let current = currentMap[email]
    let target = targetMap[email]

    if (current === undefined) {
      return undefined
    }

    if (current.kind == "EmailGroupAlias" && ((target?.kind == "EmailGroupAlias" && target?.group.email.email != current.group.email.email) || current.kind != target?.kind)) {
      return {kind: "RemoveGroupAlias", alias: current}
    }
    else if (current.kind == "EmailGroup" && target !== undefined && current.kind != target.kind) {
      throw `Email ${current.email} is configured as ${current.kind}. Removing/changing the group is currently not supported. Please fix manually. It is expected to be ${target.kind} ${target.email}` // can this happen?
    }
    else if (current.kind == "EmailUserAlias" && ((target?.kind == "EmailUserAlias" && target?.user.email.email != current.user.email.email) || current.kind != target?.kind)) {
      return {kind: "RemoveUserAlias", alias: current}
    }
    else if (current.kind == "EmailUser" && target !== undefined && ((target.kind == "EmailUser" && target.email.email != current.email.email) || current.kind != target.kind)) {
      throw `Email ${current.email} is configured as ${current.kind}. Removing/changing the user is currently not supported. Please fix manually. It is expected to be ${target.kind} ${target.email}` // can this happen?
    }

    return undefined
  })

  let additions = R.keys(targetMap).map((email): EmailOperation | undefined => {
    let target = targetMap[email]
    let current = currentMap[email]
    switch (target.kind) {
      case "EmailGroupAlias":
      if (current == undefined || (current.kind == "EmailGroupAlias" && current.group.email.email != target.group.email.email)) {
        return {kind: "AddGroupAlias", alias: target}
      }
      break;
      case "EmailUserAlias": 
      if (current == undefined || (current.kind == "EmailUserAlias" && current.user.email.email != target.user.email.email)) {
        return {kind: "AddUserAlias", alias: target}
      }
      break;
      default:
        throw `unsupported, can't currently add ${target.kind}`
    }
    return undefined
  })

  return R.concat(filterUndef(removals), filterUndef(additions))
}