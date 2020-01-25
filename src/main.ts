import * as AWS from 'aws-sdk'
import * as ScriptConfig from './ScriptConfig'
import * as AliasesFileParse from './AliasesFileParse';
import * as Alias from './AliasesFile';
import { readFileSync } from 'fs';
import { getWorkmailMap } from './GetWorkmailMap'
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

  function localUserToEntityId(localUser: string): AWS.WorkMail.WorkMailIdentifier|undefined {
    let localEmail = scriptConfig.localEmailUserToEmail[localUser]
    if (localEmail === undefined) {
      return undefined
    }
    let entity = currentWorkmailMap.byEmail[localEmail]
    switch (entity?.kind) {
      case "WorkmailUserDefault":
        return entity.userEntityId
      default:
    }
    throw `Local email user ${localUser} and its defined email address ${localEmail} is not the default email of any current Aws Workmail user.`
  }

  let targetAwsEmailMap = aliasesFileToAwsMap(aliasesFileUsers, scriptConfig.aliasesFileDomain, localUserToEntityId)

  console.log(`Computing operations to sync aliases file with ${Object.keys(targetAwsEmailMap).length} aliases to WorkMail with ${Object.keys(currentWorkmailMap.byEmail).length} aliases`)

  let syncOperations = awsMapSync(currentWorkmailMap.byEmail, targetAwsEmailMap)
  let syncOperationPromises = syncOperations.map(op => () => executeAwsEmailOperation(workmail, currentWorkmailMap.byEntityId, op).promise())
  let results: any[] = await serialPromises(syncOperationPromises)
  console.log(`${results.length} operations completed`)
}

main()
