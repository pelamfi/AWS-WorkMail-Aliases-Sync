import * as R from 'ramda';
import * as AWS from 'aws-sdk'
import { EmailMap, EmailAddr, EmailGroup, Email, EmailUser } from './EmailMap'
import { filterUndef } from './UndefUtil';

export interface WorkmailEntityCommon {
  entityId: AWS.WorkMail.WorkMailIdentifier,
  name: string,
  email?: EmailAddr
}

export type WorkmailUser = {kind: "WorkmailUser"} & WorkmailEntityCommon
export type WorkmailGroup = {kind: "WorkmailGroup"} & WorkmailEntityCommon
export type WorkmailEntity = WorkmailUser | WorkmailGroup

export type WorkmailEntityMap = {[index: string]: WorkmailEntity}

export type EntityMap = {
  byId: WorkmailEntityMap
  byEmail: WorkmailEntityMap
}

export type WorkmailMap = {
  entityMap: EntityMap,
  emailMap: EmailMap
}

export function workmailMapFromEntities(entities: [WorkmailEntity, [EmailAddr]][]): WorkmailMap {
  let byId = R.zipObj(entities.map(entity => entity[0].entityId), entities.map(p => p[0]))
  let entitiesByEmails: WorkmailEntityMap[] = entities.map(entityPair => {
    let [entity, aliases] = entityPair
    let mainEmail = entity.email
    let emails: EmailAddr[] = [...(mainEmail === undefined ? [] : [mainEmail]), ...aliases]
    let pairs: [EmailAddr, WorkmailEntity][] = emails.map(email => [email, entity])
    return R.zipObj(pairs.map(p => p[0].email), pairs.map(p => p[1]))
  })
  let byEmail = R.mergeAll(entitiesByEmails)
  let entityMap: EntityMap = {byId, byEmail}
  let emailMapParts = entities.map((entityPair): Email[]|undefined => {
    let [entity, aliases] = entityPair
    let mainEmail = entity.email
    if (mainEmail === undefined) {
      return undefined
    }
    switch (entity.kind) {
      case "WorkmailGroup": {
          let group: EmailGroup = {kind: "EmailGroup", email: mainEmail}
          let aliasesObjs: Email[] = aliases.map(email => ({kind: "EmailGroupAlias", email, group}))
          return [group, ...aliasesObjs]
      }
      case "WorkmailUser": {
          let user: EmailUser = {kind: "EmailUser", email: mainEmail}
          let aliasesObjs: Email[] = aliases.map(email => ({kind: "EmailUserAlias", email, user}))
          return [user, ...aliasesObjs]
        }
      }
  })
  let emailMapItems = R.flatten(filterUndef(emailMapParts))
  let emailMap: EmailMap = R.zipObj(emailMapItems.map(i => i.email.email), emailMapItems)
  return {entityMap, emailMap}
}

//function mergeEntityMaps(a: WorkmailMap, b: WorkmailMap) {
//}