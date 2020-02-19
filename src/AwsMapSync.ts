import {EmailOperation, AddGroupMember} from './EmailOperation';
import * as R from 'ramda';
import {filterUndef} from './UndefUtil'
import { EmailMap, EmailGroup } from './EmailMap';

function groupsEqual(a: EmailGroup, b: EmailGroup): boolean {
  let aMemberEmails = a.members.map(x=>x.email.email).sort()
  let bMemberEmails = b.members.map(x=>x.email.email).sort()
  return a.email.email == b.email.email && a.name == b.name && R.equals(aMemberEmails, bMemberEmails)
}

export function awsMapSync(currentMap: EmailMap, targetMap: EmailMap): EmailOperation[] {

  const removals = R.keys(currentMap).map((email): EmailOperation|undefined => {
    const current = currentMap[email]
    const target = targetMap[email]

    if (current === undefined) {
      return undefined
    }

    if (current.kind == "EmailGroupAlias" && ((target?.kind == "EmailGroupAlias" && target?.group.email.email != current.group.email.email) || current.kind != target?.kind)) {
      return {kind: "RemoveGroupAlias", alias: current}
    }
    else if (current.kind == "EmailGroup" && target !== undefined && (target.kind !== "EmailGroup" || !groupsEqual(current, target))) {
      return {kind: "RemoveGroup", group: current}
    }
    else if (current.kind == "EmailUserAlias" && ((target?.kind == "EmailUserAlias" && target?.user.email.email != current.user.email.email) || current.kind != target?.kind)) {
      return {kind: "RemoveUserAlias", alias: current}
    }
    else if (current.kind == "EmailUser" && target !== undefined && ((target.kind == "EmailUser" && target.email.email != current.email.email) || current.kind != target.kind)) {
      throw `Email ${current.email} is configured as ${current.kind}. Removing/changing the user is currently not supported. Please fix manually. It is expected to be ${target.kind} ${target.email}` // can this happen?
    }

    return undefined
  })

  const additions = R.flatten(R.keys(targetMap).map((email): EmailOperation[] | undefined => {
    const target = targetMap[email]
    const current = currentMap[email]
    switch (target.kind) {
      case "EmailGroupAlias":
      if (current == undefined || (current.kind == "EmailGroupAlias" && current.group.email.email != target.group.email.email)) {
        return [{kind: "AddGroupAlias", alias: target}]
      }
      break;
      case "EmailUserAlias": 
      if (current == undefined || (current.kind == "EmailUserAlias" && current.user.email.email != target.user.email.email)) {
        return [{kind: "AddUserAlias", alias: target}]
      }
      break;
      case "EmailGroup": 
      if (current == undefined || (current.kind !== "EmailGroup" || !groupsEqual(current, target))) {
        const group: EmailGroup = target
        const members: AddGroupMember[] = target.members.map(member => ({kind: "AddGroupMember", group, member}))
        return [{kind: "AddGroup", group}, ...members]
      }
      break;
      default:
        if (current == undefined || current.kind !== target.kind) {
          throw `unsupported, can't currently add ${target.kind}`
      }
    }
    return undefined
  }))

  return [...filterUndef(removals), ...filterUndef(additions)]
}