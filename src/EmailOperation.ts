import { EmailUserAlias, EmailGroupAlias, EmailGroup, EmailUser } from './EmailMap';

export interface AddUserAlias {
  kind: "AddUserAlias",
  alias: EmailUserAlias
}

export interface RemoveUserAlias {
  kind: "RemoveUserAlias",
  alias: EmailUserAlias
}

export interface RemoveGroupAlias {
  kind: "RemoveGroupAlias",
  alias: EmailGroupAlias
}

export interface AddGroupAlias {
  kind: "AddGroupAlias",
  alias: EmailGroupAlias
}

export interface AddGroup {
  kind: "AddGroup",
  group: EmailGroup
}

export interface AddGroupMember {
  kind: "AddGroupMember",
  group: EmailGroup,
  member: EmailUser
}

export type EmailOperation = AddUserAlias | RemoveUserAlias | RemoveGroupAlias | AddGroupAlias | AddGroup | AddGroupMember
