import * as R from 'ramda';
import {
  EmailMap,
  EmailUserAlias,
  EmailGroup,
  EmailItem,
  EmailGroupAlias,
  emailItemOrd,
} from './EmailMap';
import { emailFrom, emailString } from './Email';
import { generateWorkaroundGroupName } from './GroupNameUtil';

// Information needed to create the groups for the workaround
export interface WorkaroundConfig {
  groupPrefix: string;
  aliasesFileDomain: string;
  aliasLimit: number; // 80 may be a good value, 100 is the absolute maximum with current AWS
}

// Adapter/wrapper for EmailMap, calls aliasLimitWorkaround
export function emailMapAliasLimitWorkaround(
  emails: EmailMap,
  config: WorkaroundConfig,
): EmailMap {
  const [userAliasesUncast, otherEmails] = R.partition(
    (email) => email.kind == 'EmailUserAlias',
    Object.values(emails).sort(emailItemOrd),
  );

  const userAliases = userAliasesUncast as EmailUserAlias[]; // ugh

  const aliasesWithGroupOverflow = aliasLimitWorkaround(userAliases, config);

  const modifiedEmails = [...otherEmails, ...aliasesWithGroupOverflow];

  return R.zipObj(
    modifiedEmails.map((x) => emailString(x.email)),
    modifiedEmails,
  );
}

// Convert excessive user aliases into groups with just that user and group aliases
export function aliasLimitWorkaround(
  userAliases: EmailUserAlias[],
  config: WorkaroundConfig,
): EmailItem[] {
  const groupByUserEmail = R.groupBy((email: EmailUserAlias): string =>
    emailString(email.user.email),
  );

  const groupedByUser: { [index: string]: EmailUserAlias[] } = groupByUserEmail(
    userAliases,
  );

  const aliasLimit = config.aliasLimit;

  const aliasesByUserAndSlicedByLimit: [
    string,
    EmailUserAlias[][],
  ][] = Object.keys(groupedByUser)
    .sort()
    .map((userEmail: string): [string, EmailUserAlias[][]] => {
      const aliasesForUser = groupedByUser[userEmail];
      const groupsNeeded = Math.ceil(aliasesForUser.length / aliasLimit);
      const sliceIndices = R.range(0, groupsNeeded);
      const aliasesSliced = sliceIndices.map((groupIndex) =>
        aliasesForUser.slice(
          groupIndex * aliasLimit,
          (groupIndex + 1) * aliasLimit,
        ),
      );
      return [userEmail, aliasesSliced];
    });

  const aliasesWithGroupOverflow = R.flatten(
    aliasesByUserAndSlicedByLimit.map((record): EmailItem[] => {
      const [, aliasesGroups] = record;
      const notOverflow = aliasesGroups[0];
      const user = notOverflow[0].user;
      const overflowing = R.drop(1, aliasesGroups);
      const groupIndices = R.range(0, overflowing.length);
      const groups: EmailGroup[] = groupIndices.map(
        (groupIndex): EmailGroup => {
          const name = generateWorkaroundGroupName(
            user.email,
            groupIndex,
            config,
          );
          const email = emailFrom(name, config.aliasesFileDomain);
          return { kind: 'EmailGroup', email, members: [user], name };
        },
      );
      const groupAliases: EmailGroupAlias[] = R.flatten(
        groups.map((group, groupIndex): EmailGroupAlias[] => {
          const aliases = overflowing[groupIndex];
          return aliases.map(
            (alias): EmailGroupAlias => ({
              kind: 'EmailGroupAlias',
              group,
              email: alias.email,
            }),
          );
        }),
      );
      return [...notOverflow, ...groups, ...groupAliases];
    }),
  );

  return aliasesWithGroupOverflow;
}
