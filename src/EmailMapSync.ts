import { EmailOperation, AddGroupMember } from './EmailOperation';
import * as R from 'ramda';
import { filterUndef } from './UndefUtil';
import { EmailMap, EmailGroup } from './EmailMap';
import { emailFrom, emailFromString, emailString, Email } from './Email';

function groupsEqual(a: EmailGroup, b: EmailGroup): boolean {
  const aMemberEmails = a.members.map((x) => x.email).sort();
  const bMemberEmails = b.members.map((x) => x.email).sort();
  return (
    a.email == b.email &&
    a.name == b.name &&
    R.equals(aMemberEmails, bMemberEmails)
  );
}

export function emailMapSync(
  currentMap: EmailMap,
  targetMap: EmailMap,
): EmailOperation[] {

  const removals = removalOperations(currentMap, targetMap)
  const additions = additionOperations(targetMap, currentMap);

  return [...removals, ...additions];
}

function removalOperations(currentMap: EmailMap, targetMap: EmailMap): EmailOperation[] {
  return filterUndef(
    R.keys(currentMap)
      .map(emailFromString)
      .map(removalOperation(currentMap, targetMap)))
    .sort(operationOrder);
}

const operationKindOrder = ['RemoveGroupAlias', 'RemoveGroup', 'RemoveUserAlias', 'AddGroup', 'AddGroupMember', 'AddGroupAlias', 'AddUserAlias']

function operationOrder(a: EmailOperation, b: EmailOperation) {
  return operationKindOrder.indexOf(a.kind) - operationKindOrder.indexOf(b.kind)
}

function removalOperation(currentMap: EmailMap, targetMap: EmailMap): (value: Email) => EmailOperation | undefined {
  return (email) => {
    const current = currentMap[emailString(email)];
    const target = targetMap[emailString(email)];

    if (current === undefined) {
      return undefined;
    }

    const differentKinds = current.kind != target?.kind;

    if (current.kind == 'EmailGroupAlias' &&
      ((target?.kind == 'EmailGroupAlias' &&
        target?.group.email != current.group.email) ||
        differentKinds)) {
      return { kind: 'RemoveGroupAlias', alias: current };
    }
    else if (current.kind == 'EmailGroup' &&
      (target === undefined ||
        target.kind !== 'EmailGroup' || // TODO: We could update the group members
        !groupsEqual(current, target))) {
      return { kind: 'RemoveGroup', group: current };
    }
    else if (current.kind == 'EmailUserAlias' &&
      ((target?.kind == 'EmailUserAlias' &&
        target?.user.email != current.user.email) ||
        differentKinds)) {
      return { kind: 'RemoveUserAlias', alias: current };
    }
    else if (current.kind == 'EmailUser' &&
      target !== undefined &&
      ((target.kind == 'EmailUser' &&
        target.email != current.email) ||
        differentKinds)) {
      throw `Email ${current.email} is configured as ${current.kind}. Removing/changing the user is currently not supported. Please fix manually. It is expected to be ${target.kind} ${target.email}`; // can this happen?
    }

    return undefined;
  };
}

function additionOperations(targetMap: EmailMap, currentMap: EmailMap): EmailOperation[] {
  return filterUndef(R.flatten(
    R.keys(targetMap)
      .map(emailFromString)
      .map(additionOperation(targetMap, currentMap))))
    .sort(operationOrder);
}

function additionOperation(targetMap: EmailMap, currentMap: EmailMap): (value: Email, index: number, array: Email[]) => EmailOperation[] | undefined {
  return (email) => {
    const target = targetMap[emailString(email)];
    const current = currentMap[emailString(email)];
    const differentKinds = target.kind != current?.kind;
    switch (target.kind) {
    case 'EmailGroupAlias':
      if (differentKinds ||
          (current.kind == 'EmailGroupAlias' &&
            current.group.email != target.group.email)) {
        return [{ kind: 'AddGroupAlias', alias: target }];
      }
      break;
    case 'EmailUserAlias':
      if (differentKinds ||
          (current.kind == 'EmailUserAlias' &&
            current.user.email != target.user.email)) {
        return [{ kind: 'AddUserAlias', alias: target }];
      }
      break;
    case 'EmailGroup':
      if (differentKinds ||
          current.kind !== 'EmailGroup' ||
          !groupsEqual(current, target)) {
        const group: EmailGroup = target;
        const members: AddGroupMember[] = target.members.map((member) => ({
          kind: 'AddGroupMember',
          group,
          member,
        }));
        return [{ kind: 'AddGroup', group }, ...members];
      }
      break;
    default:
      if (current == undefined || differentKinds) {
        throw `unsupported, can't currently add ${target.kind}`;
      }
    }
    return undefined;
  };
}

