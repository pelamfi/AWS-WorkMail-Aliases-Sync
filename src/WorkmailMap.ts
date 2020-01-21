import * as AWS from 'aws-sdk'

export interface Workmail {
  service: AWS.WorkMail,
  organizationId: string,
}

export interface WorkmailUserDefault {
  kind: "WorkmailUserDefault",
  userEntityId: AWS.WorkMail.WorkMailIdentifier,
  email: string
}

export interface WorkmailUserAlias {
  kind: "WorkmailUserAlias"
  userEntityId: AWS.WorkMail.WorkMailIdentifier,
  email: string
}

export interface WorkmailGroupDefault {
  kind: "WorkmailGroupDefault",
  groupEntityId: AWS.WorkMail.WorkMailIdentifier,
  email: string
}

export interface WorkmailGroupAlias {
  kind: "WorkmailGroupAlias",
  groupEntityId: AWS.WorkMail.WorkMailIdentifier,
  email: string
}

export type WorkmailEmail = WorkmailUserDefault | WorkmailUserAlias | WorkmailGroupDefault | WorkmailGroupAlias

export type WorkmailEmailmap = {[index: string]: WorkmailEmail}

export interface WorkmailEntityCommon {
  entityId: AWS.WorkMail.WorkMailIdentifier,
  name: string,
  email?: string
}

export type WorkmailUser = {kind: "WorkmailUser"} & WorkmailEntityCommon
export type WorkmailGroup = {kind: "WorkmailGroup"} & WorkmailEntityCommon
export type WorkmailEntity = WorkmailUser | WorkmailGroup

export type WorkmailEntityMap = {[index: string]: WorkmailEntity}

// Rename to WormailMap
export type WorkmailMap = {
  byEntityId: WorkmailEntityMap
  byEmail: WorkmailEmailmap
}
