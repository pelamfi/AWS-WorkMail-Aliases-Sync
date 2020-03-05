import { aliasLimitWorkaround, emailMapAliasLimitWorkaround } from '../src/AliasLimitWorkaround';
import { EmailMap, EmailUser, EmailUserAlias, EmailGroup, EmailGroupAlias } from '../src/EmailMap';
import { Email } from '../src/EmailAddr';

const config = {groupPrefix: "prefix", aliasesFileDomain: "domain", aliasLimit: 1}
// const config2 = {groupPrefix: "prefix", aliasesFileDomain: "domain", aliasLimit: 2}

const userEmail1 = new Email("user1@bar")
const alias1Email = new Email("alias1@bar")
const alias2Email = new Email("alias2@bar")
const alias3Email = new Email("alias1@bar")
const alias4Email = new Email("alias2@bar")
const userEmail2 = new Email("user2@bar")
//const email1 = new EmailAddr("foo@bar")
const user1: EmailUser = { kind: "EmailUser", email: userEmail1 }
const alias1: EmailUserAlias = { kind: "EmailUserAlias", email: alias1Email, user: user1 }
const alias2: EmailUserAlias = { kind: "EmailUserAlias", email: alias2Email, user: user1 }
const user2: EmailUser = { kind: "EmailUser", email: userEmail2 }
const alias3: EmailUserAlias = { kind: "EmailUserAlias", email: alias3Email, user: user2 }
const alias4: EmailUserAlias = { kind: "EmailUserAlias", email: alias4Email, user: user2 }
const aliasGroup1Email = new Email("prefix-alias-user1-0@domain")
const aliasGroup1: EmailGroup = {kind: "EmailGroup", name: "prefix-alias-user1-0", email: aliasGroup1Email, members: [user1]}
const alias2OnGroup1: EmailGroupAlias = {kind: "EmailGroupAlias", email: alias2Email, group: aliasGroup1}
const aliasGroup2Email = new Email("prefix-alias-user2-0@domain")
const aliasGroup2: EmailGroup = {kind: "EmailGroup", name: "prefix-alias-user2-0", email: aliasGroup2Email, members: [user2]}
const alias4OnGroup2: EmailGroupAlias = {kind: "EmailGroupAlias", email: alias4Email, group: aliasGroup2}

describe('Workaround for limit on aliases per entity', () => {

  it('accepts empty data as an EmailMap', () => {
    expect(emailMapAliasLimitWorkaround({}, config)).toStrictEqual({ } as EmailMap);
  });

  it('accepts simple data as an EmailMap', () => {
    const passThroughData: EmailMap = { 
      "user1@bar": user1,
      "alias1@bar": alias1
    }
    expect(emailMapAliasLimitWorkaround(passThroughData, config)).toStrictEqual(passThroughData);
  });

  it('Handles simple workaround as an EmailMap', () => {
    const input: EmailMap = { 
      "user1@bar": user1,
      "alias1@bar": alias1,
      "alias2@bar": alias2
    }
    const expected = {
      "user1@bar": user1,
      "alias1@bar": alias1,
      "prefix-alias-user1-0@domain": aliasGroup1,
      "alias2@bar": alias2OnGroup1
    }
    expect(emailMapAliasLimitWorkaround(input, config)).toStrictEqual(expected);
  });

  it('Handles simple workaround', () => {
    expect(aliasLimitWorkaround([alias1, alias2], config)).toStrictEqual([alias1, aliasGroup1, alias2OnGroup1]);
  });

  it('Handles 2 users', () => {
    expect(aliasLimitWorkaround([alias1, alias2, alias3, alias4], config))
      .toStrictEqual([alias1, aliasGroup1, alias2OnGroup1, alias3, aliasGroup2, alias4OnGroup2]);
  });

});
