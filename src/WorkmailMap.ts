import { Email, emailString } from './Email';
import { EmailMap, EmailGroup, EmailItem, EmailUser } from './EmailMap';
import { filterUndef } from './UndefUtil';
import R from 'ramda';

export interface EntityId extends String {
  _AwsWorkmailEntityIdEmailBrand: string;
};

export function brandEntityId(id: AWS.WorkMail.WorkMailIdentifier): EntityId {
  return id as unknown as EntityId
}

export function entityIdString(id: EntityId): string {
  return id as unknown as string
}

// This represents the information contained in an AWS WorkMail account
// that this program is interested in.
export type WorkmailListing = {
  readonly entities: WorkmailEntityAliases[]
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

export type WorkmailUser = { kind: 'WorkmailUser' } & WorkmailEntityCommon;

export type WorkmailGroup = {
  kind: 'WorkmailGroup';
  members: WorkmailUser[];
} & WorkmailEntityCommon;

// This information is read from AWS. It includes the basic information
// for a user or a group and the list of email aliases bound to that
// entity
export type WorkmailEntityAliases = {
  entity: WorkmailEntity,
  aliases: Email[]
};

export function workmailMapFromListing(
  listing: WorkmailListing,
): WorkmailMap {

  const byId = R.zipObj(
    listing.entities.map((entityAliases: WorkmailEntityAliases) => entityIdString(entityAliases.entity.entityId)),
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
      pairs.map(p => emailString(p[0])),
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
    emailMapItems.map((i) => emailString(i.email)),
    emailMapItems,
  );

  return { entityMap, emailMap };
}
