import * as AWS from 'aws-sdk'
import * as ScriptConfig from './ScriptConfig'
import * as AliasesFileParse from '../src/AliasesFileParse';
import * as Alias from '../src/Alias';
import { readFileSync } from 'fs';
import * as R from 'ramda';
import {emailDomain, emailLocal} from '../src/EmailUtil'

console.log("Script starting, configuring AWS");

AWS.config.setPromisesDependency(null);
AWS.config.loadFromPath("./aws-sdk-config.json")
let workmail = new AWS.WorkMail({ endpoint: "https://workmail.eu-west-1.amazonaws.com" });

let scriptConfig = ScriptConfig.load()

export function aliasesFromFile(): Alias.AliasesFile {
  console.log(`Parsing file: ${scriptConfig.aliasesFile}`)
  let result = AliasesFileParse.parse(readFileSync(scriptConfig.aliasesFile).toString())
  if (result instanceof AliasesFileParse.ParseError) {
    throw `Error parsing ${scriptConfig.aliasesFile}: ${result.error}`
  } else {
    return result
  }
}

async function main() {
  let aliases = aliasesFromFile().aliases.filter(alias => alias.localEmails.length == 1)
  let groups = aliasesFromFile().aliases.filter(alias => alias.localEmails.length > 1)
  let aliasesPerUser = Alias.aliasesPerUser(aliases).users

  console.log(`Syncing users and aliases from with AWS WorkMail:\n` + 
    `  Using configuration file: ${ScriptConfig.configFile}\n` +
    `  WorkMail organizationId: ${scriptConfig.workmailOrganizationId}\n` +
    `  aliases file to sync with: ${scriptConfig.aliasesFileDomain}\n` +
    `  domain: ${scriptConfig.aliasesFileDomain}`)

  let currentUsersResponse = await workmail.listUsers({ OrganizationId: scriptConfig.workmailOrganizationId }).promise()
  let currentGroupsResponse = await workmail.listGroups({ OrganizationId: scriptConfig.workmailOrganizationId }).promise()
  let currentGroups = currentGroupsResponse.Groups
  let currentUsers = currentUsersResponse.Users

  currentUsers.forEach(async (user) => {
    let localUser = scriptConfig.emailToLocalEmail[user.Email]
    if (localUser == undefined) {
      console.log(`Ignoring user ${user.Email} ${user.Name} that is not present in emailToLocalEmail dictionary in configuration file`)
    } else {

      let fileAliases = aliasesPerUser.find(aliases => aliases.localEmail == localUser)
      
      function aliasToEmail(alias: string): string { return `${alias}@${scriptConfig.aliasesFileDomain}` }

      if (fileAliases == undefined) {
        console.log(`  No aliases defined in aliases file for ${localUser}. skipping`)
      } else {
        let fileAliasesAsEmails = fileAliases.aliases.map(aliasToEmail)
        let currentAliasesResponse = await workmail.listAliases({ EntityId: user.Id, OrganizationId: scriptConfig.workmailOrganizationId }).promise()

        let currentAliases = currentAliasesResponse.Aliases.filter(alias => emailDomain(alias) == scriptConfig.aliasesFileDomain).sort()
        let aliasesToAdd = R.difference(fileAliasesAsEmails, currentAliases).sort()
        let okAliases = R.intersection(fileAliasesAsEmails, currentAliases).sort()
        let aliasesToRemove = R.difference(currentAliases, fileAliasesAsEmails).sort()

        console.log(`user ${user.Email} ${user.Name} is mapped to ${localUser} in ${ScriptConfig.configFile}`)
        console.log(`  aliases to be added (${aliasesToAdd.length}): ${aliasesToAdd.map(emailLocal).join(", ")}`)
        console.log(`  aliases to be removed (${aliasesToRemove.length}): ${aliasesToRemove.map(emailLocal).join(", ")}`)
        console.log(`  ok aliases ${okAliases.length}`)

        

        let addAliasesRequests: AWS.Request<any, AWS.AWSError>[] =
          aliasesToAdd
          .map(alias => {
            let request = {OrganizationId: scriptConfig.workmailOrganizationId, EntityId: user.Id, Alias: alias}
            return workmail.createAlias(request)
          })
          
        let removeAliasesRequests: AWS.Request<any, AWS.AWSError>[] =
          aliasesToRemove
          .map(alias => {
            let request = {OrganizationId: scriptConfig.workmailOrganizationId, EntityId: user.Id, Alias: alias}
            return workmail.deleteAlias(request)
          })

        let initial = Promise.resolve<void>(undefined)
        let serialPromises = R.concat(removeAliasesRequests, addAliasesRequests).reduce((a, b) => a.then(() => b.promise()), initial)

        await serialPromises.catch(error => console.log(`Error updating AWS WorkMail for user ${user.Email}: ${error}`))
        
      }


    }
  })
}

main()
