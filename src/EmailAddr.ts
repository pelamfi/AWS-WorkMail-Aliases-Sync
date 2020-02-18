export type PlainEmailAddress = string

export class EmailAddr {
  private readonly _email: PlainEmailAddress; // using private disables structural typing
  constructor(email: PlainEmailAddress) {
    this._email = email;
  }
  get email() {
    return this._email;
  }
}
