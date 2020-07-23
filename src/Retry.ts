import { Either, isRight, left, right } from 'fp-ts/lib/Either';
export async function retry<T>(operation: () => Promise<T>, name = "An operation", timeout = 1000, times = 4): Promise<Either<unknown, T>> {
  const operationWrapped: Promise<Either<unknown, T>> = operation().then(r => right<unknown, T>(r)).catch(error => left<unknown, T>(error));

  return operationWrapped
    .then(async (result: Either<unknown, T>): Promise<Either<unknown, T>> => {
      if (times <= 0 || isRight(result)) {
        return Promise.resolve(result);
      }

      console.log(`${name} failed with: ${result}. Retrying in ${timeout}ms`);

      return new Promise(resolve => { setTimeout(() => { resolve(); }, timeout); })
        .then(() => retry(operation, name, timeout * 2, times = times - 1));
    });
}
