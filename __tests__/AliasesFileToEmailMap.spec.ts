import { aliasesFileToEmailMap, Config } from '../src/AliasesFileToEmaiMap';
import { EmailMap, EmailUser } from '../src/EmailMap';
import { Email } from '../src/Email';

function localUserToEmail(localEmail: string): Email {
  return new Email(`${localEmail}-localEmail@foo`)
}

const userEmail1 = new Email("localemail-localEmail@foo")
const userEmail2 = new Email("localemail2-localEmail@foo")
const user1: EmailUser = { kind: "EmailUser", email: userEmail1 }
const user2: EmailUser = { kind: "EmailUser", email: userEmail2 }
const alias1 = new Email("fooalias@domain")
const alias2 = new Email("fooalias2@domain")
const alias3 = new Email("fooalias3@domain")

function config(localUserToEmail: ((localUser: string) => Email|undefined)): Config {
  return {aliasesFileDomain: "domain", localUserToEmail, groupPrefix: "groupPrefix"}
}

describe('Creating EmailMap from aliases file´', () => {
  it('accepts empty data', () => {
    expect(aliasesFileToEmailMap({ users: [] }, config(() => undefined))).toStrictEqual({})
  });

  it('creates a single alias', () => {
    const expected: EmailMap = {
      "fooalias@domain": { kind: "EmailUserAlias", user: user1, email: alias1 },
      "localemail-localEmail@foo": user1
    }
    expect(aliasesFileToEmailMap({ users: [{ localEmail: "localemail", aliases: ["fooalias"] }] }, config(localUserToEmail)))
      .toStrictEqual(expected)
  });

  it('creates 2 aliases for a single user', () => {
    const expected: EmailMap = {
      "fooalias@domain": { kind: "EmailUserAlias", user: user1, email: alias1 },
      "fooalias2@domain": { kind: "EmailUserAlias", user: user1, email: alias2 },
      "localemail-localEmail@foo": user1
    }
    expect(aliasesFileToEmailMap({ users: [{ localEmail: "localemail", aliases: ["fooalias", "fooalias2"] }] }, config(localUserToEmail)))
      .toStrictEqual(expected)
  });

  it('creates aliases for a 2 users', () => {

    const expected: EmailMap = {
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
    }, config(localUserToEmail)))
      .toStrictEqual(expected)
  });

})