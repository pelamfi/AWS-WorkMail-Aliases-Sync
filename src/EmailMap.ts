import { emailLocal } from './EmailUtil'
import { EmailAddr } from './EmailAddr'

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

const groupNamePrefix = "generated-"

// Looks like a name made with the generatedGroupName function below.
export function isGeneratedGroupName(groupName: string): boolean {
  return groupName.startsWith(groupNamePrefix)
}

// Default group name based on email address.
export function generatedGroupName(email: EmailAddr) {
  return groupNamePrefix + emailLocal(email.email)
}
