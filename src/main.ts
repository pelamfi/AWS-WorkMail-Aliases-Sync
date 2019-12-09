import * as AWS from 'aws-sdk'
import * as ScriptConfig from './ScriptConfig'

console.log("Script starting, configuring AWS");

AWS.config.setPromisesDependency(null);
AWS.config.loadFromPath("./aws-sdk-config.json")
const workmail = new AWS.WorkMail({ endpoint: "https://workmail.eu-west-1.amazonaws.com" });

const scriptConfig = ScriptConfig.load()

async function main() {
  const foo = await workmail.listUsers({ OrganizationId: scriptConfig.workmailOrganizationId }).promise()
  console.log(foo)
}

main()
