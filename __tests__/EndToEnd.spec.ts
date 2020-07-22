import { emailFrom, emailString, emailLocal, Email } from '../src/Email';
import { WorkmailUpdate } from '../src/AwsWorkMailUtil';
import { GroupEntityId, WorkmailGroup, UserEntityId, groupEntityIdString, userEntityIdString, groupEntityId, WorkmailListing, WorkmailUser, userEntityId } from '../src/WorkmailMap';
import { EmailUser } from '../src/EmailMap';
import * as Synchronize from '../src/Synchronize';
import { AliasesFileAlias } from '../src/AliasesFile';

const domain = "domain";
const user1 = emailFrom("user1", domain);
const user2 = emailFrom("user2", domain);
const aliasFoo = emailFrom("foo", domain);

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

const update = mockWorkmail();

describe('End to end test with mocked WorkMail', () => {
  it('accepts empty data and does nothing', () => {
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
    const aliases: AliasesFileAlias[] = [{alias: emailLocal(aliasFoo), localEmails: [emailLocal(user1), emailLocal(user2)]}];
    return Synchronize.synchronize(config, aliases, twoUserWorkmailListing, update)
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
});

