import * as AWS from 'aws-sdk'

console.log("Script starting");

AWS.config.setPromisesDependency(null); 

export interface ManagementScriptConfig {
  workmailOrganizationId: string
}

import {readFileSync} from 'fs';

export function loadConfiguration(): ManagementScriptConfig {
  const data = readFileSync("./management-script-config.json")
  return JSON.parse(data.toString()) as ManagementScriptConfig
}

const workmail = new AWS.WorkMail({endpoint: "https://workmail.eu-west-1.amazonaws.com"});

workmail.config.loadFromPath("./aws-sdk-config.json")

const scriptConfig = loadConfiguration()

async function main() {
  const foo = await workmail.listUsers({OrganizationId: scriptConfig.workmailOrganizationId}).promise()
  console.log(foo)
}

main()
