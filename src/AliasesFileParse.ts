import {AliasesFileAlias, AliasesFile} from './AliasesFile'
import {filterUndef} from './UndefUtil'

export class ParseError {
  error: string

  constructor(error: string) {
    this.error = error;
  }
}

const aliasRegex = /^\s*(?!#)([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+)\s*:\s*((?:[-a-z0-9A-Z_]+(?:\s*,\s*)?)+)\s*(#.*)?$/
const commentRegex = /^\s*#.*$/
const lineSplitRegex = /[\r\n]+/
const targetsSplitRegex = /\s*,\s*/


export function parse(input: string): AliasesFile | ParseError {
  
  const aliasesOrUndefs = filterUndef(input
  .split(lineSplitRegex)
  .filter(line => line !== "")
  .map((line: string): AliasesFileAlias|ParseError|undefined => {
    const match = line.match(aliasRegex)
    if (match == null) {
      if (line.match(commentRegex)) {
        return undefined
      } else {
        return new ParseError(`Unrecognized aliases file line: ${line}`)
      }
    } else {
      const [, alias, targetsPart] = match
      const localEmails = targetsPart.split(targetsSplitRegex)
      return { alias, localEmails }
    }
  }))


  const aliasesOrErrors: (AliasesFileAlias|ParseError)[] = filterUndef(aliasesOrUndefs)
  
  const errors: ParseError[] = aliasesOrErrors.filter((x: ParseError|AliasesFileAlias) => x instanceof(ParseError)) as ParseError[]
  
  if (errors.length > 0) {
    return errors[0]
  } else {
    const aliases: AliasesFileAlias[] = aliasesOrErrors.filter((x: ParseError|AliasesFileAlias) => !(x instanceof(ParseError))) as AliasesFileAlias[]
    return {aliases}
  }
}
