export interface AddUserAlias {
  kind: "AddUserAlias",
  userEntityId: AWS.WorkMail.WorkMailIdentifier,
  aliasEmail: string
}

export interface RemoveUserAlias {
  kind: "RemoveUserAlias",
  userEntityId: AWS.WorkMail.WorkMailIdentifier,
  aliasEmail: string
}

export interface RemoveGroupAlias {
  kind: "RemoveGroupAlias",
  groupEntityId: AWS.WorkMail.WorkMailIdentifier,
  aliasEmail: string
}

export interface AddGroupAlias {
  kind: "AddGroupAlias",
  groupEntityId: AWS.WorkMail.WorkMailIdentifier,
  aliasEmail: string
}

export type AwsEmailOperation = AddUserAlias | RemoveUserAlias | RemoveGroupAlias | AddGroupAlias
