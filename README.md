# AWS-WorkMail-Aliases-Sync

* /etc/aliases AWS WorkMail sync tool

NOTE: This version is a work in progress and should not be used.
The goal of this project is to synchronize a traditional /etc/aliases
style file to AWS WorkMail Groups and Aliases. 

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
+ `prettier` - run prettier on source files

## About the original boilerplate, copyright and the license

This project is copyrighted to Peter Lamberg (pgithub@pelam.fi)
and can be used under the [GNU AFFERO GENERAL PUBLIC LICENSE, Version 3](GNU-AGPL-3-0-LICENSE).
If this license is problematic for you, I'm open to changing it.


Note that the [node-typescript-boilerplate](https://github.com/jsynowiec/node-typescript-boilerplate) served
as a starting point for this project. The unmodified parts present in that boilerplate project
remain under their original copyright and License APLv2. See the [APACHE-2-LICENSE](https://github.com/jsynowiec/node-typescript-boilerplate/blob/master/LICENSE) file for details.

## Random links used as reference
  * [AWS NodeJS Samples, basic configuration](https://github.com/aws-samples/aws-nodejs-sample#basic-configuration)
  * [AWS SDK for Javascript, Developer Guide, Loading Credentials from a file](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-json-file.html)
  * [AWS NodeJS Samples, S3 sample.js](https://github.com/aws-samples/aws-nodejs-sample/blob/master/sample.js)
  * [AWS Javascript SDK docs, WorkMail](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/WorkMail.html)
  * [AWS Docs, API Reference, WorkMail, AssociateMemberToGroup](https://docs.aws.amazon.com/workmail/latest/APIReference/API_AssociateMemberToGroup.html)
  * [AWS Docs, Code Samples for TypeScript page](https://docs.aws.amazon.com/code-samples/latest/catalog/code-catalog-typescript.html)
  * [SO answer, How to read JSON safely in TypeScript](https://stackoverflow.com/a/52591988/1148030)
