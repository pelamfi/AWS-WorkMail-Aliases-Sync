import { awsMapSync } from '../src/AwsMapSync';
import { AwsEmailMap } from '../src/AwsEmailMap';

describe('Synchronizing 2 AwsMaps', () => {
  it('accepts empty data', () => {
    expect(awsMapSync({}, {})).toStrictEqual([]);
  });

  it('creates alias', () => {
    let current: AwsEmailMap = {}
    let target: AwsEmailMap = {"foo@bar": {kind: "AwsUserAlias", email: "foo@bar", userEntityId: "eid"}}
    let expected = [{kind: "AddUserAlias", userEntityId: "eid", aliasEmail: "foo@bar"}]
    expect(awsMapSync(current, target)).toStrictEqual(expected);
  });

  it('removes alias', () => {
    let current: AwsEmailMap = {"foo@bar": {kind: "AwsUserAlias", email: "foo@bar", userEntityId: "eid"}}
    let target: AwsEmailMap = {}
    let expected = [{kind: "RemoveUserAlias", userEntityId: "eid", aliasEmail: "foo@bar"}]
    expect(awsMapSync(current, target)).toStrictEqual(expected);
  });
  it('creates alias', () => {
    let current: AwsEmailMap = {}
    let target: AwsEmailMap = {"foo@bar": {kind: "AwsUserAlias", email: "foo@bar", userEntityId: "eid"}}
    let expected = [{kind: "AddUserAlias", userEntityId: "eid", aliasEmail: "foo@bar"}]
    expect(awsMapSync(current, target)).toStrictEqual(expected);
  });

  it('removes and creates same alias for another user', () => {
    let current: AwsEmailMap = {"foo@bar": {kind: "AwsUserAlias", email: "foo@bar", userEntityId: "eid1"}}
    let target: AwsEmailMap = {"foo@bar": {kind: "AwsUserAlias", email: "foo@bar", userEntityId: "eid2"}}
    let expected = [{kind: "RemoveUserAlias", userEntityId: "eid1", aliasEmail: "foo@bar"}, {kind: "AddUserAlias", userEntityId: "eid2", aliasEmail: "foo@bar"}]
    expect(awsMapSync(current, target)).toStrictEqual(expected);
  });

  it('Does not do anything if alias is already there for correct user', () => {
    let current: AwsEmailMap = {"foo@bar": {kind: "AwsUserAlias", email: "foo@bar", userEntityId: "eid"}}
    let target: AwsEmailMap = {"foo@bar": {kind: "AwsUserAlias", email: "foo@bar", userEntityId: "eid"}}
    let expected = []
    expect(awsMapSync(current, target)).toStrictEqual(expected);
  });

})
