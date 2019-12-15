import * as AWS from 'aws-sdk'
import * as ScriptConfig from './ScriptConfig'
import * as AliasesFileParse from '../src/AliasesFileParse';
import { readFileSync } from 'fs';

console.log("Script starting, configuring AWS");

AWS.config.setPromisesDependency(null);
AWS.config.loadFromPath("./aws-sdk-config.json")
const workmail = new AWS.WorkMail({ endpoint: "https://workmail.eu-west-1.amazonaws.com" });

const scriptConfig = ScriptConfig.load()

export function aliasesFromFile(): AliasesFileParse.AliasesFile {
  console.log(`Parsing file: ${scriptConfig.aliasesFile}`)
  const result = AliasesFileParse.parse(readFileSync(scriptConfig.aliasesFile).toString())
  if (result instanceof AliasesFileParse.ParseError) {
    throw `Error parsing ${scriptConfig.aliasesFile}: ${result.error}`
  } else {
    return result
  }
}

async function main() {
  const aliases = aliasesFromFile()  
  const foo = await workmail.listUsers({ OrganizationId: scriptConfig.workmailOrganizationId }).promise()
  console.log(foo)
}

main()
