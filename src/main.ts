import * as AWS from 'aws-sdk'
import * as ScriptConfig from './ScriptConfig'
import * as AliasesFileParse from './AliasesFileParse';
import * as Alias from './AliasesFile';
import { readFileSync } from 'fs';
import { aliasesFileToEmailMap as aliasesFileToEmailMap } from './AliasesFileToAwsMap';
import { aliasesPerUser } from './AliasesFile';
import { awsMapSync as emailMapSync } from './AwsMapSync';
import { createAwsWorkmailRequest } from './WorkmailRequest';
import { serialPromises } from './PromiseUtil';
import { getWorkmailMap } from './GetWorkmailMap';
import { EmailAddr } from "./EmailAddr";
import { aliasLimitWorkaround } from './AliasLimitWorkaround';

console.log("Script starting, configuring AWS");

AWS.config.setPromisesDependency(null);
AWS.config.loadFromPath("./aws-sdk-config.json")
const workmailService = new AWS.WorkMail({ endpoint: "https://workmail.eu-west-1.amazonaws.com" });

const scriptConfig = ScriptConfig.load()

function aliasesFromFile(): Alias.AliasesFile {
  const result = AliasesFileParse.parse(readFileSync(scriptConfig.aliasesFile).toString())
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

  const workmail = {service: workmailService, organizationId: scriptConfig.workmailOrganizationId}
  console.log('Fetching the current users, groups and aliases from AWS')
  const currentWorkmailMap = await getWorkmailMap(workmail)

  console.log('Reading the aliases file')
  const aliasesFile = aliasesFromFile()
  const aliasesFileUsers = aliasesPerUser(aliasesFile.aliases)

  function localUserToEmail(localUser: string): EmailAddr | undefined {
    const localEmail = scriptConfig.localEmailUserToEmail[localUser]
    if (localEmail === undefined) {
      return undefined
    }
    return new EmailAddr(localEmail)
  }

  const targetAwsEmailMapIdeal = aliasesFileToEmailMap(aliasesFileUsers, scriptConfig.aliasesFileDomain, localUserToEmail)
  const targetAwsEmailMap = aliasLimitWorkaround(targetAwsEmailMapIdeal)

  console.log(`Computing operations to sync aliases file with ${Object.keys(targetAwsEmailMap).length} aliases to WorkMail with ${Object.keys(currentWorkmailMap.emailMap).length} aliases`)

  const syncOperations = emailMapSync(currentWorkmailMap.emailMap, targetAwsEmailMap)

  const syncOperationPromises = syncOperations.map(op => () => createAwsWorkmailRequest(workmail, currentWorkmailMap.entityMap, op).promise())
  const results: any[] = await serialPromises(syncOperationPromises)

  console.log(`${results.length} operations completed`)
}

main()
