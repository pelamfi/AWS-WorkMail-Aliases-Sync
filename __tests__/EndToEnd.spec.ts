import { emailFrom, emailLocal, Email } from '../src/Email';
import { WorkmailUpdate } from '../src/AwsWorkMailUtil';
import {
  GroupEntityId,
  WorkmailGroup,
  UserEntityId,
  groupEntityId,
  WorkmailListing,
  WorkmailUser,
  userEntityId,
} from '../src/WorkmailMap';
import * as Synchronize from '../src/Synchronize';
import { AliasesFileAlias } from '../src/AliasesFile';

const domain = 'domain';
const user1 = emailFrom('user1', domain);
const user2 = emailFrom('user2', domain);
const user3 = emailFrom('user3', domain);
const aliasFoo = emailFrom('foo', domain);
const aliasBar = emailFrom('bar', domain);
const aliasBaz = emailFrom('baz', domain);
const aliasQuux = emailFrom('quux', domain);

const groupPrefix = 'groupPrefix';
const aliasLimit = 2;

const config: Synchronize.Config = {
  aliasesFileDomain: domain,
  localEmailUserToEmail: { user1: user1, user2: user2, user3: user3 },
  groupPrefix,
  aliasLimit,
  dryRun: false,
  verbose: false,
};

const aliases: AliasesFileAlias[] = [];

const user1EntityId = userEntityId('user1EntityId');
const user2EntityId = userEntityId('user2EntityId');
const user3EntityId = userEntityId('user3EntityId');

const workmailUser1: WorkmailUser = {
  kind: 'WorkmailUser',
  entityId: user1EntityId,
  name: 'User1Name',
  email: user1,
};
const workmailUser2: WorkmailUser = {
  kind: 'WorkmailUser',
  entityId: user2EntityId,
  name: 'User2Name',
  email: user2,
};
const workmailUser3: WorkmailUser = {
  kind: 'WorkmailUser',
  entityId: user3EntityId,
  name: 'User3Name',
  email: user3,
};

const minimalWorkmailListing: WorkmailListing = {
  groups: [],
  users: [{ entity: workmailUser1, aliases: [] }],
};
const threeUserWorkmailListing: WorkmailListing = {
  groups: [],
  users: [
    { entity: workmailUser1, aliases: [] },
    { entity: workmailUser2, aliases: [] },
    { entity: workmailUser3, aliases: [] },
  ],
};

const groupEntityId1: GroupEntityId = groupEntityId('groupEntityId1');

const group: WorkmailGroup = {
  kind: 'WorkmailGroup',
  email: aliasFoo,
  entityId: groupEntityId1,
  name: groupPrefix + '-' + emailLocal(aliasFoo),
  members: [workmailUser1.entityId, workmailUser2.entityId],
};

const group2: WorkmailGroup = {
  kind: 'WorkmailGroup',
  email: aliasFoo,
  entityId: groupEntityId1,
  name: groupPrefix + '-' + emailLocal(aliasFoo),
  members: [workmailUser1.entityId, workmailUser3.entityId],
};

const listingWith1Group: WorkmailListing = {
  groups: [{ entity: group, aliases: [] }],
  users: threeUserWorkmailListing.users,
};

const listingWith1Group2: WorkmailListing = {
  groups: [{ entity: group2, aliases: [] }],
  users: threeUserWorkmailListing.users,
};

const aliasOverflowGroupEmail = emailFrom(
  groupPrefix + '-alias-user1-0',
  domain,
);

const aliasOverflowGroup: WorkmailGroup = {
  kind: 'WorkmailGroup',
  email: aliasOverflowGroupEmail,
  entityId: groupEntityId1,
  name: emailLocal(aliasOverflowGroupEmail),
  members: [workmailUser1.entityId],
};

const aliasOverflowListing: WorkmailListing = {
  groups: [{ entity: aliasOverflowGroup, aliases: [aliasFoo] }],
  users: [
    { entity: workmailUser1, aliases: [aliasBar, aliasBaz] },
    { entity: workmailUser2, aliases: [] },
    { entity: workmailUser3, aliases: [] },
  ],
};

const aliasOverflowListing2: WorkmailListing = {
  groups: [{ entity: aliasOverflowGroup, aliases: [aliasQuux] }],
  users: [
    { entity: workmailUser1, aliases: [aliasBaz, aliasFoo] },
    { entity: workmailUser2, aliases: [] },
    { entity: workmailUser3, aliases: [] },
  ],
};

