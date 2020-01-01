// https://codereview.stackexchange.com/a/202442/215881
export function filterUndef<T>(ts: (T | undefined)[]): T[] {
  return ts.filter((t: T | undefined): t is T => !!t)
}
