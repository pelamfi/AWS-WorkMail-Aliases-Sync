import * as R from 'ramda';

export function serialPromisesReduce<T, O>(promises: (() => Promise<T>)[], initial: O, reduce: ((prev:O, next:T) => O)): Promise<O> {
  let initialPromise: Promise<O> = Promise.resolve<O>(initial)
  function reductionStep(a: Promise<O>, b: () => Promise<T>): Promise<O> {
    return a.then(prev => b().then(next => reduce(prev, next)))
  }
  return promises.reduce(reductionStep, initialPromise)
}

export function flattenRight<T>(array: [T, any[]]): T[] {
  var result = [] as T[]
  while (array !== undefined) {
    result.push(array[0] as T)
    array = array[1] as [T, any[]]
  }
  return result
}

export function serialPromises<T>(promises: (() => Promise<T>)[]): Promise<T[]> {
  // Collect in nested lists in a head growing linked list, where promise resolved last is the first element of first list.
  // This prevents N^2 behavior.
  let accumulated: Promise<any[]> = serialPromisesReduce(promises, [] as T[], (prev, next) => R.append(next, prev))
  // Flatten and reverse the list so promise resolved first is first in array.
  return accumulated.then(R.pipe(flattenRight, x => R.reverse(x))) as Promise<T[]>
}

export function serialPromisesFlatten<T>(promises: (() => Promise<T[]>)[]): Promise<T[]> {
  // Collect in nested lists in a head growing linked list, where promise resolved last is the first element of first list.
  // This prevents N^2 behavior
  let accumulated: Promise<T[]> = serialPromisesReduce(promises, [] as T[], (prev, next) => R.concat(prev, next))
  return accumulated
}
