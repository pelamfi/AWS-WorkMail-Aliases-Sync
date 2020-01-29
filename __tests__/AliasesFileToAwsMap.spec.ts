import { aliasesFileToEmailMap } from '../src/AliasesFileToAwsMap';
import { EmailAddr, EmailMap, EmailUser } from '../src/EmailMap';

function localUserToEmail(localEmail: string): EmailAddr {
  return new EmailAddr(`${localEmail}-localEmail@foo`)
}

let userEmail1 = new EmailAddr("localemail-localEmail@foo")
let userEmail2 = new EmailAddr("localemail2-localEmail@foo")
let user1: EmailUser = { kind: "EmailUser", email: userEmail1 }
let user2: EmailUser = { kind: "EmailUser", email: userEmail2 }
let alias1 = new EmailAddr("fooalias@domain")
let alias2 = new EmailAddr("fooalias2@domain")
let alias3 = new EmailAddr("fooalias3@domain")

describe('Creating EmailMap from aliases file´', () => {
  it('accepts empty data', () => {
    expect(aliasesFileToEmailMap({ users: [] }, "domain", () => undefined)).toStrictEqual({});
  });

  it('creates a single alias', () => {
    let expected: EmailMap = {
      "fooalias@domain": { kind: "EmailUserAlias", user: user1, email: alias1 },
      "localemail-localEmail@foo": user1
    }
    expect(aliasesFileToEmailMap({ users: [{ localEmail: "localemail", aliases: ["fooalias"] }] }, "domain", localUserToEmail))
      .toStrictEqual(expected);
  });

  it('creates 2 aliases for a single user', () => {
    let expected: EmailMap = {
      "fooalias@domain": { kind: "EmailUserAlias", user: user1, email: alias1 },
      "fooalias2@domain": { kind: "EmailUserAlias", user: user1, email: alias2 },
      "localemail-localEmail@foo": user1
    }
    expect(aliasesFileToEmailMap({ users: [{ localEmail: "localemail", aliases: ["fooalias", "fooalias2"] }] }, "domain", localUserToEmail))
      .toStrictEqual(expected);
  });

  it('creates aliases for a 2 users', () => {

    let expected: EmailMap = {
      "fooalias@domain": { kind: "EmailUserAlias", user: user1, email: alias1 },
      "fooalias2@domain": { kind: "EmailUserAlias", user: user2, email: alias2 },
      "fooalias3@domain": { kind: "EmailUserAlias", user: user2, email: alias3 },
      "localemail-localEmail@foo": user1,
      "localemail2-localEmail@foo": user2
    }

    expect(aliasesFileToEmailMap({
      users: [
        { localEmail: "localemail", aliases: ["fooalias"] },
        { localEmail: "localemail2", aliases: ["fooalias2", "fooalias3"] },
      ]
    }, "domain", localUserToEmail))
      .toStrictEqual(expected);
  });

})