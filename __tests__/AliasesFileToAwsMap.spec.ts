import { aliasesFileToAwsMap } from '../src/AliasesFileToAwsMap';

describe('Creating AwsEmailMap', () => {
  it('accepts empty data', () => {
    expect(aliasesFileToAwsMap({users: []}, "domain", () => "")).toStrictEqual({ });
  });
})