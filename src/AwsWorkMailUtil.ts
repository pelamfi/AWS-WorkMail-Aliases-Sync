import * as AWS from 'aws-sdk';

export interface Workmail {
  readonly service: AWS.WorkMail;
  readonly organizationId: string;
}
