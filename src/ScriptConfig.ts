import { readFile } from './FsUtil';
import { Email } from './Email';
import yargs from 'yargs';

export interface Config {
  readonly awsConfigFile: string;
  readonly workmailEndpoint?: string;
  readonly workmailOrganizationId: string;
  readonly groupPrefix: string;
  readonly aliasesFile: string;
  readonly aliasesFileDomain: string;
  readonly aliasLimit: number;
  readonly stateFile: string;
  readonly dryRun: boolean;
  readonly verbose: boolean;
  readonly aliasesUserEmails: string;
}

export interface AliasesUserEmails {
  readonly [index: string]: Email;
}

export const defaultConfigFile = './aliases-sync-config.json';

export const defaultAliasesUserEmails = './aliases-user-emails.json';

export async function loadAliasesUserEmails(
  file: string = defaultAliasesUserEmails,
): Promise<AliasesUserEmails> {
  console.log(`Loading ${file}`);
  const data = await readFile(file);
  // tslint:disable-next-line: no-suspicious-comment
  // TODO: Actual validation...
  return JSON.parse(data.toString()) as AliasesUserEmails;
}

export async function loadScriptConfiguration(): Promise<Config> {
  const defaultConfigFileContents = await checkDefaultConfigFile();

  const scriptConfig = yargs
    .config(defaultConfigFileContents)
    .config(
      'config',
      `The location of the script configuration file. The default location is ${defaultConfigFile}.`,
    )
    .option('awsConfigFile', {
      type: 'string',
      normalize: true,
      default: './aws-sdk-config.json',
      description:
        'The location of the file with AWS credentials. See the aws-sdk-config-sample.json to get the idea.',
    })
    .option('workmailEndpoint', {
      type: 'string',
      description:
        "Override AWS WorkMail geographical location. For example 'https://workmail.eu-west-1.amazonaws.com'",
    })
    .option('workmailOrganizationId', {
      type: 'string',
      description:
        "The ID of your WorkMail organization. Something like 'm-f31c1261be2a4629a0a18a12da03a7f1'",
      demand: true,
    })
    .option('aliasesFile', {
      type: 'string',
      normalize: true,
      description:
        'The location of a UNIX style (simple) aliases file to be synchronized into WorkMail groups and aliases.',
      default: 'aliases',
    })
    .option('groupPrefix', {
      type: 'string',
      description:
        `A unique string that you must specify to ensure spammers can't quess the names of the groups generated by this script. For example 'gen98422' but your own numbers.`,
      demand: true,
    })
    .option('aliasesFileDomain', {
      type: 'string',
      description:
        `The domain under which the names in your aliases file should be understood to exists. For example: 'example.org'.`,
      demand: true,
    })
    .option('aliasesUserEmails', {
      type: 'string',
      normalize: true,
      description:
        `A file mapping users in your aliases file to emails of users in your AWS WorkMail. Users not found in this file are ignored.`,
      default: defaultAliasesUserEmails,
    })
    .option('aliasLimit', {
      type: 'number',
      description:
        `WorkMail has a limit of 100 aliases per entity (user/group). This controls how close to the limit we must be for the work-around (creates intermediate groups) to kick in.`,
      default: 80,
    })
    .option('stateFile', {
      type: 'string',
      normalize: true,
      description:
        `To speed up the script, the last known state of the AWS WorkMail is kept in this file.`,
      default: 'workmail-state.json',
    })
    .option('forceQuery', {
      alias: 'q',
      normalize: true,
      type: 'boolean',
      description:
        'Force reading a fresh state from AWS WorkMail instead of using previous state json. If the stateFile does no longer hold true, this can be used to force a refresh.',
      demand: false,
      default: false,
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      default: false,
      description: 'Enable logging',
      demand: false,
    })
    .option('dryRun', {
      alias: 'n',
      type: 'boolean',
      default: false,
      description: "Dry run, don't run updates on AWS WorkMail.",
      demand: false,
    })
    .epilogue(`
    NOTICE: This script is experimental!

    Please let me know of any regressions of feature reguests:
    https://github.com/pelamfi/AWS-WorkMail-Aliases-Sync/issues/new

    There is no warranty. Please use with care and at your own risk.
    Please see GNU-AGPL-3-0-LICENSE for the exact legal statement.

    Ideally the command line options should be placed in
    aliases-sync-config.json instead to make it easy to rerun this script.
    See aliases-sync-config-sample.json for an example config file.

    Running the script again causes the changes in your aliases
    file be synced to AWS WorkMail. The idea is to provide an
    alternative way to manage your AWS WorkMail aliases and groups.

    Of course you could also run it just once to upload a legacy
    aliases file.
    `).argv;

  return scriptConfig;
}

async function checkDefaultConfigFile() {
  if (
    !process.argv.find(x => x.startsWith('--conf')) &&
    !process.argv.includes('--help') &&
    !process.argv.includes('--version')
  ) {
    console.log(`Loading the default config file ${defaultConfigFile}`);
    const data = await readFile(defaultConfigFile);
    return JSON.parse(data.toString());
  }

  return {};
}
