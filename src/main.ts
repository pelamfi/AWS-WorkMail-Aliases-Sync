import { delayedHello } from './DelayedHello';

import AWS from 'aws-sdk'

console.log("Hello world!");

export interface ManagementScriptConfig {
  workmailOrganizationId: string
}

import fs from 'fs';

export function loadConfiguration(): ManagementScriptConfig {
  // https://stackoverflow.com/a/52591988/1148030
  const data = fs.readFileSync(".management-script-config.json")
  return JSON.parse(data.toString()) as ManagementScriptConfig
}

// https://github.com/aws-samples/aws-nodejs-sample#basic-configuration
// https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-json-file.html

// https://github.com/aws-samples/aws-nodejs-sample/blob/master/sample.js
// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/WorkMail.html
// https://docs.aws.amazon.com/workmail/latest/APIReference/API_AssociateMemberToGroup.html
// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/WorkMail.html
// https://docs.aws.amazon.com/code-samples/latest/catalog/code-catalog-typescript.html
const workmail = new AWS.WorkMail({endpoint: "workmail.undefined.amazonaws.com"});
workmail.config.loadFromPath("./aws-sdk-config.json")

const config = loadConfiguration()

async function foo() {
  const foo = await workmail.listUsers({OrganizationId: config.workmailOrganizationId}).promise()
  console.log(foo)
}


AWS.config.setPromisesDependency(null); 


async function asyncWrapper() {
  const hello = await delayedHello("delayed");
  console.log(hello)
}

asyncWrapper();
foo();