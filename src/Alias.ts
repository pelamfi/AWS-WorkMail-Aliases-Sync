export interface AliasesUser {
  localEmail: string // the name of the the alias, no domain part
  aliases: string[]
}

export interface Alias {
  localEmail: string // the name of the the alias, no domain part
  targets: string[] // name(s) of local users that this localEmail is alias of
}

export interface AliasesFile {
  aliases: Alias[]
}

