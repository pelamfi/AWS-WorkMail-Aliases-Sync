
export function serialPromises<T, O>(promises: (() => Promise<T>)[], initial: O, combine: ((prev:O, next:T) => O)): Promise<O> {
  let initialPromise: Promise<O> = Promise.resolve<O>(initial)
  function reductionStep(a: Promise<O>, b: () => Promise<T>): Promise<O> {
    return a.then(prev => b().then(next => combine(prev, next)))
  }
  return promises.reduce(reductionStep, initialPromise)
}

