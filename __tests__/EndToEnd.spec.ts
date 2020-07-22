import { emailFrom, emailString, emailLocal, Email } from '../src/Email';
import { WorkmailUpdate } from '../src/AwsWorkMailUtil';
import { GroupEntityId, UserEntityId, groupEntityIdString, userEntityIdString, groupEntityId, WorkmailListing, WorkmailUser, userEntityId } from '../src/WorkmailMap';
import { EmailUser } from '../src/EmailMap';
import * as Synchronize from '../src/Synchronize';
import { AliasesFileAlias } from '../src/AliasesFile';

const domain = "domain";
const user1 = emailFrom("user1", domain);
const user2 = emailFrom("user2", domain);
const aliasFoo = emailFrom("foo", domain);

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
    jest.fn().mockReturnValue(Promise.reject("not implemented"));

  return {
    createAlias, deleteAlias, removeGroup, associateMemberToGroup, addGroup
  };
}

const config: Synchronize.Config = {
  aliasesFileDomain: domain,
  localEmailUserToEmail: {"user1": emailString(user1), "user2": emailString(user2)},
  groupPrefix: "prefix",
  aliasLimit: 2
};

const aliases: AliasesFileAlias[] = [];

const user1EntityId = userEntityId("user1EntityId");

const workmailUser1: WorkmailUser = {kind: 'WorkmailUser', entityId: user1EntityId, name: "User1Name", email: user1};

const update = mockWorkmail();
const minimalWorkmailListing: WorkmailListing = {groups: [], users: [{entity: workmailUser1, aliases: []}]};

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
        expect(Object.keys(listing.groups).length).toStrictEqual(0);
        const aliasAddedListing: WorkmailListing = {groups: [], users: [{entity: workmailUser1, aliases: [aliasFoo]}]};
        expect(Object.keys(listing.users).length).toStrictEqual(aliasAddedListing);
      });
  });
});

