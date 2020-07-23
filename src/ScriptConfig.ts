import { readFile } from './FsUtil';

export interface Config {
  readonly awsConfigFile: string;
  readonly workmailEndpoint: string;
  readonly workmailOrganizationId: string;
  readonly groupPrefix: string;
  readonly aliasesFile: string;
  readonly aliasesFileDomain: string;
  readonly localEmailUserToEmail: { readonly [index: string]: string };
  readonly aliasLimit: number;
  readonly stateFile: string;
}

export const configFile = './aliases-sync-config.json';

export async function loadScriptConfig(): Promise<Config> {
  console.log(`Loading ${configFile}`);
  const data = await readFile(configFile);
  // tslint:disable-next-line: no-suspicious-comment
  // TODO: Actual validation...
  return JSON.parse(data.toString()) as Config;
}
