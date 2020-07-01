import { AliasesFileAlias, AliasesFile } from './AliasesFile';
import { filterUndef } from './UndefUtil';

export class AliasesFileParseError {
  readonly error: string;

  constructor(error: string) {
    this.error = error;
  }
}

const aliasRegex = /^\s*(?!#)([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+)\s*:\s*((?:[-a-z0-9A-Z_]+(?:\s*,\s*)?)+)\s*(#.*)?$/;
const commentRegex = /^\s*#.*$/;
const lineSplitRegex = /[\r\n]+/;
const targetsSplitRegex = /\s*,\s*/;

export function parseAliasesFile(input: string): AliasesFile | AliasesFileParseError {
  const aliasesOrUndefs = filterUndef(
    input
      .split(lineSplitRegex)
      .filter((line) => line !== '')
      .map((line: string): AliasesFileAlias | AliasesFileParseError | undefined => {
        const match = line.match(aliasRegex);
        if (match == null) {
          if (line.match(commentRegex)) {
            return undefined;
          } else {
            return new AliasesFileParseError(`Unrecognized aliases file line: ${line}`);
          }
        } else {
          const [, alias, targetsPart] = match;
          const localEmails = targetsPart.split(targetsSplitRegex);
          return { alias, localEmails };
        }
      }),
  );

  const aliasesOrErrors: (AliasesFileAlias | AliasesFileParseError)[] = filterUndef(
    aliasesOrUndefs,
  );

  const errors: AliasesFileParseError[] = aliasesOrErrors.filter(
    (x: AliasesFileParseError | AliasesFileAlias) => x instanceof AliasesFileParseError,
  ) as AliasesFileParseError[];

  if (errors.length > 0) {
    return errors[0];
  } else {
    const aliases: AliasesFileAlias[] = aliasesOrErrors.filter(
      (x: AliasesFileParseError | AliasesFileAlias) => !(x instanceof AliasesFileParseError),
    ) as AliasesFileAlias[];
    return { aliases };
  }
}
