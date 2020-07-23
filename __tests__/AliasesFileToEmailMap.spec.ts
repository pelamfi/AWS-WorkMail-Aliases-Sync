import { aliasesFileToEmailMap, Config } from '../src/AliasesFileToEmaiMap';
import { EmailMap, EmailUser } from '../src/EmailMap';
import { Email, emailFrom } from '../src/Email';

function localUserToEmail(localEmail: string): Email {
  return emailFrom(`${localEmail}-localEmail@foo`);
}

const userEmail1 = emailFrom('localemail-localEmail@foo');
const userEmail2 = emailFrom('localemail2-localEmail@foo');
const user1: EmailUser = { kind: 'EmailUser', email: userEmail1 };
const user2: EmailUser = { kind: 'EmailUser', email: userEmail2 };
const alias1 = emailFrom('fooalias@domain');
const alias2 = emailFrom('fooalias2@domain');
const alias3 = emailFrom('fooalias3@domain');

function config(
  localUserToEmail: (localUser: string) => Email | undefined,
): Config {
  return {
    aliasesFileDomain: 'domain',
    localUserToEmail,
    groupPrefix: 'groupPrefix',
    verbose: false,
  };
}

describe('Creating EmailMap from aliases file´', () => {
  it('accepts empty data', () => {
    expect(
      aliasesFileToEmailMap(
        { users: [] },
        config(() => undefined),
      ),
    ).toStrictEqual({});
  });

  it('creates a single alias', () => {
    const expected: EmailMap = {
      'fooalias@domain': { kind: 'EmailUserAlias', user: user1, email: alias1 },
      'localemail-localEmail@foo': user1,
    };
    expect(
      aliasesFileToEmailMap(
        { users: [{ localEmail: 'localemail', aliases: ['fooalias'] }] },
        config(localUserToEmail),
      ),
    ).toStrictEqual(expected);
  });

  it('creates 2 aliases for a single user', () => {
    const expected: EmailMap = {
      'fooalias@domain': { kind: 'EmailUserAlias', user: user1, email: alias1 },
      'fooalias2@domain': {
        kind: 'EmailUserAlias',
        user: user1,
        email: alias2,
      },
      'localemail-localEmail@foo': user1,
    };
    expect(
      aliasesFileToEmailMap(
        {
          users: [
            { localEmail: 'localemail', aliases: ['fooalias', 'fooalias2'] },
          ],
        },
        config(localUserToEmail),
      ),
    ).toStrictEqual(expected);
  });

  it('creates aliases for a 2 users', () => {
    const expected: EmailMap = {
      'fooalias@domain': { kind: 'EmailUserAlias', user: user1, email: alias1 },
      'fooalias2@domain': {
        kind: 'EmailUserAlias',
        user: user2,
        email: alias2,
      },
      'fooalias3@domain': {
        kind: 'EmailUserAlias',
        user: user2,
        email: alias3,
      },
      'localemail-localEmail@foo': user1,
      'localemail2-localEmail@foo': user2,
    };

    expect(
      aliasesFileToEmailMap(
        {
          users: [
            { localEmail: 'localemail', aliases: ['fooalias'] },
            { localEmail: 'localemail2', aliases: ['fooalias2', 'fooalias3'] },
          ],
        },
        config(localUserToEmail),
      ),
    ).toStrictEqual(expected);
  });
});
