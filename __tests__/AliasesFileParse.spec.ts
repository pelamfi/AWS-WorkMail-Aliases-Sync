import { parse, ParseError } from '../src/AliasesFileParse';

describe('Parsing aliases file', () => {
  it('accepts empty file', () => {
    expect(parse("")).toStrictEqual({ aliases: [] });
  });

  it('accepts single alias', () => {
    expect(parse("foo: bar")).toStrictEqual({ aliases: [{ localEmail: "foo", targets: ["bar"] }] });
  });

  it('skips comments and empty lines', () => {
    expect(parse("#comment\nfoo: bar\n\n")).toStrictEqual({ aliases: [{ localEmail: "foo", targets: ["bar"] }] });
  });

  it('detects error', () => {
    expect(parse("\nunknown stuff!!!\nfoo: bar\n\n")).toStrictEqual(new ParseError("Unrecognized aliases file line: unknown stuff!!!"));
  });

  it('parses multiple targets', () => {
    expect(parse("foo: bar,baz")).toStrictEqual({ aliases: [{ localEmail: "foo", targets: ["bar", "baz"] }] });
  });
});
