import { EmailUserAlias, EmailGroupAlias } from './EmailMap';

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

export type EmailOperation = AddUserAlias | RemoveUserAlias | RemoveGroupAlias | AddGroupAlias
