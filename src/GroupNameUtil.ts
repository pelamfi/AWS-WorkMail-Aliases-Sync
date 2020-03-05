import { Email } from './Email';

export interface Config {
  groupPrefix: string;
}

// Looks like a name made with the generatedGroupName function below.
export function isGeneratedGroupName(
  groupName: string,
  config: Config,
): boolean {
  return groupName.startsWith(config.groupPrefix + '-');
}

// Default group name based on email address.
export function generateGroupName(email: Email, config: Config) {
  return config.groupPrefix + '-' + email.local;
}
