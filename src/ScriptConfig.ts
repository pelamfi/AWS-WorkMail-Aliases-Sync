import { readFileSync } from 'fs';

export interface Config {
  readonly awsConfigFile: string;  
  readonly workmailEndpoint: string;
  readonly workmailOrganizationId: string;
  readonly groupPrefix: string;
  readonly aliasesFile: string;
  readonly aliasesFileDomain: string;
  readonly localEmailUserToEmail: { readonly [index: string]: string };
  readonly aliasLimit: number;
}

export const configFile = './aliases-sync-config.json';

export function loadScriptConfig(): Config {
  console.log(`Loading ${configFile}`);
  const data = readFileSync(configFile);
  // tslint:disable-next-line: no-suspicious-comment
  // TODO: Actual validation...
  return JSON.parse(data.toString()) as Config;
}
