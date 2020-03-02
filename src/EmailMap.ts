import { EmailAddr } from './EmailAddr'

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

export interface EmailGroupAlias {
  readonly kind: "EmailGroupAlias",
  readonly group: EmailGroup,
  readonly email: EmailAddr
}

export type Email = EmailUser | EmailUserAlias | EmailGroup | EmailGroupAlias

export type EmailMap = {readonly [index: string]: Email}

// Looks like a name made with the generatedGroupName function below.
export function isGeneratedGroupName(groupName: string, config: Config): boolean {
  return groupName.startsWith(config.groupPrefix + "-")
}

// Default group name based on email address.
export function generatedGroupName(email: EmailAddr, config: Config) {
  return config.groupPrefix + "-" + email.local
}
