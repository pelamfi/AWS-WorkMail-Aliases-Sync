import { readFileSync } from 'fs';

export interface Config {
  workmailOrganizationId: string
  aliasesFile: string
  aliasesFileDomain: string
  emailToLocalEmail: { [index: string]: string }
}

export const configFile = "./management-script-config.json"
  
export function load(): Config {
  console.log(`Loading ${configFile}`);
  const data = readFileSync(configFile)
  // tslint:disable-next-line: no-suspicious-comment
  // TODO: Actual validation...
  return JSON.parse(data.toString()) as Config
}

