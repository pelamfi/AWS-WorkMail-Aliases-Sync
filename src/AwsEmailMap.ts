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


export type AwsEmail = AwsUserDefaultEmail | AwsUserAlias | AwsGroupDefaultEmail | AwsGroupAlias

export type AwsEmailMap = {[index: string]: AwsEmail}