const aliases1Group: AliasesFileAlias[] = [
  {
    alias: emailLocal(aliasFoo),
    localEmails: [emailLocal(user1), emailLocal(user2)],
  },
];

const aliases1Group2: AliasesFileAlias[] = [
  {
    alias: emailLocal(aliasFoo),
    localEmails: [emailLocal(user1), emailLocal(user3)],
  },
];

const overflowingAliases = [
  { alias: emailLocal(aliasFoo), localEmails: [emailLocal(user1)] },
  { alias: emailLocal(aliasBar), localEmails: [emailLocal(user1)] },
  { alias: emailLocal(aliasBaz), localEmails: [emailLocal(user1)] },
];

const overflowingAliases2 = [
  { alias: emailLocal(aliasFoo), localEmails: [emailLocal(user1)] },
  { alias: emailLocal(aliasQuux), localEmails: [emailLocal(user1)] },
  { alias: emailLocal(aliasBaz), localEmails: [emailLocal(user1)] },
];

function mockWorkmail(): WorkmailUpdate {
  const createAlias: (
    entityId: GroupEntityId | UserEntityId,
    alias: Email,
  ) => Promise<void> = jest.fn().mockReturnValue(Promise.resolve());

  const deleteAlias: (
    entityId: GroupEntityId | UserEntityId,
    alias: Email,
  ) => Promise<void> = jest.fn().mockReturnValue(Promise.resolve());

  const removeGroup: (
    groupEntityId: GroupEntityId,
  ) => Promise<void> = jest.fn().mockReturnValue(Promise.resolve());

  const associateMemberToGroup: (
    groupEntityId: GroupEntityId,
    userEntityId: UserEntityId,
  ) => Promise<void> = jest.fn().mockReturnValue(Promise.resolve());

  const addGroup: (
    name: string,
    email: Email,
  ) => Promise<GroupEntityId> = jest
    .fn()
    .mockReturnValueOnce(Promise.resolve(groupEntityId1));

  return {
    createAlias,
    deleteAlias,
    removeGroup,
    associateMemberToGroup,
    addGroup,
  };
}

