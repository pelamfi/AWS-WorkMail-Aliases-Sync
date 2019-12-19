import { readFileSync } from 'fs';

export interface Config {
  workmailOrganizationId: string
  aliasesFile: string
  aliasesFileDomain: string
}

export function load(): Config {
  const configFile = "./management-script-config.json"
  console.log(`Loading ${configFile}`);
  const data = readFileSync(configFile)
  // tslint:disable-next-line: no-suspicious-comment
  // TODO: Actual validation...
  return JSON.parse(data.toString()) as Config
}

