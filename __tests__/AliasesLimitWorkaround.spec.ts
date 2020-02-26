import { aliasLimitWorkaround, emailMapAliasLimitWorkaround } from '../src/AliasLimitWorkaround';
import { EmailMap, EmailUser, EmailUserAlias } from '../src/EmailMap';
import { EmailAddr } from '../src/EmailAddr';

const config = {groupPrefix: "prefix", aliasesFileDomain: "domain", aliasLimit: 1}
const config2 = {groupPrefix: "prefix", aliasesFileDomain: "domain", aliasLimit: 2}

const userEmail1 = new EmailAddr("user1@bar")
const alias1Email = new EmailAddr("alias1@bar")
const alias2Email = new EmailAddr("alias2@bar")
//const userEmail2 = new EmailAddr("user2@bar")
//const email1 = new EmailAddr("foo@bar")
const user1: EmailUser = { kind: "EmailUser", email: userEmail1 }
const alias1: EmailUserAlias = { kind: "EmailUserAlias", email: alias1Email, user: user1 }
const alias2: EmailUserAlias = { kind: "EmailUserAlias", email: alias2Email, user: user1 }
//const user2: EmailUser = { kind: "EmailUser", email: userEmail2 }

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
    const passThroughData: EmailMap = { 
      "user1@bar": user1,
      "alias1@bar": alias1,
      "alias2@bar": alias2
    }
    expect(emailMapAliasLimitWorkaround(passThroughData, config)).toStrictEqual(passThroughData);
  });


});
