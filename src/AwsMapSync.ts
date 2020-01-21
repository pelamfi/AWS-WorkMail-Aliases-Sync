import {WorkmailEmailmap} from './WorkmailMap';
import {AwsEmailOperation} from './AwsEmailOperation';
import * as R from 'ramda';
import {filterUndef} from './UndefUtil'

export function awsMapSync(currentMap: WorkmailEmailmap, targetMap: WorkmailEmailmap): AwsEmailOperation[] {

  let removals = R.keys(currentMap).map((email): AwsEmailOperation|undefined => {
    let current = currentMap[email]
    let target = targetMap[email]

    if (current === undefined) {
      return undefined
    }

    if (current.kind == "WorkmailGroupAlias" && ((target?.kind == "WorkmailGroupAlias" && target?.groupEntityId != current.groupEntityId) || current.kind != target?.kind)) {
      return {kind: "RemoveGroupAlias", groupEntityId: current.groupEntityId, aliasEmail: current.email}
    }
    else if (current.kind == "WorkmailGroupDefault" && target !== undefined && ((target.kind == "WorkmailGroupDefault" && target.groupEntityId != current.groupEntityId) || current.kind != target.kind)) {
      throw `Email ${current.email} is configured as ${current.kind}. Removing/changing the group is currently not supported. Please fix manually. It is expected to be ${target.kind} ${target.email}` // can this happen?
    }
    else if (current.kind == "WorkmailUserAlias" && ((target?.kind == "WorkmailUserAlias" && target?.userEntityId != current.userEntityId) || current.kind != target?.kind)) {
      return {kind: "RemoveUserAlias", userEntityId: current.userEntityId, aliasEmail: current.email}
    }
    else if (current.kind == "WorkmailUserDefault" && target !== undefined && ((target.kind == "WorkmailUserDefault" && target.userEntityId != current.userEntityId) || current.kind != target.kind)) {
      throw `Email ${current.email} is configured as ${current.kind}. Removing/changing the user is currently not supported. Please fix manually. It is expected to be ${target.kind} ${target.email}` // can this happen?
    }

    return undefined
  })

  let additions = R.keys(targetMap).map((email): AwsEmailOperation | undefined => {
    let target = targetMap[email]
    let current = currentMap[email]
    switch (target.kind) {
      case "WorkmailGroupAlias":
      if (current == undefined || (current.kind == "WorkmailGroupAlias" && current.groupEntityId != target.groupEntityId)) {
        return {kind: "AddGroupAlias", groupEntityId: target.groupEntityId, aliasEmail: target.email}
      }
      break;
      case "WorkmailUserAlias": 
      if (current == undefined || (current.kind == "WorkmailUserAlias" && current.userEntityId != target.userEntityId)) {
        return {kind: "AddUserAlias", userEntityId: target.userEntityId, aliasEmail: target.email}
      }
      break;
      default:
        throw `unsupported, can't currently add ${target.kind}`
    }
    return undefined
  })

  return R.concat(filterUndef(removals), filterUndef(additions))
}