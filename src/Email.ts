export type PlainEmailAddress = string

export class Email {
  private readonly _email: PlainEmailAddress // using private disables structural typing

  constructor(email: PlainEmailAddress)
  constructor(email: string, domain: string)
  constructor(email: string, domain?: string) {
    if (domain === undefined) {
      this._email = email
    } else {
      this._email = `${email}@${domain}`
    }
  }

  get email() {
    return this._email
  }

  get domain() {
    const split = this._email.split('@')
    if(split.length >= 2) {
      return split[split.length - 1] // name part can contain @ characters
    } else {
      return ""
    }
  }

  get local() {
    const domain = this.domain
    return this._email.substring(0, this._email.length - domain.length - 1)
  }

}
