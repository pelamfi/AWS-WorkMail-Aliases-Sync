import { aliasesFileToAwsMap } from '../src/AliasesFileToAwsMap';

describe('Creating AwsEmailMap', () => {
  it('accepts empty data', () => {
    expect(aliasesFileToAwsMap({ users: [] }, "domain", () => "")).toStrictEqual({});
  });
  it('creates a single alias', () => {
    expect(aliasesFileToAwsMap({ users: [{ localEmail: "localemail", aliases: ["fooalias"] }] }, "domain", () => "entityid"))
      .toStrictEqual({ "fooalias@domain": { kind: "AwsUserAlias", userEntityId: "entityid", email: "fooalias@domain" } });
  });
})