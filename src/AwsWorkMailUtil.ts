import * as AWS from 'aws-sdk'

export interface Workmail {
  service: AWS.WorkMail,
  organizationId: string,
}
