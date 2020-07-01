import * as AWS from 'aws-sdk';
import * as R from 'ramda';
import { Workmail } from './AwsWorkMailUtil';
import { EmailMap, EmailGroup, EmailItem, EmailUser } from './EmailMap';
import {
  WorkmailListing,
  WorkmailEntityAliases,  
  WorkmailMap,
  WorkmailGroup,
  WorkmailUser,
  WorkmailEntityCommon,
  WorkmailEntity,
  EntityMap,
  WorkmailEntityMap,
} from './WorkmailMap';
import { serialPromises } from './PromiseUtil';
import { mapUndef, filterUndef } from './UndefUtil';
import { isGeneratedGroupName, Config } from './GroupNameUtil';
import { Email } from './Email';

// Query a Workmail organization and describe its contents as a WorkmailListing
// The listing can then be expanded to a WorkmailMap with workmailMapFromListing
// for easier and faster lookups.
export async function getWorkmailListing(
  workmail: Workmail,
  config: Config
): Promise<WorkmailListing> {

  const users = await getWorkmailUsers(workmail)
    .then((users) =>
      getWorkmailGroups(workmail, users, config).then((groups) => [
        ...users,
        ...groups,
      ]),
    );
  
  return workmailEntitiesAndAliases(workmail, users);
}

async function workmailEntityAliases<
  T extends WorkmailGroup | WorkmailUser
>(workmail: Workmail, entity: T): Promise<WorkmailEntityAliases> {
  return workmail.service
    .listAliases({
      EntityId: entity.entityId,
      OrganizationId: workmail.organizationId,
    })
    .promise()
    .then((response: AWS.WorkMail.ListAliasesResponse): WorkmailEntityAliases => {
      // console.log("workmailEntityWithAliases response", entity.name)  
      const aliases: Email[] =
        response.Aliases?.filter(alias => alias != entity.email?.email) // also the primary email is returned as an alias
          .map(alias => new Email(alias)) ?? [];
      return {entity, aliases}
    });
}

type WorkmailUserMap = { readonly [index: string]: WorkmailUser };

async function workmailGroupWithMembers(
  workmail: Workmail,
  userMap: WorkmailUserMap,
  group: WorkmailGroup,
): Promise<WorkmailGroup> {
  return workmail.service
    .listGroupMembers({
      GroupId: group.entityId,
      OrganizationId: workmail.organizationId,
    })
    .promise()
    .then(
      (response): WorkmailGroup => {
        // console.log("workmailGroupWithMembers response", group)  
        const memberIds = filterUndef(
          response.Members?.map(member => member?.Id) ?? [],
        );
        const members: WorkmailUser[] = filterUndef(
          memberIds.map(memberId => userMap[memberId]),
        );
        return { ...group, members };
      },
    );
}

function convertEntityCommon(
  kind: string,
  entity: AWS.WorkMail.User | AWS.WorkMail.Group,
): WorkmailEntityCommon | undefined {
  if (entity.State === 'DELETED') {
    return undefined; // filter out ghosts
  }

  if (entity.Name === undefined) {
    console.log(`Warning: AWS ${kind} without name`);
    return undefined;
  }

  if (entity.Id === undefined) {
    console.log(`Warning: AWS ${kind} without entity id`);
    return undefined;
  }

  if (entity.Email === undefined) {
    console.log(`Warning: AWS ${kind} ${entity.Name} without email`);
    return undefined;
  }

  return {
    email: new Email(entity.Email),
    name: entity.Name,
    entityId: entity.Id,
  };
}

function convertGroup(group: AWS.WorkMail.Group): WorkmailGroup | undefined {
  const kind = 'WorkmailGroup' as const;
  const common = convertEntityCommon(kind, group);
  return mapUndef(common => ({ ...common, kind, members: [] }), common); // members are fetched separately
}

function convertUser(user: AWS.WorkMail.User): WorkmailUser | undefined {
  if (user.State == 'DISABLED') {
    return undefined; // filter out disabled users (includes default system users)
  }

  const kind = 'WorkmailUser' as const;
  const common = convertEntityCommon(kind, user);
  return mapUndef(common => ({ ...common, kind }), common);
}

