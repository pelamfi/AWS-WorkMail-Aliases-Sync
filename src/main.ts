import { defaultConfigFile, defaultAliasesUserEmails, loadAliasesUserEmails } from './ScriptConfig';
import { AliasesFile } from './AliasesFile';
import { getWorkmailListing } from './GetWorkmailListing';
import { parseAliasesFile, AliasesFileParseError } from './AliasesFileParse';
import { openWorkmail, Workmail } from './AwsWorkMailUtil';
import { synchronize } from './Synchronize';
import { WorkmailListing, sortedWorkmailListing } from './WorkmailMap';
import { writeFileAtomic, readFile, exists } from './FsUtil';
import { GroupNameConfig } from './GroupNameUtil';

console.log('Script starting');

async function checkDefaultConfigFile() {
  if (!process.argv.includes("--config") && !process.argv.includes("--help") && !process.argv.includes("--version"))  {
    console.log(`Loading default config file ${defaultConfigFile}`);
    const data = await readFile(defaultConfigFile);
    return JSON.parse(data.toString());
  }

  return {};
}

async function main() {

  const defaultConfigFileContents = await checkDefaultConfigFile();

  // https://stackoverflow.com/a/45077802/1148030
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const scriptConfig = require('yargs')
    .config(defaultConfigFileContents)
    .config('config', `The location of the script configuration file. The default location is ${defaultConfigFile}.`)
    .option('awsConfigFile', {
      type: 'string',
      normalize: true,
      default: './aws-sdk-config.json',
      description: "The location of the file with AWS credentials. See the aws-sdk-config-sample.json to get the idea.",
    })
    .option('workmailEndpoint', {
      type: 'string',
      description: "Override AWS WorkMail geographical location. For example 'https://workmail.eu-west-1.amazonaws.com'",
    })
    .option('workmailOrganizationId', {
      type: 'string',
      description: "The ID of your WorkMail organization. Something like 'm-f31c1261be2a4629a0a18a12da03a7f1'",
      demand: true
    })
    .option('aliases-file', {
      type: 'string',
      normalize: true,
      description: "The location of a UNIX style (simple) aliases file to be synchronized into WorkMail groups and aliases.",
      default: "aliases"
    })
    .option('groupPrefix', {
      type: 'string',
      description: `A unique string that you must specify to ensure spammers
      can't quess the names of the groups generated by this script.
      For example 'gen98422' but your own numbers.`,
      demand: true
    })
    .option('aliasesFileDomain', {
      type: 'string',
      description: `The domain under which the names in your aliases file should be understood to exists. For example: 'example.org'.`,
      demand: true
    })
    .option('aliasesUserEmails', {
      type: 'string',
      normalize: true,
      description: `A file mapping users in your aliases file to emails of users in your AWS WorkMail. Users not found in this file are ignored.`,
      default: defaultAliasesUserEmails
    })
    .option('aliasLimit', {
      type: 'number',
      description: `WorkMail has a limit of 100 aliases per entity (user/group). This controls how close to the limit we must be for the work-around (creates intermediate groups) to kick in.`,
      default: 80,
    })
    .option('stateFile', {
      type: 'string',
      normalize: true,
      description: `To speed up the script, the last known state of the AWS WorkMail is kept in this file.`,
      default: 'workmail-state.json',
    })
    .option('forceQuery', {
      alias: 'q',
      normalize: true,
      type: 'boolean',
      description: "Force reading a fresh state from AWS WorkMail instead of using previous state json. If the stateFile does no longer hold true, this can be used to force a refresh.",
      demand: false,
      default: false,
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      default: false,
      description: "Enable logging",
      demand: false
    })
    .option('dry-run', {
      alias: 'n',
      type: 'boolean',
      default: false,
      description: "Dry run, don't run updates on AWS WorkMail.",
      demand: false
    })
    .epilog(`This script is experimental! There is no warranty. Please use with care and at your own risk.
    Please see GNU-AGPL-3-0-LICENSE for the exact legal statement.

    Ideally the command line options should be placed in aliases-sync-config.json instead to
    make it easy to rerun this script. See aliases-sync-config-sample.json for an ex

    Running the script again causes the changes in your aliases file be synced to AWS WorkMail.
    The idea is to provide an alternative way to manage your AWS WorkMail aliases and groups.

    Of course you could also run it just once to upload a legacy aliases file.
    `)
    .argv;

  console.log(JSON.stringify(scriptConfig));

  console.log(
    `Syncing users and aliases from with AWS WorkMail:\n` +
    `  AWS config file: ${scriptConfig.awsConfigFile}\n` +
    `  WorkMail endpoint: ${scriptConfig.workmailEndpoint}\n` +
    `  WorkMail organizationId: ${scriptConfig.workmailOrganizationId}\n` +
    `  aliases file to sync with: ${scriptConfig.aliasesFile}\n` +
    `  domain: ${scriptConfig.aliasesFileDomain}\n` +
    `  aliases per user/group limit: ${scriptConfig.aliasLimit}`,
  );

  const localEmailUserToEmail = await loadAliasesUserEmails(scriptConfig.aliasesUserEmails)

  const workmail = openWorkmail(scriptConfig);

  const currentWorkmailListing: WorkmailListing = await getCurrentWorkmailListing(scriptConfig.stateFile, scriptConfig, workmail);

  console.log('Reading the aliases file');
  const aliasesFile = await aliasesFromFile(scriptConfig.aliasesFile);

  const aliases = aliasesFile.aliases

  const finalListing = await synchronize({...scriptConfig, localEmailUserToEmail}, aliases, currentWorkmailListing, workmail.update);

  saveCurrentWorkmailListing(scriptConfig.stateFile, finalListing);
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

async function getCurrentWorkmailListing(stateFile: string, groupNameConfig: GroupNameConfig, workmail: Workmail): Promise<WorkmailListing> {
  if (await exists(stateFile)) {
    console.log(`Loading previous ${stateFile} instead of querying AWS WorkMail`);
    const data = await readFile(stateFile, 'utf8');
    // tslint:disable-next-line: no-suspicious-comment
    // TODO: Actual validation...
    return sortedWorkmailListing(JSON.parse(data.toString()) as WorkmailListing);
  } else {
    console.log('Fetching the current users, groups and aliases from AWS');
    const currentWorkmailListing = await getWorkmailListing(workmail, groupNameConfig);

    saveCurrentWorkmailListing(stateFile, currentWorkmailListing);

    return currentWorkmailListing;
  }
}

async function saveCurrentWorkmailListing(stateFile: string, currentWorkmailListing: WorkmailListing) {
  const serialized = JSON.stringify(currentWorkmailListing, null, 2);
  console.log(`Writing to ${stateFile}`);
  writeFileAtomic(stateFile, serialized, {encoding: 'utf8'});
}

main();

