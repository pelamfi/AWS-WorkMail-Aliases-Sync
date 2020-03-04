import { EmailAddr } from './EmailAddr'

// This file contains types modeling email aliases and users.

export interface Config {
  groupPrefix: string
}

export interface EmailUser {
  readonly kind: "EmailUser",
  readonly email: EmailAddr
}

export interface EmailUserAlias {
  readonly kind: "EmailUserAlias"
  readonly user: EmailUser,
  readonly email: EmailAddr
}

export interface EmailGroup {
  readonly kind: "EmailGroup",
  readonly name: string,
  readonly email: EmailAddr,
  readonly members: EmailUser[]
}

export interface EmailGroupAlias {d
  readonly kind: "EmailGroupAlias",
  readonly group: EmailGroup,
  readonly email: EmailAddr
}

export type EmailItem = EmailUser | EmailUserAlias | EmailGroup | EmailGroupAlias

export type EmailMap = {readonly [index: string]: EmailItem}

// Looks like a name made with the generatedGroupName function below.
export function isGeneratedGroupName(groupName: string, config: Config): boolean {
  return groupName.startsWith(config.groupPrefix + "-")
}

// Default group name based on email address.
export function generatedGroupName(email: EmailAddr, config: Config) {
  return config.groupPrefix + "-" + email.local
}
