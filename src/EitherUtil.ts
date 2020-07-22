import { Either, getOrElse } from 'fp-ts/lib/Either';
export function eitherThrow<L, R>(either: Either<L, R>): R {
  return getOrElse<L, R>(error => { throw error; })(either);
}
