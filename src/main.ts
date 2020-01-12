import * as AWS from 'aws-sdk'
import * as ScriptConfig from './ScriptConfig'
import * as AliasesFileParse from './AliasesFileParse';
import * as Alias from './AliasesFile';
import { readFileSync } from 'fs';
import { getAwsEmailMap } from './GetAwsEmailMap'
import { aliasesFileToAwsMap } from './AliasesFileToAwsMap';
import { aliasesPerUser } from './AliasesFile';
import { awsMapSync } from './AwsMapSync';
import { executeAwsEmailOperation } from './AwsEmailExecute';
import { serialPromises } from './PromiseUtil';

console.log("Script starting, configuring AWS");

AWS.config.setPromisesDependency(null);
AWS.config.loadFromPath("./aws-sdk-config.json")
let workmailService = new AWS.WorkMail({ endpoint: "https://workmail.eu-west-1.amazonaws.com" });

let scriptConfig = ScriptConfig.load()

function aliasesFromFile(): Alias.AliasesFile {
  console.log(`Parsing file: ${scriptConfig.aliasesFile}`)
  let result = AliasesFileParse.parse(readFileSync(scriptConfig.aliasesFile).toString())
  if (result instanceof AliasesFileParse.ParseError) {
    throw `Error parsing ${scriptConfig.aliasesFile}: ${result.error}`
  } else {
    return result
  }
}

async function main() {
  console.log(`Syncing users and aliases from with AWS WorkMail:\n` + 
    `  Using configuration file: ${ScriptConfig.configFile}\n` +
    `  WorkMail organizationId: ${scriptConfig.workmailOrganizationId}\n` +
    `  aliases file to sync with: ${scriptConfig.aliasesFile}\n` +
    `  domain: ${scriptConfig.aliasesFileDomain}`)

  let workmail = {service: workmailService, organizationId: scriptConfig.workmailOrganizationId}
  let currentAwsEmailMap = await getAwsEmailMap(workmail)
  let aliasesFile = aliasesFromFile()
  let aliasesFileUsers = aliasesPerUser(aliasesFile.aliases)
  let targetAwsEmailMap = aliasesFileToAwsMap(aliasesFileUsers, scriptConfig.aliasesFileDomain, x => scriptConfig.emailToLocalEmail[x])
  let syncOperations = awsMapSync(currentAwsEmailMap.byEmail, targetAwsEmailMap)
  let syncOperationPromises = syncOperations.map(op => () => executeAwsEmailOperation(workmail, currentAwsEmailMap.byEntityId, op).promise())
  let results: any[] = await serialPromises(syncOperationPromises)
  console.log(`${results.length} operations completed`)
}

main()
