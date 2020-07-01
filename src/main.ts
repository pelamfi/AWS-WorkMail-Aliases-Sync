import { writeFileSync, readFileSync } from 'fs';
import { aliasesFileToEmailMap } from './AliasesFileToEmaiMap';
import { loadScriptConfig, configFile } from './ScriptConfig';
import { aliasesPerUser, AliasesFile } from './AliasesFile';
import { emailMapSync } from './EmailMapSync';
import { createAwsWorkmailRequest } from './WorkmailRequest';
import { getWorkmailListing } from './GetWorkmailListing';
import { Email } from './Email';
import { emailMapAliasLimitWorkaround } from './AliasLimitWorkaround';
import { EntityMap, WorkmailMap, workmailMapFromListing } from './WorkmailMap';
import { EmailOperation } from './EmailOperation';
import { parseAliasesFile, AliasesFileParseError } from './AliasesFileParse';
import { openWorkmail } from './AwsWorkMailUtil';

console.log('Script starting');

const scriptConfig = loadScriptConfig();

function aliasesFromFile(): AliasesFile {
  const result = parseAliasesFile(
    readFileSync(scriptConfig.aliasesFile).toString(),
  );
  if (result instanceof AliasesFileParseError) {
    throw `Error parsing ${scriptConfig.aliasesFile}: ${result.error}`;
  } else {
    return result;
  }
}

async function main() {
  console.log(
    `Syncing users and aliases from with AWS WorkMail:\n` +
    `  Using configuration file: ${configFile}\n` +
    `  AWS config file: ${scriptConfig.awsConfigFile}\n` +
    `  WorkMail endpoint: ${scriptConfig.workmailEndpoint}\n` +
    `  WorkMail organizationId: ${scriptConfig.workmailOrganizationId}\n` +
    `  aliases file to sync with: ${scriptConfig.aliasesFile}\n` +
    `  domain: ${scriptConfig.aliasesFileDomain}\n` + 
    `  aliases per user/group limit: ${scriptConfig.aliasLimit}`,
  );

  const workmail = openWorkmail(scriptConfig);

  console.log('Fetching the current users, groups and aliases from AWS');
  const currentWorkmailListing = await getWorkmailListing(workmail, scriptConfig);
  const currentWorkmailMap = await workmailMapFromListing(currentWorkmailListing);

  writeFileSync('current-workmail-listing.json', 
    JSON.stringify(currentWorkmailListing, null, 2), {encoding: 'utf8'});  

  console.log('Reading the aliases file');
  const aliasesFile = aliasesFromFile();
  const aliasesFileUsers = aliasesPerUser(aliasesFile.aliases);

  function localUserToEmail(localUser: string): Email | undefined {
    const localEmail = scriptConfig.localEmailUserToEmail[localUser];
    if (localEmail === undefined) {
      return undefined;
    }
    return new Email(localEmail);
  }

  const targetAwsEmailMapIdeal = aliasesFileToEmailMap(aliasesFileUsers, {
    ...scriptConfig,
    localUserToEmail,
  });

  const targetAwsEmailMap = emailMapAliasLimitWorkaround(
    targetAwsEmailMapIdeal,
    scriptConfig,
  );

  writeFileSync('target-map.json', JSON.stringify(targetAwsEmailMap, null, 2), {encoding: 'utf8'});

  console.log(
    `Computing operations to sync aliases file with ${
      Object.keys(targetAwsEmailMap).length
    } aliases to WorkMail with ${
      Object.keys(currentWorkmailMap.emailMap).length
    } aliases`,
  );

  const syncOperations = emailMapSync(
    currentWorkmailMap.emailMap,
    targetAwsEmailMap,
  );

  const initialPromise: Promise<EntityMap> = Promise.resolve<EntityMap>(
    currentWorkmailMap.entityMap,
  );

  function reductionStep(
    prev: Promise<EntityMap>,
    op: EmailOperation,
  ): Promise<EntityMap> {
    return prev.then((entityMap) => {
      return createAwsWorkmailRequest(workmail, entityMap, op).then(
        (entityMapUpdate) => {
          return entityMapUpdate(entityMap);
        },
      );
    });
  }

  console.log(`Executing ${syncOperations.length} operations to synchronize AWS WorkMail aliases.`)
  
  const finalEntityMap = await syncOperations.reduce(
    reductionStep,
    initialPromise,
  );

  const finalMap: WorkmailMap = {
    entityMap: finalEntityMap,
    emailMap: targetAwsEmailMap,
  };
  
  writeFileSync('final-map.json', JSON.stringify(finalMap, null, 2), {encoding: 'utf8'});

  console.log(
    `${syncOperations.length} operations completed, entityIds: ${
      Object.keys(finalMap.entityMap.byId).length
    }`,
  );
}

main();
