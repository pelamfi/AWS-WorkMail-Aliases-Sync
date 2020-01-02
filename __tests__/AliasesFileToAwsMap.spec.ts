import { aliasesFileToAwsMap } from '../src/AliasesFileToAwsMap';

function localUserToEntityId(localEmail: string): AWS.WorkMail.WorkMailIdentifier {
  return `${localEmail}-entityId`
}

describe('Creating AwsEmailMap', () => {
  it('accepts empty data', () => {
    expect(aliasesFileToAwsMap({ users: [] }, "domain", () => "")).toStrictEqual({});
  });

  it('creates a single alias', () => {
    expect(aliasesFileToAwsMap({ users: [{ localEmail: "localemail", aliases: ["fooalias"] }] }, "domain", localUserToEntityId))
      .toStrictEqual({ "fooalias@domain": { kind: "AwsUserAlias", userEntityId: "localemail-entityId", email: "fooalias@domain" } });
  });

  it('creates 2 aliases for a single user', () => {
    expect(aliasesFileToAwsMap({ users: [{ localEmail: "localemail", aliases: ["fooalias", "fooalias2"] }] }, "domain", localUserToEntityId))
      .toStrictEqual({
        "fooalias@domain": { kind: "AwsUserAlias", userEntityId: "localemail-entityId", email: "fooalias@domain" },
        "fooalias2@domain": { kind: "AwsUserAlias", userEntityId: "localemail-entityId", email: "fooalias2@domain" }
      });
  });

})