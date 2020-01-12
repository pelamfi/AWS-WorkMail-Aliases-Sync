// https://codereview.stackexchange.com/a/202442/215881
export function filterUndef<T>(ts: (T | undefined)[]): T[] {
  return ts.filter((t: T | undefined): t is T => !!t)
}

// There isn't a ready made function like this? Probably is, but I can't find it
export function mapUndef<T, U>(f: (value: T) => U, x: T | undefined): U | undefined {
  if (x === undefined) {
    return undefined
  } else {
    return f(x)
  }
}
