import { Email } from './Email';

// EmailMap and its item types model email aliases and users.
export type EmailMap = { readonly [index: string]: EmailItem };

export type EmailItem =
  | EmailUser
  | EmailUserAlias
  | EmailGroup
  | EmailGroupAlias;

export interface EmailUser {
  readonly kind: 'EmailUser';
  readonly email: Email;
}

export interface EmailUserAlias {
  readonly kind: 'EmailUserAlias';
  readonly user: EmailUser;
  readonly email: Email;
}

export interface EmailGroup {
  readonly kind: 'EmailGroup';
  readonly name: string;
  readonly email: Email;
  readonly members: EmailUser[];
}

export interface EmailGroupAlias {
  readonly kind: 'EmailGroupAlias';
  readonly group: EmailGroup;
  readonly email: Email;
}
