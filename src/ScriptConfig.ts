import { readFileSync } from 'fs';

export interface Config {
  readonly workmailOrganizationId: string;
  readonly groupPrefix: string;
  readonly aliasesFile: string;
  readonly aliasesFileDomain: string;
  readonly localEmailUserToEmail: { readonly [index: string]: string };
}

export const configFile = './management-script-config.json';

export function load(): Config {
  console.log(`Loading ${configFile}`);
  const data = readFileSync(configFile);
  // tslint:disable-next-line: no-suspicious-comment
  // TODO: Actual validation...
  return JSON.parse(data.toString()) as Config;
}