function workmailEntitiesAndAliases(
  workmail: Workmail,
  entities: WorkmailEntity[]
): Promise<WorkmailListing> {
  const promises: (() => Promise<WorkmailEntityAliases>)[] = entities.map(entity => () =>
    workmailEntityAliases(workmail, entity),
  );
  
  return serialPromises(promises).then(entities => ({entities}));
}

async function groupsWithMembers(
  workmail: Workmail,
  userMap: WorkmailUserMap,
  groups: WorkmailGroup[],
): Promise<WorkmailGroup[]> {
  const promises: (() => Promise<WorkmailGroup>)[] = groups.map(group => () =>
    workmailGroupWithMembers(workmail, userMap, group),
  );
  return serialPromises(promises);
}

async function getWorkmailUsers(workmail: Workmail): Promise<WorkmailUser[]> {
  return workmail.service
    .listUsers({ OrganizationId: workmail.organizationId })
    .promise()
    .then(response => filterUndef(response.Users?.map(convertUser) ?? []));
}

async function getWorkmailGroups(
  workmail: Workmail,
  users: WorkmailUser[],
  config: Config,
): Promise<WorkmailGroup[]> {
  const userMap: WorkmailUserMap = R.zipObj(
    users.map((x) => x.entityId),
    users,
  );

  return workmail.service
    .listGroups({ OrganizationId: workmail.organizationId })
    .promise()
    .then(response => response.Groups ?? [])
    .then(filterUndef)
    .then(groups =>
      groups.filter((x) => isGeneratedGroupName(x.Name ?? '', config)),
    )
    .then(R.map(convertGroup))
    .then(filterUndef)
    .then(groups => groupsWithMembers(workmail, userMap, groups));
}

export function workmailMapFromListing(
  listing: WorkmailListing,
): WorkmailMap {

  const byId = R.zipObj(
    listing.entities.map((entityAliases: WorkmailEntityAliases) => entityAliases.entity.entityId),
    listing.entities.map((entityAliases: WorkmailEntityAliases) => entityAliases.entity),
  );

  const entitiesByEmails: WorkmailEntityMap[] = listing.entities.map((entityAliases: WorkmailEntityAliases) => {
    const entity = entityAliases.entity
    const mainEmail = entity.email;
    const emails: Email[] = [
      ...(mainEmail === undefined ? [] : [mainEmail]),
      ...entityAliases.aliases,
    ];
    const pairs: [Email, WorkmailEntity][] = emails.map((email) => [
      email,
      entity,
    ]);
    return R.zipObj(
      pairs.map(p => p[0].email),
      pairs.map(p => p[1]),
    );
  });

  const byEmail = R.mergeAll(entitiesByEmails);

  const entityMap: EntityMap = { byId, byEmail };

  const emailMapParts = listing.entities.map((entityAliases): EmailItem[] | undefined => {
    const {entity, aliases} = entityAliases;
    const mainEmail = entity.email;
    if (mainEmail === undefined) {
      return undefined;
    }
    switch (entity.kind) {
      case 'WorkmailGroup': {
        const members: EmailUser[] = filterUndef(
          entity.members.map((entity) => entity.email),
        ).map(
          (email): EmailUser => {
            return { kind: 'EmailUser', email };
          },
        );
        const group: EmailGroup = {
          kind: 'EmailGroup',
          email: mainEmail,
          name: entity.name,
          members,
        };
        const aliasesObjs: EmailItem[] = aliases.map((email) => ({
          kind: 'EmailGroupAlias',
          email,
          group,
        }));
        return [group, ...aliasesObjs];
      }
      case 'WorkmailUser': {
        const user: EmailUser = { kind: 'EmailUser', email: mainEmail };
        const aliasesObjs: EmailItem[] = aliases.map((email) => ({
          kind: 'EmailUserAlias',
          email,
          user,
        }));
        return [user, ...aliasesObjs];
      }
    }
  });

  const emailMapItems = R.flatten(filterUndef(emailMapParts));
  const emailMap: EmailMap = R.zipObj(
    emailMapItems.map((i) => i.email.email),
    emailMapItems,
  );

  return { entityMap, emailMap };
}
