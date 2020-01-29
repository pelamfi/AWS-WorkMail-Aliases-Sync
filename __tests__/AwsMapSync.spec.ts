import { awsMapSync } from '../src/AwsMapSync';
import { EmailMap, EmailAddr, EmailUser } from '../src/EmailMap';
import { EmailOperation } from '../src/EmailOperation';

let userEmail1 = new EmailAddr("user1@bar")
let userEmail2 = new EmailAddr("user2@bar")
let email1 = new EmailAddr("foo@bar")
let user1: EmailUser = { kind: "EmailUser", email: userEmail1 }
let user2: EmailUser = { kind: "EmailUser", email: userEmail2 }

describe('Synchronizing 2 AwsMaps', () => {
  it('accepts empty data', () => {
    expect(awsMapSync({}, {})).toStrictEqual([]);
  });

  it('creates alias', () => {
    let current: EmailMap = {}
    let target: EmailMap = {email1: {kind: "EmailUserAlias", email: email1, user: user1}}
    let expected: EmailOperation[] = [{kind: "AddUserAlias", alias: { kind: "EmailUserAlias", user: user1, email: email1 }}]
    expect(awsMapSync(current, target)).toStrictEqual(expected);
  });

  it('removes alias', () => {
    let current: EmailMap = {email1: {kind: "EmailUserAlias", email: email1, user: user1}}
    let target: EmailMap = {}
    let expected: EmailOperation[] = [{kind: "RemoveUserAlias", alias: { kind: "EmailUserAlias", user: user1, email: email1}}]
    expect(awsMapSync(current, target)).toStrictEqual(expected);
  });
  it('creates alias', () => {
    let current: EmailMap = {}
    let target: EmailMap = {email1: {kind: "EmailUserAlias", email: email1, user: user1}}
    let expected: EmailOperation[] = [{kind: "AddUserAlias", alias: { kind: "EmailUserAlias", user: user1, email: email1}}]
    expect(awsMapSync(current, target)).toStrictEqual(expected);
  });

  it('removes and creates same alias for another user', () => {
    let current: EmailMap = {email1: {kind: "EmailUserAlias", email: email1, user: user1}}
    let target: EmailMap = {email1: {kind: "EmailUserAlias", email: email1, user: user2}}
    let expected: EmailOperation[] = [
      {kind: "RemoveUserAlias", alias: { kind: "EmailUserAlias", user: user1, email: email1}}, 
      {kind: "AddUserAlias", alias: { kind: "EmailUserAlias", user: user2, email: email1}}]
    expect(awsMapSync(current, target)).toStrictEqual(expected);
  });

  it('Does not do anything if alias is already there for correct user', () => {
    let current: EmailMap = {email1: {kind: "EmailUserAlias", email: email1, user: user1}}
    let target: EmailMap = {email1: {kind: "EmailUserAlias", email: email1, user: user1}}
    let expected: EmailOperation[] = []
    expect(awsMapSync(current, target)).toStrictEqual(expected);
  });

})
