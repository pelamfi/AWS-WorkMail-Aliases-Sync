import { readFileSync } from 'fs';

export interface Config {
  workmailOrganizationId: string
}

export function load(): Config {
  const configFile = "./management-script-config.json"
  console.log(`Loading ${configFile}`);
  const data = readFileSync(configFile)
  return JSON.parse(data.toString()) as Config
}

