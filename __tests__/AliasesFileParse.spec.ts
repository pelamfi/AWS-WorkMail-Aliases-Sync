import { parseAliasesFile, AliasesFileParseError } from '../src/AliasesFileParse';

describe('Parsing aliases file', () => {
  it('accepts empty file', () => {
    expect(parseAliasesFile('')).toStrictEqual({ aliases: [] });
  });

  it('accepts single alias', () => {
    expect(parseAliasesFile('foo: bar')).toStrictEqual({
      aliases: [{ alias: 'foo', localEmails: ['bar'] }],
    });
  });

  it('skips comments and empty lines', () => {
    expect(parseAliasesFile('#comment\nfoo: bar\n\n')).toStrictEqual({
      aliases: [{ alias: 'foo', localEmails: ['bar'] }],
    });
  });

  it('detects error', () => {
    expect(parseAliasesFile('\nunknown stuff!!!\nfoo: bar\n\n')).toStrictEqual(
      new AliasesFileParseError('Unrecognized aliases file line: unknown stuff!!!'),
    );
  });

  it('parses multiple targets', () => {
    expect(parseAliasesFile('foo: bar,baz')).toStrictEqual({
      aliases: [{ alias: 'foo', localEmails: ['bar', 'baz'] }],
    });
  });

  it('skips comments at end of line', () => {
    expect(parseAliasesFile('foo: bar,baz#comment')).toStrictEqual({
      aliases: [{ alias: 'foo', localEmails: ['bar', 'baz'] }],
    });
  });

  it('skips comments and whitespace at end of line', () => {
    expect(parseAliasesFile('foo: bar,baz #comment')).toStrictEqual({
      aliases: [{ alias: 'foo', localEmails: ['bar', 'baz'] }],
    });
  });

  it('skips comments that look like aliases', () => {
    expect(parseAliasesFile('foo: bar,baz\n#a: b')).toStrictEqual({
      aliases: [{ alias: 'foo', localEmails: ['bar', 'baz'] }],
    });
  });
});
