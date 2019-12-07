"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

const tslib_1 = require("tslib");
const Workmail = require("aws-sdk/clients/workmail");
const aws = require("aws-sdk");

const fs = require("fs");
function loadConfiguration() {
    const data = fs.readFileSync("./management-script-config.json");
    return JSON.parse(data.toString());
}

const workmail = new Workmail({endpoint: "https://workmail.eu-west-1.amazonaws.com"});

workmail.config.loadFromPath("./aws-sdk-config.json");

const config = loadConfiguration();
function foo() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const foo = yield workmail.listUsers({ OrganizationId: config.workmailOrganizationId }).promise();
        console.log(foo);
    });
}

aws.config.setPromisesDependency(null);

foo();

