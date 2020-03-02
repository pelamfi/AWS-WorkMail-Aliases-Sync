import * as R from 'ramda';

// This file is an experiment with immutable and efficient data structures in TS.
// It could be implemented more easily if mutation was used.

// This function takes an array of functions producing promises. Each promise is executed
// only after the previous one has completed. This can be used for example to ensure that at most
// one request is in flight at a given time. A custom reduction step is used to process
// the results.
export function serialPromisesReduce<T, O>(promises: (() => Promise<T>)[], initial: O, reduce: ((prev:O, next:T) => O)): Promise<O> {
  const initialPromise: Promise<O> = Promise.resolve<O>(initial)
  function reductionStep(a: Promise<O>, b: () => Promise<T>): Promise<O> {
    return a.then(prev => b().then(next => reduce(prev, next)))
  }
  return promises.reduce(reductionStep, initialPromise)
}

// Special version of flatten that assumes the input consists of pairs
// where only the right side may contain a nested list.
export function flattenRight<T>(array:any[]|[]|[T]|[T, any[]]): T[] {
  var result = [] as T[]
  while (array !== undefined && array.length > 0) {
    result.push(array[0] as T)
    array = array[1] as [T, any[]]
  }
  return result
}

// This function takes an array of functions producing promises. Each promise is executed
// only after the previous one has completed. This can be used for example to ensure that at most
// one request is in flight at a given time. The results are catenated in an array in the corresponding
// order to the original array of functions.
export function serialPromises<T>(promises: (() => Promise<T>)[]): Promise<T[]> {
  // Collect in nested lists in a head growing linked list, where promise resolved last is the first element of first list.
  // This prevents N^2 behavior.
  const accumulated: Promise<any[]> = serialPromisesReduce(promises, [] as T[], (prev, next) => [next, prev] as any[])
  // Flatten and reverse the list so promise resolved first is first in array.
  return accumulated.then(results => {
    const flattened = flattenRight(results)
    return R.reverse(flattened)
  }) as Promise<T[]>
}

export function serialPromisesFlatten<T>(promises: (() => Promise<T[]>)[]): Promise<T[]> {
  // Collect the results in nested lists forming a head growing linked list.
  // The promise resolved last becomes the first element in the linked list.
  // This prevents N^2 behavior of creating new lists
  const accumulated: Promise<any[]> = serialPromisesReduce(promises, [] as T[], (prev, next) => [next, prev] as any[])
  return accumulated.then(R.pipe(flattenRight, x => R.reverse(x), R.flatten)) as Promise<T[]>
}
