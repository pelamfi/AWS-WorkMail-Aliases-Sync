import * as R from 'ramda';
import {
  WorkmailGroup,
  EntityMap,
  WorkmailGroupAliases,
  WorkmailUser,
  WorkmailEntityAliases,
} from './WorkmailMap';
import { emailString, Email } from './Email';
import {
  AddUserAlias,
  AddGroupMember,
  AddGroupAlias,
  RemoveUserAlias,
  RemoveGroupAlias,
} from './EmailOperation';

export function addGroupToEntityMap(
  group: WorkmailGroup,
  entityMap: EntityMap,
): EntityMap {
  return {
    ...entityMap,
    groupsByEmail: assocEntityAliases(entityMap.groupsByEmail, {
      entity: group,
      aliases: [],
    }),
  };
}

export function removeGroupFromEntityMap(
  groupEmail: Email,
  entityMap: EntityMap,
): EntityMap {
  return {
    ...entityMap,
    groupsByEmail: dissocEntityAliases(entityMap.groupsByEmail, groupEmail),
  };
}

export function addUserAliasToEntityMap(
  op: AddUserAlias,
  entityMap: EntityMap,
): EntityMap {
  return {
    ...entityMap,
    usersByEmail: updateEntityAliases(
      entityMap.usersByEmail,
      op.alias.user.email,
      addAlias(op.alias.email),
    ),
  };
}

export function addGroupAliasToEntityMap(
  op: AddGroupAlias,
  entityMap: EntityMap,
): EntityMap {
  return {
    ...entityMap,
    groupsByEmail: updateEntityAliases(
      entityMap.groupsByEmail,
      op.alias.group.email,
      addAlias(op.alias.email),
    ),
  };
}

export function removeUserAliasFromEntityMap(
  op: RemoveUserAlias,
  entityMap: EntityMap,
): EntityMap {
  return {
    ...entityMap,
    usersByEmail: updateEntityAliases(
      entityMap.usersByEmail,
      op.alias.user.email,
      removeAlias(op.alias.email),
    ),
  };
}

export function removeGroupAliasFromEntityMap(
  op: RemoveGroupAlias,
  entityMap: EntityMap,
): EntityMap {
  return {
    ...entityMap,
    groupsByEmail: updateEntityAliases(
      entityMap.groupsByEmail,
      op.alias.group.email,
      removeAlias(op.alias.email),
    ),
  };
}

export function updateEntityAliases<T extends WorkmailEntityAliases>(
  byEmail: { readonly [index: string]: T },
  email: Email,
  update: (x: T) => T,
): { readonly [index: string]: T } {
  const prev = byEmail[emailString(email)];
  return assocEntityAliases(byEmail, update(prev));
}

function assocEntityAliases<T extends WorkmailEntityAliases>(
  byEmail: { readonly [index: string]: T },
  entityAliases: T,
): { readonly [index: string]: T } {
  const email = entityAliases.entity.email;
  return R.assoc(emailString(email), entityAliases, byEmail);
}

function dissocEntityAliases<T extends WorkmailEntityAliases>(
  byEmail: { readonly [index: string]: T },
  email: Email,
): { readonly [index: string]: T } {
  return R.dissoc(emailString(email), byEmail);
}

function addAlias<T extends WorkmailEntityAliases>(
  email: Email,
): (aliases: T) => T {
  return (aliases: T) => {
    const index = aliases.aliases.findIndex((x) => x >= email);
    if (index == -1) {
      return { ...aliases, aliases: [...aliases.aliases, email] };
    } else {
      const next = aliases.aliases[index];
      if (next == email) {
        return aliases; // exists already
      } else {
        return { ...aliases, aliases: R.insert(index, email, aliases.aliases) };
      }
    }
  };
}

function removeAlias<T extends WorkmailEntityAliases>(
  email: Email,
): (aliases: T) => T {
  return (aliases: T) => {
    return { ...aliases, aliases: aliases.aliases.filter((x) => x != email) };
  };
}

export function addGroupAssociationToEntityMap(
  user: WorkmailUser,
  op: AddGroupMember,
  entityMap: EntityMap,
): EntityMap {
  return {
    ...entityMap,
    groupsByEmail: updateEntityAliases(
      entityMap.groupsByEmail,
      op.group.email,
      addGroupAssociation(user),
    ),
  };
}

function addGroupAssociation(
  user: WorkmailUser,
): (groupAliases: WorkmailGroupAliases) => WorkmailGroupAliases {
  return (groupAliases: WorkmailGroupAliases) => ({
    ...groupAliases,
    entity: {
      ...groupAliases.entity,
      members: [...groupAliases.entity.members, user.entityId],
    },
  });
}
