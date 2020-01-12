import * as AWS from 'aws-sdk'

export interface Workmail {
  service: AWS.WorkMail,
  organizationId: string,
}

export interface AwsUserDefaultEmail {
  kind: "AwsUserDefaultEmail",
  userEntityId: AWS.WorkMail.WorkMailIdentifier,
  email: string
}

export interface AwsUserAlias {
  kind: "AwsUserAlias"
  userEntityId: AWS.WorkMail.WorkMailIdentifier,
  email: string
}

export interface AwsGroupDefaultEmail {
  kind: "AwsGroupDefaultEmail",
  groupEntityId: AWS.WorkMail.WorkMailIdentifier,
  email: string
}

export interface AwsGroupAlias {
  kind: "AwsGroupAlias",
  groupEntityId: AWS.WorkMail.WorkMailIdentifier,
  email: string
}

export interface WorkmailEntityCommon {
  entityId: AWS.WorkMail.WorkMailIdentifier,
  name: string,
  email?: string
}

export type WorkmailUser = {kind: "WorkmailUser"} & WorkmailEntityCommon
export type WorkmailGroup = {kind: "WorkmailGroup"} & WorkmailEntityCommon
export type WorkmailEntity = WorkmailUser | WorkmailGroup

export type AwsEmail = AwsUserDefaultEmail | AwsUserAlias | AwsGroupDefaultEmail | AwsGroupAlias

export type WorkmailEntityMap = {[index: string]: WorkmailEntity}

export type WorkmailEmailmap = {[index: string]: AwsEmail}

// Rename to WormailMap
export type AwsEmailMap = {
  byEntityId: WorkmailEntityMap
  byEmail: WorkmailEmailmap
}
