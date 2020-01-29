import * as AWS from 'aws-sdk'
import * as ScriptConfig from './ScriptConfig'
import * as AliasesFileParse from './AliasesFileParse';
import * as Alias from './AliasesFile';
import { readFileSync } from 'fs';
import { aliasesFileToEmailMap as aliasesFileToEmailMap } from './AliasesFileToAwsMap';
import { aliasesPerUser } from './AliasesFile';
import { awsMapSync as emailMapSync } from './AwsMapSync';
import { executeAwsEmailOperation } from './AwsEmailExecute';
import { serialPromises } from './PromiseUtil';
import { getWorkmailMap } from './GetWorkmailMap';
import { EmailAddr } from './EmailMap';

console.log("Script starting, configuring AWS");

AWS.config.setPromisesDependency(null);
AWS.config.loadFromPath("./aws-sdk-config.json")
let workmailService = new AWS.WorkMail({ endpoint: "https://workmail.eu-west-1.amazonaws.com" });

let scriptConfig = ScriptConfig.load()

function aliasesFromFile(): Alias.AliasesFile {
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
  console.log('Fetching the current users, groups and aliases from AWS')
  let currentWorkmailMap = await getWorkmailMap(workmail)

  console.log('Reading the aliases file')
  let aliasesFile = aliasesFromFile()
  let aliasesFileUsers = aliasesPerUser(aliasesFile.aliases)

  function localUserToEmail(localUser: string): EmailAddr | undefined {
    return new EmailAddr(scriptConfig.localEmailUserToEmail[localUser])
  }

  let targetAwsEmailMap = aliasesFileToEmailMap(aliasesFileUsers, scriptConfig.aliasesFileDomain, localUserToEmail)

  console.log(`Computing operations to sync aliases file with ${Object.keys(targetAwsEmailMap).length} aliases to WorkMail with ${Object.keys(currentWorkmailMap.emailMap.byEmail).length} aliases`)

  let syncOperations = emailMapSync(currentWorkmailMap.emailMap, targetAwsEmailMap)

  let syncOperationPromises = syncOperations.map(op => () => executeAwsEmailOperation(workmail, currentWorkmailMap.entityMap, op).promise())
  let results: any[] = await serialPromises(syncOperationPromises)

  console.log(`${results.length} operations completed`)
}

main()
