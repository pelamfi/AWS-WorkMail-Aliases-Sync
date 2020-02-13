
export type PlainEmailAddress = string

export class EmailAddr {
  private _email: PlainEmailAddress // using private disables structural
  constructor(email: PlainEmailAddress) {
    this._email = email
  }
  get email() {
    return this._email
  }
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
  readonly email: EmailAddr
}

export interface EmailGroupAlias {
  readonly kind: "EmailGroupAlias",
  readonly group: EmailGroup,
  readonly email: EmailAddr
}

export type Email = EmailUser | EmailUserAlias | EmailGroup | EmailGroupAlias

export type EmailMap = {readonly [index: string]: Email}
