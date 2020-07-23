import { loadAliasesUserEmails, loadScriptConfiguration } from './ScriptConfig';
import { AliasesFile } from './AliasesFile';
import { getWorkmailListing, GetWorkmailListingConfig } from './GetWorkmailListing';
import { parseAliasesFile, AliasesFileParseError } from './AliasesFileParse';
import { openWorkmail, Workmail } from './AwsWorkMailUtil';
import { synchronize } from './Synchronize';
import { WorkmailListing, sortedWorkmailListing } from './WorkmailMap';
import { writeFileAtomic, readFile, exists } from './FsUtil';

async function main() {

  const scriptConfig = await loadScriptConfiguration();

  if (scriptConfig.verbose) {
    console.log(
      `Syncing users and aliases from with AWS WorkMail:\n` +
        `  AWS config file: ${scriptConfig.awsConfigFile}\n` +
        `  WorkMail endpoint: ${scriptConfig.workmailEndpoint}\n` +
        `  WorkMail organizationId: ${scriptConfig.workmailOrganizationId}\n` +
        `  aliases file to sync with: ${scriptConfig.aliasesFile}\n` +
        `  domain: ${scriptConfig.aliasesFileDomain}\n` +
        `  aliases per user/group limit: ${scriptConfig.aliasLimit}`,
    );
  }

  const localEmailUserToEmail = await loadAliasesUserEmails(scriptConfig.aliasesUserEmails)

  const workmail = openWorkmail(scriptConfig);

  const currentWorkmailListing: WorkmailListing = await getCurrentWorkmailListing(scriptConfig.stateFile, scriptConfig, workmail);

  if (scriptConfig.verbose) {
    console.log('Reading the aliases file');
  }

  const aliasesFile = await aliasesFromFile(scriptConfig.aliasesFile);

  const aliases = aliasesFile.aliases

  const finalListing = await synchronize({...scriptConfig, localEmailUserToEmail}, aliases, currentWorkmailListing, workmail.update);

  saveCurrentWorkmailListing(scriptConfig.stateFile, scriptConfig.verbose, finalListing);
}

async function aliasesFromFile(aliasesFile: string): Promise<AliasesFile> {
  const data = await readFile(aliasesFile, 'utf8');
  const result = parseAliasesFile(data)

  if (result instanceof AliasesFileParseError) {
    throw `Error parsing ${aliasesFile}: ${result.error}`;
  } else {
    return result;
  }
}

async function getCurrentWorkmailListing(stateFile: string, config: GetWorkmailListingConfig, workmail: Workmail): Promise<WorkmailListing> {
  if (await exists(stateFile)) {
    if (config.verbose) {
      console.log(`Loading previous ${stateFile} instead of querying AWS WorkMail`);
    }

    const data = await readFile(stateFile, 'utf8');
    // tslint:disable-next-line: no-suspicious-comment
    // TODO: Actual validation...
    return sortedWorkmailListing(JSON.parse(data.toString()) as WorkmailListing);
  } else {
    if (config.verbose) {
      console.log('Fetching the current users, groups and aliases from AWS');
    }

    const currentWorkmailListing = await getWorkmailListing(workmail, config);

    saveCurrentWorkmailListing(stateFile, config.verbose, currentWorkmailListing);

    return currentWorkmailListing;
  }
}

async function saveCurrentWorkmailListing(stateFile: string, verbose: boolean, currentWorkmailListing: WorkmailListing) {
  const serialized = JSON.stringify(currentWorkmailListing, null, 2);
  if (verbose) {
    console.log(`Writing to ${stateFile}`);
  }

  writeFileAtomic(stateFile, serialized, {encoding: 'utf8'});
}

main();

