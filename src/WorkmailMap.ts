import { Email, emailString } from './Email';
import { EmailMap, EmailGroup, EmailItem, EmailUser } from './EmailMap';
import { filterUndef } from './UndefUtil';
import R from 'ramda';

export interface EntityId extends String {
  _AwsWorkmailEntityIdEmailBrand: string;
};

export interface UserEntityId extends EntityId {
  _AwsWorkmailUserEntityIdEmailBrand: string;
};

export function userEntityId(id: AWS.WorkMail.WorkMailIdentifier): UserEntityId {
  return id as unknown as UserEntityId
}

export function userEntityIdString(id: UserEntityId): string {
  return id as unknown as string
}

export interface GroupEntityId extends EntityId {
  _AwsWorkmailGroupEntityIdEmailBrand: string;
};

export function groupEntityId(id: AWS.WorkMail.WorkMailIdentifier): GroupEntityId {
  return id as unknown as GroupEntityId
}

export function groupEntityIdString(id: GroupEntityId): string {
  return id as unknown as string
}

export function entityIdString(id: EntityId): string {
  return id as unknown as string
}

// This represents the information contained in an AWS WorkMail account
// that this program is interested in.
export type WorkmailListing = {
  readonly groups: WorkmailGroupAliases[]
  readonly users: WorkmailUserAliases[]
};

// WorkmailMap includes an EmailMap and adds information about Workmail entitites
// WorkmailMap can be built from WorkmailListing
export type WorkmailMap = {
  readonly entityMap: EntityMap;
  readonly emailMap: EmailMap;
};

export type EntityMap = {
  readonly byId: WorkmailEntityMap;
  readonly byEmail: WorkmailEntityMap;
};

export type WorkmailEntityMap = { readonly [index: string]: WorkmailEntity };

export type WorkmailEntity = WorkmailUser | WorkmailGroup;

export interface WorkmailEntityCommon {
  readonly entityId: EntityId;
  readonly name: string;
  readonly email?: Email;
}

export type WorkmailUser = { kind: 'WorkmailUser', entityId: UserEntityId } & WorkmailEntityCommon;

export type WorkmailGroup = {
  entityId: GroupEntityId,  
  kind: 'WorkmailGroup';
  members: UserEntityId[];
} & WorkmailEntityCommon;

// This information is read from AWS. It includes the basic information
// for a user or a group and the list of email aliases bound to that
// entity
export type WorkmailEntityAliases = {
  entity: WorkmailEntity,
  aliases: Email[]
};

export type WorkmailUserAliases = {
  entity: WorkmailUser,
  aliases: Email[]
};

export type WorkmailGroupAliases = {
  entity: WorkmailGroup,
  aliases: Email[]
};

export function workmailMapFromListing(
  listing: WorkmailListing,
): WorkmailMap {

  const entities = R.concat<WorkmailEntityAliases>(listing.groups, listing.users);
  
  const userById = R.zipObj(
    listing.users.map(user => entityIdString(user.entity.entityId)),
    listing.users.map(user => user.entity),
  );

  const byId = R.zipObj(
    entities.map((entityAliases: WorkmailEntityAliases) => entityIdString(entityAliases.entity.entityId)),
    entities.map((entityAliases: WorkmailEntityAliases) => entityAliases.entity),
  );

  const entitiesByEmails: WorkmailEntityMap[] = entities.map((entityAliases: WorkmailEntityAliases) => {
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
      pairs.map(p => emailString(p[0])),
      pairs.map(p => p[1]),
    );
  });

  const byEmail = R.mergeAll(entitiesByEmails);

  const entityMap: EntityMap = { byId, byEmail };

  const emailMapParts = entities.map((entityAliases): EmailItem[] | undefined => {
    const {entity, aliases} = entityAliases;
    const mainEmail = entity.email;
    if (mainEmail === undefined) {
      return undefined;
    }
    switch (entity.kind) {
      case 'WorkmailGroup': {
        const members: EmailUser[] = filterUndef(
          entity.members.map((entityId: UserEntityId) => userById[entityIdString(entityId)]?.email),
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
    emailMapItems.map((i) => emailString(i.email)),
    emailMapItems,
  );

  return { entityMap, emailMap };
}
