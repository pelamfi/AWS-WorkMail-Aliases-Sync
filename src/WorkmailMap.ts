import * as AWS from 'aws-sdk';
import { EmailMap } from './EmailMap';
import { Email } from './Email';

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
  readonly entityId: AWS.WorkMail.WorkMailIdentifier;
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
