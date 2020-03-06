import * as AWS from 'aws-sdk';
import { EmailMap } from './EmailMap';
import { Email } from './Email';
// WorkmailMap includes an EmailMap and adds information about Workmail entitites
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
