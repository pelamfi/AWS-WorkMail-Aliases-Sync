import { writeFileSync, readFileSync } from 'fs';
import { loadScriptConfig, configFile } from './ScriptConfig';
import { AliasesFile } from './AliasesFile';
import { getWorkmailListing } from './GetWorkmailListing';
import { parseAliasesFile, AliasesFileParseError } from './AliasesFileParse';
import { openWorkmail } from './AwsWorkMailUtil';
import { synchronize } from './Synchronize';

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

  writeFileSync('current-workmail-listing.json', 
    JSON.stringify(currentWorkmailListing, null, 2), {encoding: 'utf8'});  

  console.log('Reading the aliases file');
  const aliasesFile = aliasesFromFile();

  const aliases = aliasesFile.aliases
  
  const finalListing = await synchronize(scriptConfig, aliases, currentWorkmailListing, workmail.update);

  writeFileSync('final-listing.json', JSON.stringify(finalListing, null, 2), {encoding: 'utf8'});
}

main();

