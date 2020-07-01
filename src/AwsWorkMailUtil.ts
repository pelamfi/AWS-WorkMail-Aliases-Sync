import * as AWS from 'aws-sdk';
import { Config } from './ScriptConfig';

export interface Workmail {
    readonly service: AWS.WorkMail;
    readonly organizationId: string;
}
  
export function openWorkmail(scriptConfig: Config) {
    configureAws(scriptConfig);
  
    return {
      service: createWorkmailService(scriptConfig),
      organizationId: scriptConfig.workmailOrganizationId,
    };
}

function configureAws(scriptConfig: Config) {
  console.log('Configuring the AWS connection.')

  AWS.config.setPromisesDependency(null);
  AWS.config.loadFromPath(scriptConfig.awsConfigFile);
}

function createWorkmailService(scriptConfig: Config): AWS.WorkMail {
    return new AWS.WorkMail({
        endpoint: scriptConfig.workmailEndpoint,
    });
}

