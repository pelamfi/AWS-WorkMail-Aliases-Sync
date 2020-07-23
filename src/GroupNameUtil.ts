import { Email, emailString } from './Email';

export interface GroupNameConfig {
  groupPrefix: string;
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
  return config.groupPrefix + '-' + emailString(email);
}
