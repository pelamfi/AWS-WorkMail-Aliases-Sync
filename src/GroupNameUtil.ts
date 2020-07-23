import { Email, emailLocal } from './Email';

export interface GroupNameConfig {
  readonly groupPrefix: string;
}

// Looks like a name made with the generatedGroupName function below.
export function isGeneratedGroupName(
  groupName: string,
  config: GroupNameConfig,
): boolean {
  return groupName.startsWith(config.groupPrefix + '-');
}

// Default group name based on email address.
export function generateGroupName(email: Email, config: GroupNameConfig) {
  return config.groupPrefix + '-' + emailLocal(email);
}

export function generateWorkaroundGroupName(
  email: Email,
  groupIndex: number,
  config: GroupNameConfig,
) {
  return `${config.groupPrefix}-alias-${emailLocal(email)}-${groupIndex}`;
}
