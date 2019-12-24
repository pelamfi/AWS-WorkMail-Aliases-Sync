import * as AWS from 'aws-sdk'
import * as ScriptConfig from './ScriptConfig'
import * as AliasesFileParse from '../src/AliasesFileParse';
import * as Alias from '../src/Alias';
import { readFileSync } from 'fs';
import * as R from 'ramda';

console.log("Script starting, configuring AWS");

AWS.config.setPromisesDependency(null);
AWS.config.loadFromPath("./aws-sdk-config.json")
const workmail = new AWS.WorkMail({ endpoint: "https://workmail.eu-west-1.amazonaws.com" });

const scriptConfig = ScriptConfig.load()

export function aliasesFromFile(): Alias.AliasesFile {
  console.log(`Parsing file: ${scriptConfig.aliasesFile}`)
  const result = AliasesFileParse.parse(readFileSync(scriptConfig.aliasesFile).toString())
  if (result instanceof AliasesFileParse.ParseError) {
    throw `Error parsing ${scriptConfig.aliasesFile}: ${result.error}`
  } else {
    return result
  }
}

async function main() {
  const aliases = aliasesFromFile()
  const aliasesPerUser = Alias.aliasesPerUser(aliases)

  console.log("Reading users and aliases from AWS WorkMail")

  const users = await workmail.listUsers({ OrganizationId: scriptConfig.workmailOrganizationId }).promise()

  users.Users.forEach(async (user) => {
    let localUser = scriptConfig.emailToLocalEmail[user.Email]
    if (localUser == undefined) {
      console.log(`Ignoring user ${user.Email} ${user.Name} that is not present in emailToLocalEmail dictionary in ${ScriptConfig.configFile}`)
    } else {

      const fileAliases = aliasesPerUser.users.find(aliases => aliases.localEmail == localUser)
    
      if (fileAliases == undefined) {
        console.log("  No aliases defined in aliases file for ${localUser}. skipping")
      } else {
        const currentAliasesResponse = await workmail.listAliases({ EntityId: user.Id, OrganizationId: scriptConfig.workmailOrganizationId }).promise()
        const currentAliases = currentAliasesResponse.Aliases.sort()
        const fileAliasesThatDontExist = R.difference(fileAliases.aliases, currentAliases).sort()
        const fileAliasesThatExist = R.intersection(fileAliases.aliases, currentAliases).sort()
        const aliasesThatDontExistInFile = R.difference(currentAliases, fileAliases.aliases).sort()
        console.log(`user ${user.Email} ${user.Name} is mapped to ${localUser} in ${ScriptConfig.configFile}`)
        console.log(`  aliases to be added: ${fileAliasesThatDontExist.join(",")}`)
        console.log(`  aliases to be removed: ${aliasesThatDontExistInFile.join(",")}`)
        console.log(`  ok aliases: ${fileAliasesThatExist.join(",")}`)
      }


    }
  })
}

main()
