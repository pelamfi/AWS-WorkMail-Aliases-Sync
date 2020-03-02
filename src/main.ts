import * as AWS from 'aws-sdk'
import * as ScriptConfig from './ScriptConfig'
import * as AliasesFileParse from './AliasesFileParse';
import * as Alias from './AliasesFile';
import { readFileSync } from 'fs';
import { aliasesFileToEmailMap as aliasesFileToEmailMap } from './AliasesFileToAwsMap';
import { aliasesPerUser } from './AliasesFile';
import { awsMapSync as emailMapSync } from './AwsMapSync';
import { createAwsWorkmailRequest } from './WorkmailRequest';
import { getWorkmailMap } from './GetWorkmailMap';
import { EmailAddr } from "./EmailAddr";
import { emailMapAliasLimitWorkaround } from './AliasLimitWorkaround';
import { EntityMap, WorkmailMap } from './WorkmailMap';
import { EmailOperation } from './EmailOperation';

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
  const currentWorkmailMap = await getWorkmailMap(workmail, scriptConfig)

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

  const targetAwsEmailMapIdeal = aliasesFileToEmailMap(aliasesFileUsers, {...scriptConfig, localUserToEmail})
  const targetAwsEmailMap = emailMapAliasLimitWorkaround(targetAwsEmailMapIdeal, scriptConfig)

  console.log(`Computing operations to sync aliases file with ${Object.keys(targetAwsEmailMap).length} aliases to WorkMail with ${Object.keys(currentWorkmailMap.emailMap).length} aliases`)

  const syncOperations = emailMapSync(currentWorkmailMap.emailMap, targetAwsEmailMap)

  const initialPromise: Promise<EntityMap> = Promise.resolve<EntityMap>(currentWorkmailMap.entityMap)

  function reductionStep(prev: Promise<EntityMap>, op: EmailOperation): Promise<EntityMap> {
    return prev.then(entityMap => {
      return createAwsWorkmailRequest(workmail, entityMap, op)
        .then( entityMapUpdate => {
          return entityMapUpdate(entityMap)
        })
    })
  }

  let finalEntityMap = await syncOperations.reduce(reductionStep, initialPromise)

  let finalMap: WorkmailMap = {entityMap: finalEntityMap, emailMap: targetAwsEmailMap}

  console.log(`${syncOperations.length} operations completed, entityIds: ${Object.keys(finalMap.entityMap.byId).length}`)
}

main()
