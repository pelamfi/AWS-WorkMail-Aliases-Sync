import { readFile } from './FsUtil';
import { Email } from './Email';

export interface AliasesUserEmails { readonly [index: string]: Email };

export const defaultConfigFile = './aliases-sync-config.json';

export const defaultAliasesUserEmails = './aliases-user-emails.json';

export async function loadAliasesUserEmails(file: string = defaultAliasesUserEmails): Promise<AliasesUserEmails> {
  console.log(`Loading ${file}`);
  const data = await readFile(file);
  // tslint:disable-next-line: no-suspicious-comment
  // TODO: Actual validation...
  return JSON.parse(data.toString()) as AliasesUserEmails;
}
