import { emailFrom, emailString, emailLocal, Email } from '../src/Email';
import { WorkmailUpdate } from '../src/AwsWorkMailUtil';
import { GroupEntityId, WorkmailGroup, UserEntityId, groupEntityId, WorkmailListing, WorkmailUser, userEntityId } from '../src/WorkmailMap';
import * as Synchronize from '../src/Synchronize';
import { AliasesFileAlias } from '../src/AliasesFile';

const domain = "domain";
const user1 = emailFrom("user1", domain);
const user2 = emailFrom("user2", domain);
const aliasFoo = emailFrom("foo", domain);
const aliasBar = emailFrom("bar", domain);
const aliasBaz = emailFrom("baz", domain);

const groupPrefix = "groupPrefix"
const aliasLimit = 2

const config: Synchronize.Config = {
  aliasesFileDomain: domain,
  localEmailUserToEmail: {"user1": emailString(user1), "user2": emailString(user2)},
  groupPrefix,
  aliasLimit
};

const aliases: AliasesFileAlias[] = [];

const user1EntityId = userEntityId("user1EntityId");
const user2EntityId = userEntityId("user2EntityId");

const workmailUser1: WorkmailUser = {kind: 'WorkmailUser', entityId: user1EntityId, name: "User1Name", email: user1};
const workmailUser2: WorkmailUser = {kind: 'WorkmailUser', entityId: user2EntityId, name: "User2Name", email: user2};

const minimalWorkmailListing: WorkmailListing = {groups: [], users: [{entity: workmailUser1, aliases: []}]};
const twoUserWorkmailListing: WorkmailListing = {groups: [], users: [
  {entity: workmailUser1, aliases: []}, {entity: workmailUser2, aliases: []}]};

const groupEntityId1: GroupEntityId = groupEntityId("groupEntityId1");

const group: WorkmailGroup = {
  kind: "WorkmailGroup",
  email: aliasFoo,
  entityId: groupEntityId1,
  name: groupPrefix + "-" + emailString(aliasFoo),
  members: [workmailUser1.entityId, workmailUser2.entityId]};

const listingWith1Group: WorkmailListing = {groups: [{entity: group, aliases: []}], users: twoUserWorkmailListing.users};

const aliasOverflowGroupEmail = emailFrom(groupPrefix + "-alias-user1-0", domain)

const aliasOverflowGroup: WorkmailGroup = {
  kind: "WorkmailGroup",
  email: aliasOverflowGroupEmail,
  entityId: groupEntityId1,
  name: emailLocal(aliasOverflowGroupEmail),
  members: [workmailUser1.entityId]};

const aliasOverflowListing: WorkmailListing = {
  groups: [{entity: aliasOverflowGroup, aliases: [aliasFoo]}],
  users: [
    {entity: workmailUser1, aliases: [aliasBar, aliasBaz]},
    {entity: workmailUser2, aliases: []}]};

const aliases1Group: AliasesFileAlias[] = [{alias: emailLocal(aliasFoo), localEmails: [emailLocal(user1), emailLocal(user2)]}];

const overflowingAliases = [
  {alias: emailLocal(aliasFoo), localEmails: [emailLocal(user1)]},
  {alias: emailLocal(aliasBar), localEmails: [emailLocal(user1)]},
  {alias: emailLocal(aliasBaz), localEmails: [emailLocal(user1)]}
];

function mockWorkmail(): WorkmailUpdate {
  const createAlias: (entityId: GroupEntityId | UserEntityId, alias: Email) => Promise<void> =
    jest.fn().mockReturnValue(Promise.resolve());

  const deleteAlias: (entityId: GroupEntityId | UserEntityId, alias: Email) => Promise<void> =
    jest.fn().mockReturnValue(Promise.resolve());

  const removeGroup: (groupEntityId: GroupEntityId) => Promise<void> =
    jest.fn().mockReturnValue(Promise.resolve());

  const associateMemberToGroup: (groupEntityId: GroupEntityId, userEntityId: UserEntityId) => Promise<void> =
    jest.fn().mockReturnValue(Promise.resolve());

  const addGroup: (name: string, email: Email) => Promise<GroupEntityId> =
    jest.fn().mockReturnValueOnce(Promise.resolve(groupEntityId1));

  return {
    createAlias, deleteAlias, removeGroup, associateMemberToGroup, addGroup
  };
}

describe('The synchronization mechanism', () => {

  it('Accepts empty data and does nothing', () => {
    const update = mockWorkmail();
    const emptyWorkmailListing: WorkmailListing = {groups: [], users: []};
    return Synchronize.synchronize(config, aliases, emptyWorkmailListing, update)
      .then((listing) => {
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
    const aliases = [{alias: emailLocal(aliasFoo), localEmails: [emailLocal(user1)]}];
    return Synchronize.synchronize(config, aliases, minimalWorkmailListing, update)
      .then((listing) => {
        expect(update.createAlias).toBeCalledTimes(1);
        expect(update.deleteAlias).toBeCalledTimes(0);
        expect(update.removeGroup).toBeCalledTimes(0);
        expect(update.associateMemberToGroup).toBeCalledTimes(0);
        expect(update.addGroup).toBeCalledTimes(0);
        const aliasAddedListing: WorkmailListing = {groups: [], users: [{entity: workmailUser1, aliases: [aliasFoo]}]};
        expect(listing).toStrictEqual(aliasAddedListing);
      });
  });

  it('Adds one group', () => {
    const update = mockWorkmail();
    return Synchronize.synchronize(config, aliases1Group, twoUserWorkmailListing, update)
      .then((listing) => {
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
    return Synchronize.synchronize(config, aliases, listingWith1Group, update)
      .then((listing) => {
        expect(update.createAlias).toBeCalledTimes(0);
        expect(update.deleteAlias).toBeCalledTimes(0);
        expect(update.removeGroup).toBeCalledTimes(1);
        expect(update.associateMemberToGroup).toBeCalledTimes(0);
        expect(update.addGroup).toBeCalledTimes(0);
        expect(listing).toStrictEqual(twoUserWorkmailListing);
      });
  });

  it('Adds overflowing aliases, removes 1 group', () => {
    const update = mockWorkmail();

    return Synchronize.synchronize(config, overflowingAliases, listingWith1Group, update)
      .then((listing) => {
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
    return Synchronize.synchronize(config, aliases1Group, aliasOverflowListing, update)
      .then((listing) => {
        expect(update.createAlias).toBeCalledTimes(0);
        expect(update.deleteAlias).toBeCalledTimes(3); // TODO: No need to remove aliases from a group to be deleted
        expect(update.removeGroup).toBeCalledTimes(1);
        expect(update.associateMemberToGroup).toBeCalledTimes(2);
        expect(update.addGroup).toBeCalledTimes(1);
        expect(listing).toStrictEqual(listingWith1Group);
      });
  });
});

