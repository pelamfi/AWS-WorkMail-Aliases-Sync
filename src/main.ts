import { loadScriptConfig, configFile, Config } from './ScriptConfig';
import { AliasesFile } from './AliasesFile';
import { getWorkmailListing } from './GetWorkmailListing';
import { parseAliasesFile, AliasesFileParseError } from './AliasesFileParse';
import { openWorkmail, Workmail } from './AwsWorkMailUtil';
import { synchronize } from './Synchronize';
import { WorkmailListing, sortedWorkmailListing } from './WorkmailMap';
import { writeFileAtomic, readFile, exists } from './FsUtil';

console.log('Script starting');

async function main() {
  const scriptConfig = await loadScriptConfig();
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

  const currentWorkmailListing: WorkmailListing = await getCurrentWorkmailListing(scriptConfig, workmail);

  console.log('Reading the aliases file');
  const aliasesFile = await aliasesFromFile(scriptConfig);

  const aliases = aliasesFile.aliases

  const finalListing = await synchronize(scriptConfig, aliases, currentWorkmailListing, workmail.update);

  saveCurrentWorkmailListing(scriptConfig, finalListing);
}

async function aliasesFromFile(scriptConfig: Config): Promise<AliasesFile> {
  const data = await readFile(scriptConfig.aliasesFile, 'utf8');
  const result = parseAliasesFile(data)

  if (result instanceof AliasesFileParseError) {
    throw `Error parsing ${scriptConfig.aliasesFile}: ${result.error}`;
  } else {
    return result;
  }
}

async function getCurrentWorkmailListing(scriptConfig: Config, workmail: Workmail): Promise<WorkmailListing> {
  if (await exists(scriptConfig.stateFile)) {
    console.log(`Loading previous ${scriptConfig.stateFile} instead of querying AWS WorkMail`);
    const data = await readFile(scriptConfig.stateFile, 'utf8');
    // tslint:disable-next-line: no-suspicious-comment
    // TODO: Actual validation...
    return sortedWorkmailListing(JSON.parse(data.toString()) as WorkmailListing);
  } else {
    console.log('Fetching the current users, groups and aliases from AWS');
    const currentWorkmailListing = await getWorkmailListing(workmail, scriptConfig);

    saveCurrentWorkmailListing(scriptConfig, currentWorkmailListing);

    return currentWorkmailListing;
  }
}

async function saveCurrentWorkmailListing(scriptConfig: Config, currentWorkmailListing: WorkmailListing) {
  const serialized = JSON.stringify(currentWorkmailListing, null, 2);
  console.log(`Writing to ${scriptConfig.stateFile}`);
  writeFileAtomic(scriptConfig.stateFile, serialized, {encoding: 'utf8'});
}


main();

