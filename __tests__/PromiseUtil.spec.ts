import { serialPromisesFlatten } from '../src/PromiseUtil';

describe('Promise utilities', () => {
  it('accepts empty list', () => {
    return serialPromisesFlatten([]).then(result => expect(result).toStrictEqual([]));
  });

  it('accepts one', () => {
    return serialPromisesFlatten([() => Promise.resolve(["foo"])]).then(result => expect(result).toStrictEqual(["foo"]));
  });

});
