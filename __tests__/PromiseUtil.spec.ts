import { serialPromisesFlatten, flattenRight } from '../src/PromiseUtil';
import * as R from 'ramda';

describe('Promise utilities', () => {
  it('accepts empty list', () => {
    return serialPromisesFlatten([]).then(result => expect(result).toStrictEqual([]));
  });

  it('flattenRight flattens 3 levels', () => {
    return expect(flattenRight(['a', ['b', ['c']]])).toStrictEqual(['a', 'b', 'c'])
  });

  it('flattenRight accepts empty list', () => {
    return expect(flattenRight([])).toStrictEqual([])
  });

  it('flattenRight accepts list of 1', () => {
    return expect(flattenRight(["foo"])).toStrictEqual(["foo"])
  });

  it('flattenRight accepts list of 1 + empty', () => {
    return expect(flattenRight(["foo", []])).toStrictEqual(["foo"])
  });

  it('flattenRight accepts a large tree', () => {
    let array: number[] = Array(100000).map((_, i) => i)
    let tree = R.reduce((prev, x) => [x, prev], [], array) as any[]
    return expect(flattenRight(tree).length).toStrictEqual(array.length)
  });

  it('accepts one', () => {
    return serialPromisesFlatten([() => Promise.resolve(["foo"])]).then(result => expect(result).toStrictEqual(["foo"]));
  });

});
