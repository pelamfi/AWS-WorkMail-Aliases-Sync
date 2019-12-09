
export interface Alias {
}

export interface AliasesFile {
  aliases: Alias[]
}

export function parse(input: string): AliasesFile {
    console.log(input)
    return {aliases:[]}
}