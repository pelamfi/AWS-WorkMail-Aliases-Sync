import {parse} from '../src/AliasesFileParse';

describe('Parsing aliases file', () => {
  it('accepts empty file', () => {
    expect(parse("")).toStrictEqual({aliases:[]});
  });
});
