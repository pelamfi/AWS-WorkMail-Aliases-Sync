# AWS-WorkMail-Aliases-Sync

This project provides a way to sync a traditional UNIX `/etc/aliases` file
to AWS WorkMail email service. I developed this to help with my own personal
migration from Exim based Email system to AWS WorkMail.

This program can be used to upload a legacy `aliases`-file as a one
shot operation or as I personally plan to use it, as a user interface
to managing groups and aliases on the AWS WorkMail. Idea here is that
I to change aliases or groups I first edit my `aliases`-file and then
run the program to synchronize the changes to AWS WorkMail.

## How it works

The following steps describe the basic operation of this program:

  1. reads its configuration files specifying an AWS WorkMail organization and other details
  2. scans the WorkMail user, group and aliases data
  3. parses an `/etc/aliases` style file
  4. computes a sequence of operations to modify the AWS WorkMail to match the aliases file
  5. executes the operations on the AWS WorkMail organization
    * Removing groups
    * Adding groups
    * Removing aliases from users and groups
    * Adding aliases to users and groups
    * (Note that the program does not add/remove users)

Note that this "synchronization behavior" of this program means that
it will delete groups and aliases that are not in the input `aliases`
file. Consider this when making WorkMail changes manually between
runs of the script.

### AWS WorkMail 100 alias limit

WorkMail has a limit of maximum of 100 aliases per email user.
This program has a workaround for this limit, in which it creates
groups with just 1 user and adds the additional aliases to that group.
The program acts as if the alias limit is 80 to allow manually adding
aliases. (Note: that manually added aliases will be removed if the program
is run again with the same input file.)
>>>>>>> 2216ad7... Adding documentation to README.md

## Quick start

This project is intended to be used with the latest Active LTS release of [Node.js][nodejs]. 

To start you need to install dependencies using the following command:
```sh
npm install
```

The code is in the `src` and tests are in the `__tests__` directory.

## Project setup:

+ [TypeScript][typescript] [3.7][typescript-37],
+ [TSLint][tslint] with [Microsoft rules][tslint-microsoft-contrib],
+ [Jest][jest] unit testing and code coverage,
+ Type definitions for Node.js and Jest,
+ [Prettier][prettier] to enforce a consistent code style,
+ [NPM scripts for common operations](#available-scripts),
+ a simple example of TypeScript code and unit test,
+ .editorconfig for consistent file format.

## Available scripts

+ `clean` - remove coverage data, Jest cache and transpiled files,
+ `build` - transpile TypeScript to ES6,
+ `build:watch` - interactive watch mode to automatically transpile source files,
+ `lint` - lint source files and tests,
+ `test` - run tests,
+ `test:watch` - interactive watch mode to automatically re-run tests
+ `prettier` - run Prettier on the source files

## About the original boilerplate, copyright and the license

This project is copyrighted to Peter Lamberg (pgithub@pelam.fi)
and can be used under the [GNU AFFERO GENERAL PUBLIC LICENSE, Version 3](GNU-AGPL-3-0-LICENSE).
If this license is problematic for you, I'm open to changing it.

Note that the [node-typescript-boilerplate](https://github.com/jsynowiec/node-typescript-boilerplate) served
as a starting point for this project. The unmodified parts present in that boilerplate project
remain under their original copyright and License APLv2. See the [APACHE-2-LICENSE](https://github.com/jsynowiec/node-typescript-boilerplate/blob/master/LICENSE) file for details.

## Random links used as a reference
  * [AWS NodeJS Samples, basic configuration](https://github.com/aws-samples/aws-nodejs-sample#basic-configuration)
  * [AWS SDK for Javascript, Developer Guide, Loading Credentials from a file](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-json-file.html)
  * [AWS NodeJS Samples, S3 sample.js](https://github.com/aws-samples/aws-nodejs-sample/blob/master/sample.js)
  * [AWS Javascript SDK docs, WorkMail](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/WorkMail.html)
  * [AWS Docs, API Reference, WorkMail, AssociateMemberToGroup](https://docs.aws.amazon.com/workmail/latest/APIReference/API_AssociateMemberToGroup.html)
  * [AWS Docs, Code Samples for TypeScript page](https://docs.aws.amazon.com/code-samples/latest/catalog/code-catalog-typescript.html)
  * [SO answer, How to read JSON safely in TypeScript](https://stackoverflow.com/a/52591988/1148030)
