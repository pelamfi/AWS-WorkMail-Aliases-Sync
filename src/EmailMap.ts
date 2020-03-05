import { Email } from './Email'

// This file contains EmailMap and its item types which model email aliases and users.

export interface EmailUser {
  readonly kind: "EmailUser",
  readonly email: Email
}

export interface EmailUserAlias {
  readonly kind: "EmailUserAlias"
  readonly user: EmailUser,
  readonly email: Email
}

export interface EmailGroup {
  readonly kind: "EmailGroup",
  readonly name: string,
  readonly email: Email,
  readonly members: EmailUser[]
}

export interface EmailGroupAlias {
  readonly kind: "EmailGroupAlias",
  readonly group: EmailGroup,
  readonly email: Email
}

export type EmailItem = EmailUser | EmailUserAlias | EmailGroup | EmailGroupAlias

export type EmailMap = {readonly [index: string]: EmailItem}
