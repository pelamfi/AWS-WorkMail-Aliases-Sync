import {Alias, AliasesFile} from '../src/Alias'

export class ParseError {
  error: string

  constructor(error: string) {
    this.error = error;
  }
}

const aliasRegex = /^\s*([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+)\s*:\s*([-a-z0-9A-Z_,\s]+)\s*(#.*)?$/
const commentRegex = /^\s*#.*$/
const lineSplitRegex = /[\r\n]+/
const targetsSplitRegex = /\s*,\s*/

export function parse(input: string): AliasesFile | ParseError {
  
  const aliasesOrErrors: (Alias|ParseError)[] = input
    .split(lineSplitRegex)
    .filter(line => line !== "")
    .map((line: string): Alias|ParseError => {
      let match = line.match(aliasRegex)
      if (match == null) {
        if (line.match(commentRegex)) {
          return null
        } else {
          return new ParseError(`Unrecognized aliases file line: ${line}`)
        }
      } else {
        const [, alias, targetsPart] = match
        const localEmails = targetsPart.split(targetsSplitRegex)
        return { alias, localEmails }
      }
    })
    .filter(x => x != null)
  
  const errors: ParseError[] = aliasesOrErrors.filter((x: ParseError|Alias) => x instanceof(ParseError)) as ParseError[]
  
  if (errors.length > 0) {
    return errors[0]
  } else {
    const aliases: Alias[] = aliasesOrErrors.filter((x: ParseError|Alias) => !(x instanceof(ParseError))) as Alias[]
    return {aliases}
  }
}
