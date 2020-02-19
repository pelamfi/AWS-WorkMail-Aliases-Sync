import { EmailUserAlias, EmailGroupAlias, EmailGroup, EmailUser } from './EmailMap';

export interface AddUserAlias {
  readonly kind: "AddUserAlias",
  readonly alias: EmailUserAlias
}

export interface RemoveUserAlias {
  readonly kind: "RemoveUserAlias",
  readonly alias: EmailUserAlias
}

export interface RemoveGroupAlias {
  readonly kind: "RemoveGroupAlias",
  readonly alias: EmailGroupAlias
}

export interface AddGroupAlias {
  readonly kind: "AddGroupAlias",
  readonly alias: EmailGroupAlias
}

export interface AddGroup {
  readonly kind: "AddGroup",
  readonly group: EmailGroup
}

export interface RemoveGroup {
  readonly kind: "RemoveGroup",
  readonly group: EmailGroup
}

export interface AddGroupMember {
  readonly kind: "AddGroupMember",
  readonly group: EmailGroup,
  readonly member: EmailUser
}

export type EmailOperation = AddUserAlias | RemoveUserAlias | RemoveGroupAlias | AddGroupAlias | AddGroup | RemoveGroup | AddGroupMember
