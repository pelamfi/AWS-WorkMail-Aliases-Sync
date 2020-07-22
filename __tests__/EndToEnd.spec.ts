import { emailFrom, Email } from '../src/Email';
import { WorkmailUpdate } from '../src/AwsWorkMailUtil';
import { GroupEntityId, UserEntityId, groupEntityIdString, userEntityIdString, groupEntityId, WorkmailListing } from '../src/WorkmailMap';
import { EmailUser } from '../src/EmailMap';
import * as Synchronize from '../src/Synchronize';
import { AliasesFileAlias } from '../src/AliasesFile';

const userEmail1 = emailFrom('user1@bar');
const userEmail2 = emailFrom('user2@bar');
const email1 = emailFrom('foo@bar');
const user1: EmailUser = { kind: 'EmailUser', email: userEmail1 };
const user2: EmailUser = { kind: 'EmailUser', email: userEmail2 };

function mockWorkmail(): WorkmailUpdate {
  function createAlias(entityId: GroupEntityId | UserEntityId, alias: Email) {
    return Promise.resolve()
  }

  function deleteAlias(entityId: GroupEntityId | UserEntityId, alias: Email) {
    return Promise.resolve()
  }

  function removeGroup(groupEntityId: GroupEntityId) {
    return Promise.resolve()
  }

  function associateMemberToGroup(groupEntityId: GroupEntityId, userEntityId: UserEntityId) {
    return Promise.resolve()
  }

  function addGroup(name: string, email: Email): Promise<GroupEntityId> {
    return Promise.reject("foo")
  }

  return {
    createAlias, deleteAlias, removeGroup, associateMemberToGroup, addGroup
  };
}


const config: Synchronize.Config = {
  aliasesFileDomain: "domain",
  localEmailUserToEmail: {"foo": "foo@domain", "bar": "bar@domain"},
  groupPrefix: "prefix",
  aliasLimit: 2
};

const aliases: AliasesFileAlias[] = [];

const currentWorkmailListing: WorkmailListing = {groups: [], users: []};

const update = mockWorkmail();

describe('End to end test with mocked WorkMail', () => {
  it('accepts empty data', () => {
    return Synchronize.synchronize(config, aliases, currentWorkmailListing, update)
      .then((listing) => {
        expect(Object.keys(listing.groups).length).toStrictEqual(0);
        expect(Object.keys(listing.users).length).toStrictEqual(0);
      });
  });
});

