import { serialPromisesFlatten, flattenRight } from '../src/PromiseUtil';

describe('Promise utilities', () => {
  it('accepts empty list', () => {
    return serialPromisesFlatten([]).then(result => expect(result).toStrictEqual([]));
  });

  it('flattenRight works', () => {
    return expect(flattenRight(['a', ['b', ['c']]])).toStrictEqual(['a', 'b', 'c'])
  });

  it('accepts one', () => {
    return serialPromisesFlatten([() => Promise.resolve(["foo"])]).then(result => expect(result).toStrictEqual(["foo"]));
  });

});
