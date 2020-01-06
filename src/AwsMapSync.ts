import {AwsEmailMap} from './AwsEmailMap';
import {AwsEmailOperation} from './AwsEmailOperation';
import * as R from 'ramda';
import {filterUndef} from './UndefUtil'

export function awsMapSync(currentMap: AwsEmailMap, targetMap: AwsEmailMap): AwsEmailOperation[] {

  let removals = R.keys(currentMap).map((email): AwsEmailOperation|undefined => {
    let current = currentMap[email]
    let target = targetMap[email]
    if (current === undefined) {
      return undefined
    }

    if (current.kind == "AwsGroupAlias" && ((target?.kind == "AwsGroupAlias" && target.groupEntityId != current.groupEntityId) || current.kind != target?.kind)) {
      return {kind: "RemoveGroupAlias", groupEntityId: current.groupEntityId, aliasEmail: current.email}
    }
    else if (current.kind == "AwsGroupDefaultEmail" && ((target?.kind == "AwsGroupDefaultEmail" && target.groupEntityId != current.groupEntityId) || current.kind != target?.kind)) {
      throw `Email ${current.email} is configured as ${target.kind}. Changing it is currently not supported. Please fix manually. It is expected to be ${target.kind} ${target.email}` // can this happen?
    }
    else if (current.kind == "AwsUserAlias" && ((target?.kind == "AwsUserAlias" && target.userEntityId != current.userEntityId) || current.kind != target?.kind)) {
      return {kind: "RemoveUserAlias", userEntityId: current.userEntityId, aliasEmail: current.email}
    }
    else if (current.kind == "AwsUserDefaultEmail" && ((target?.kind == "AwsUserDefaultEmail" && target.userEntityId != current.userEntityId) || current.kind != target?.kind)) {
      throw `Email ${current.email} is configured as ${target.kind}. Changing it is currently not supported. Please fix manually. It is expected to be ${target.kind} ${target.email}` // can this happen?
    }

    return undefined
  })

  let additions = R.keys(targetMap).map((email): AwsEmailOperation | undefined => {
    let target = targetMap[email]
    let current = currentMap[email]
    switch (target.kind) {
      case "AwsGroupAlias":
      if (current == undefined || (current.kind == "AwsGroupAlias" && current.groupEntityId != target.groupEntityId)) {
        return {kind: "AddGroupAlias", groupEntityId: target.groupEntityId, aliasEmail: target.email}
      }
      break;
      case "AwsUserAlias": 
      if (current == undefined || (current.kind == "AwsUserAlias" && current.userEntityId != target.userEntityId)) {
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