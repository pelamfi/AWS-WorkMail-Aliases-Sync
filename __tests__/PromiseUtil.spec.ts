import { serialPromises } from '../src/PromiseUtil';

describe('Promise utilities', () => {
  it('serialPromises accepts empty list', () => {
    return serialPromises([]).then(result => expect(result).toStrictEqual([]));
  });
  
  it('serialPromises accepts one', () => {
    return serialPromises([() => Promise.resolve("foo")]).then(result => expect(result).toStrictEqual(["foo"]));
  });

});