describe('The synchronization mechanism', () => {
  it('Accepts empty data and does nothing', () => {
    const update = mockWorkmail();
    const emptyWorkmailListing: WorkmailListing = { groups: [], users: [] };
    return Synchronize.synchronize(
      config,
      aliases,
      emptyWorkmailListing,
      update,
    ).then((listing) => {
      expect(update.createAlias).toBeCalledTimes(0);
      expect(update.deleteAlias).toBeCalledTimes(0);
      expect(update.removeGroup).toBeCalledTimes(0);
      expect(update.associateMemberToGroup).toBeCalledTimes(0);
      expect(update.addGroup).toBeCalledTimes(0);
      expect(Object.keys(listing.groups).length).toStrictEqual(0);
      expect(Object.keys(listing.users).length).toStrictEqual(0);
    });
  });

  it('Adds one alias', () => {
    const update = mockWorkmail();
    const aliases = [
      { alias: emailLocal(aliasFoo), localEmails: [emailLocal(user1)] },
    ];
    return Synchronize.synchronize(
      config,
      aliases,
      minimalWorkmailListing,
      update,
    ).then((listing) => {
      expect(update.createAlias).toBeCalledTimes(1);
      expect(update.deleteAlias).toBeCalledTimes(0);
      expect(update.removeGroup).toBeCalledTimes(0);
      expect(update.associateMemberToGroup).toBeCalledTimes(0);
      expect(update.addGroup).toBeCalledTimes(0);
      const aliasAddedListing: WorkmailListing = {
        groups: [],
        users: [{ entity: workmailUser1, aliases: [aliasFoo] }],
      };
      expect(listing).toStrictEqual(aliasAddedListing);
    });
  });

  it('Adds one group', () => {
    const update = mockWorkmail();
    return Synchronize.synchronize(
      config,
      aliases1Group,
      threeUserWorkmailListing,
      update,
    ).then((listing) => {
      expect(update.createAlias).toBeCalledTimes(0);
      expect(update.deleteAlias).toBeCalledTimes(0);
      expect(update.removeGroup).toBeCalledTimes(0);
      expect(update.associateMemberToGroup).toBeCalledTimes(2);
      expect(update.addGroup).toBeCalledTimes(1);
      expect(listing).toStrictEqual(listingWith1Group);
    });
  });

  it('Removes one group', () => {
    const update = mockWorkmail();
    const aliases: AliasesFileAlias[] = [];
    return Synchronize.synchronize(
      config,
      aliases,
      listingWith1Group,
      update,
    ).then((listing) => {
      expect(update.createAlias).toBeCalledTimes(0);
      expect(update.deleteAlias).toBeCalledTimes(0);
      expect(update.removeGroup).toBeCalledTimes(1);
      expect(update.associateMemberToGroup).toBeCalledTimes(0);
      expect(update.addGroup).toBeCalledTimes(0);
      expect(listing).toStrictEqual(threeUserWorkmailListing);
    });
  });

  it('Adds overflowing aliases, removes 1 group', () => {
    const update = mockWorkmail();

    return Synchronize.synchronize(
      config,
      overflowingAliases,
      listingWith1Group,
      update,
    ).then((listing) => {
      expect(update.createAlias).toBeCalledTimes(3);
      expect(update.deleteAlias).toBeCalledTimes(0);
      expect(update.removeGroup).toBeCalledTimes(1);
      expect(update.associateMemberToGroup).toBeCalledTimes(1);
      expect(update.addGroup).toBeCalledTimes(1);
      expect(listing).toStrictEqual(aliasOverflowListing);
    });
  });

  it('Removes overflowing aliases, adds 1 group', () => {
    const update = mockWorkmail();
    return Synchronize.synchronize(
      config,
      aliases1Group,
      aliasOverflowListing,
      update,
    ).then((listing) => {
      expect(update.createAlias).toBeCalledTimes(0);
      expect(update.deleteAlias).toBeCalledTimes(3); // TODO: No need to remove aliases from a group to be deleted
      expect(update.removeGroup).toBeCalledTimes(1);
      expect(update.associateMemberToGroup).toBeCalledTimes(2);
      expect(update.addGroup).toBeCalledTimes(1);
      expect(listing).toStrictEqual(listingWith1Group);
    });
  });

  it('Does nothing when overflowing aliases are already handled', () => {
    const update = mockWorkmail();
    return Synchronize.synchronize(
      config,
      overflowingAliases,
      aliasOverflowListing,
      update,
    ).then((listing) => {
      expect(update.createAlias).toBeCalledTimes(0);
      expect(update.deleteAlias).toBeCalledTimes(0);
      expect(update.removeGroup).toBeCalledTimes(0);
      expect(update.associateMemberToGroup).toBeCalledTimes(0);
      expect(update.addGroup).toBeCalledTimes(0);
      expect(listing).toStrictEqual(aliasOverflowListing);
    });
  });

  it('Does nothing when the group is already handled', () => {
    const update = mockWorkmail();
    return Synchronize.synchronize(
      config,
      aliases1Group,
      listingWith1Group,
      update,
    ).then((listing) => {
      expect(update.createAlias).toBeCalledTimes(0);
      expect(update.deleteAlias).toBeCalledTimes(0);
      expect(update.removeGroup).toBeCalledTimes(0);
      expect(update.associateMemberToGroup).toBeCalledTimes(0);
      expect(update.addGroup).toBeCalledTimes(0);
      expect(listing).toStrictEqual(listingWith1Group);
    });
  });

  it('Changes overflowing aliases', () => {
    const update = mockWorkmail();

    return Synchronize.synchronize(
      config,
      overflowingAliases2,
      aliasOverflowListing,
      update,
    ).then((listing) => {
      expect(update.createAlias).toBeCalledTimes(2);
      expect(update.deleteAlias).toBeCalledTimes(2);
      expect(update.removeGroup).toBeCalledTimes(0);
      expect(update.associateMemberToGroup).toBeCalledTimes(0);
      expect(update.addGroup).toBeCalledTimes(0);
      expect(listing).toStrictEqual(aliasOverflowListing2);
    });
  });

  it('Changes group members', () => {
    const update = mockWorkmail();

    return Synchronize.synchronize(
      config,
      aliases1Group2,
      listingWith1Group,
      update,
    ).then((listing) => {
      expect(update.createAlias).toBeCalledTimes(0);
      expect(update.deleteAlias).toBeCalledTimes(0);
      // TODO: it would be better to disassociate 1 member and associate another instead of recreating the group.
      expect(update.removeGroup).toBeCalledTimes(1);
      expect(update.associateMemberToGroup).toBeCalledTimes(2);
      expect(update.addGroup).toBeCalledTimes(1);
      expect(listing).toStrictEqual(listingWith1Group2);
    });
  });
});
