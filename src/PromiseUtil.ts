// This function takes an array of functions producing promises. Each function is called
// only after the previous promise has completed. This can be used for example to ensure that at most
// one request is in flight at a given time. The results are catenated in an array in the corresponding
// order to the original array of functions.
export async function serialPromises<T>(
  promiseProducers: (() => Promise<T>)[],
): Promise<T[]> {
  const results: T[] = [];
  for (const promiseProducer of promiseProducers) {
    const promise = promiseProducer();
    const result: T = await promise;
    results.push(result);
  }
  return results;
}
