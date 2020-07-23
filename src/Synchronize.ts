import { aliasesFileToEmailMap } from './AliasesFileToEmaiMap';
import { aliasesPerUser, AliasesFileAlias } from './AliasesFile';
import { emailMapSync } from './EmailMapSync';
import { createAwsWorkmailRequest } from './WorkmailRequest';
import { Email } from './Email';
import { emailMapAliasLimitWorkaround } from './AliasLimitWorkaround';
import { EntityMap, WorkmailMap, workmailMapFromListing, WorkmailListing, workmailListingFromMap } from './WorkmailMap';
import { EmailOperation } from './EmailOperation';
import { WorkmailUpdate } from './AwsWorkMailUtil';

export interface Config {
  aliasesFileDomain: string;
  readonly localEmailUserToEmail: { readonly [index: string]: Email };
  groupPrefix: string;
  readonly aliasLimit: number;
  readonly dryRun: boolean;
}

export async function synchronize(
  config: Config,
  aliases: AliasesFileAlias[],
  currentWorkmailListing: WorkmailListing,
  workmailUpdate: WorkmailUpdate): Promise<WorkmailListing> {

  const aliasesFileUsers = aliasesPerUser(aliases);

  function localUserToEmail(localUser: string): Email | undefined {
    const localEmail = config.localEmailUserToEmail[localUser];
    if (localEmail === undefined) {
      return undefined;
    }
    return localEmail;
  }

  const targetAwsEmailMapIdeal = aliasesFileToEmailMap(aliasesFileUsers, {
    ...config,
    localUserToEmail,
  });

  const currentWorkmailMap = workmailMapFromListing(currentWorkmailListing);

  const targetAwsEmailMap = emailMapAliasLimitWorkaround(
    targetAwsEmailMapIdeal,
    config);

  console.log(
    `Computing operations to sync aliases file with ${
      Object.keys(targetAwsEmailMap).length} aliases to WorkMail with`);

  const syncOperations = emailMapSync(
    currentWorkmailMap.emailMap,
    targetAwsEmailMap);

  const initialPromise: Promise<EntityMap> = Promise.resolve<EntityMap>(
    currentWorkmailMap.entityMap);

  function reductionStep(
    prev: Promise<EntityMap>,
    op: EmailOperation): Promise<EntityMap> {
    return prev.then((entityMap) => {
      return createAwsWorkmailRequest(workmailUpdate, entityMap, op).then(
        (entityMapUpdate) => {
          return entityMapUpdate(entityMap);
        });
    });
  }


  if (config.dryRun) {
    console.log(`Not executing ${syncOperations.length} operations due to the dry run option.`);
    return currentWorkmailListing;
  }

  console.log(`Executing ${syncOperations.length} operations to synchronize AWS WorkMail aliases.`);

  const finalEntityMap = await syncOperations.reduce(
    reductionStep,
    initialPromise);

  const finalMap: WorkmailMap = {
    entityMap: finalEntityMap,
    emailMap: targetAwsEmailMap,
  };

  console.log(
    `${syncOperations.length} operations completed, users: ${
      Object.keys(finalMap.entityMap.usersByEmail).length} groups: ${
      Object.keys(finalMap.entityMap.groupsByEmail).length}`);

  return workmailListingFromMap(finalMap);
}
