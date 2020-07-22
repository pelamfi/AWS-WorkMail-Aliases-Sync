import { Workmail } from './AwsWorkMailUtil';
import {
  WorkmailListing,
  WorkmailGroup,
  WorkmailUser,
  WorkmailEntityCommon,
  WorkmailEntity,
  userEntityId,
  groupEntityId,
  EntityId,
  entityIdString,
} from './WorkmailMap';
import { serialPromises } from './PromiseUtil';
import { mapUndef, filterUndef } from './UndefUtil';
import { isGeneratedGroupName, Config } from './GroupNameUtil';
import { emailFrom, Email } from './Email';
import R from 'ramda';
import { retry } from './Retry';
import { eitherThrow } from './EitherUtil';

// Query a Workmail organization and describe its contents as a WorkmailListing
// The listing can then be expanded to a WorkmailMap with workmailMapFromListing
// for easier and faster lookups.
export async function getWorkmailListing(
  workmail: Workmail,
  config: Config
): Promise<WorkmailListing> {

  const plainUsers = await getWorkmailUsers(workmail);

  console.log(`Got ${plainUsers.length} users`)

  const plainGroups = await getWorkmailGroups(workmail, config);

  console.log(`Got ${plainGroups.length} groups`)

  const users = await workmailEntitiesAndAliases(workmail, plainUsers);

  console.log(`Got ${R.sum(users.map(x => x.aliases.length))} aliases for users`)

  const groups = await workmailEntitiesAndAliases(workmail, plainGroups);

  console.log(`Got ${R.sum(groups.map(x => x.aliases.length))} aliases for groups`)

  return {users, groups}
}

async function workmailEntityAliases<
  T extends WorkmailGroup | WorkmailUser
>(workmail: Workmail, entity: T): Promise<Email[]> {
  return retry(() => workmail.service
    .listAliases({
      EntityId: entityIdString(entity.entityId),
      OrganizationId: workmail.organizationId,
    })
    .promise(), `list aliases for ${entity.name}`)
    .then(eitherThrow)
    .then((response: AWS.WorkMail.ListAliasesResponse): Email[] => {
      // console.log("workmailEntityWithAliases response", entity.name)
      const aliases: Email[] =
        response.Aliases?.filter(alias => emailFrom(alias) != entity.email) // also the primary email is returned as an alias
          .map(alias => emailFrom(alias)) ?? [];
      return aliases;
    });
}

async function workmailGroupWithMembers(
  workmail: Workmail,
  group: WorkmailGroup,
): Promise<WorkmailGroup> {
  return retry(() => workmail.service
    .listGroupMembers({
      GroupId: entityIdString(group.entityId),
      OrganizationId: workmail.organizationId,
    })
    .promise(), `list group members of ${group.name}`)
    .then(eitherThrow)
    .then(
      (response: AWS.WorkMail.ListGroupMembersResponse): WorkmailGroup => {
        // console.log("workmailGroupWithMembers response", group)

        const members = filterUndef(
          response.Members?.map(member => member?.Id) ?? [])
          .map(userEntityId);

        return { ...group, members };
      },
    );
}

function convertEntityCommon<T extends EntityId>(
  kind: string,
  entity: AWS.WorkMail.User | AWS.WorkMail.Group,
  brandId: (id: AWS.WorkMail.WorkMailIdentifier) => T
): WorkmailEntityCommon & {entityId : T} | undefined {
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
    email: emailFrom(entity.Email),
    name: entity.Name,
    entityId: brandId(entity.Id),
  };
}

function convertGroup(group: AWS.WorkMail.Group): WorkmailGroup | undefined {
  const kind = 'WorkmailGroup' as const;
  const common = convertEntityCommon(kind, group, groupEntityId);
  return mapUndef(common => ({ ...common, kind, members: [] }), common); // members are fetched separately
}

function convertUser(user: AWS.WorkMail.User): WorkmailUser | undefined {
  if (user.State == 'DISABLED') {
    return undefined; // filter out disabled users (includes default system users)
  }

  const kind = 'WorkmailUser' as const;
  const common = convertEntityCommon(kind, user, userEntityId);
  return mapUndef(common => ({ ...common, kind }), common);
}

function workmailEntitiesAndAliases<T extends WorkmailEntity>(
  workmail: Workmail,
  entities: T[]
): Promise<{entity: T, aliases: Email[]}[]> {
  const promises: (() => Promise<{entity: T, aliases: Email[]}>)[] = entities.map(entity => () =>
    workmailEntityAliases(workmail, entity).then((aliases: Email[]) => ({entity, aliases}))
  );

  return serialPromises(promises)
}

async function groupsWithMembers(
  workmail: Workmail,
  groups: WorkmailGroup[],
): Promise<WorkmailGroup[]> {
  const promises: (() => Promise<WorkmailGroup>)[] = groups.map(group => () =>
    workmailGroupWithMembers(workmail, group),
  );
  return serialPromises(promises);
}

async function getWorkmailUsers(workmail: Workmail): Promise<WorkmailUser[]> {
  return retry(() => workmail.service
    .listUsers({ OrganizationId: workmail.organizationId })
    .promise(), "list users")
    .then(eitherThrow)
    .then(response => filterUndef(response.Users?.map(convertUser) ?? []));
}

async function getWorkmailGroups(
  workmail: Workmail,
  config: Config
): Promise<WorkmailGroup[]> {
  return retry(() => workmail.service
    .listGroups({ OrganizationId: workmail.organizationId })
    .promise(), "list groups")
    .then(eitherThrow)
    .then(response => response.Groups ?? [])
    .then(filterUndef)
    .then(groups =>
      // This script only manages groups with a name
      // that indicates that the group was generated by this script.
      // Here we filter out groups not generated by this script
      // early to to save the effort of trying to fetch their memebers.
      groups.filter((x) => isGeneratedGroupName(x.Name ?? '', config)),
    )
    .then(R.map(convertGroup))
    .then(filterUndef)
    .then(groups => groupsWithMembers(workmail, groups));
}

