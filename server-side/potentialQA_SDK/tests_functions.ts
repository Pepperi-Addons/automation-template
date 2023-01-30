import { DataIndex } from '../tests/api_tests/DataIndex.test';
import { NebulaTest } from '../tests/api_tests/NebulaTest.test';

import { SchemaExtensions } from '../tests/api_tests/SchemaExtensions.test';
import GeneralService, { TesterFunctions } from '../potentialQA_SDK/server_side/general.service';
import { Client, Request } from '@pepperi-addons/debug-server';

import { TestDataTests } from '../potentialQA_SDK/server_side/serverInfra.index';
import fs from 'fs';
import { UsersTests } from '../tests/api_tests/Users.example.test';
import { DimxTests } from '../tests/api_tests/DimxTests.test';

import { AddonUUID as AddonUUIDFromAddonConfig } from '../../addon.config.json'; // TODO: remove, part of a temporarily fix

let testName = '';
let context = {};

export async function runTest(addonUUID: string, client: Client, request, testerFunctions: TesterFunctions) {
    if (addonUUID.length !== 36) {
        throw Error(`Error: ${addonUUID} Is Not A Valid Addon UUID`);
    }
    const functionNames = mapUuidToTestName(addonUUID);
    if (functionNames.length === 0) {
        throw Error(`Error: No Test For Addon UUID ${addonUUID} Is Existing`);
    }
    if (request.body.isLocal === undefined) {
        throw Error("Error: isLocal is Mandatory Field Inside Test Request Body");
    }
    // copy client object to avoid changing the original client object
    const addonService = Object.assign({}, client)
    if (request.body.isLocal === "true") {
        addonService.BaseURL = "http://localhost:4500";
    }
    for (let index = 0; index < functionNames.length; index++) {
        await context[functionNames[index]].apply(this, [client, addonService, request, testerFunctions]);
    }
    return;
}

function mapUuidToTestName(addonUUID: string): string[] {
    let allAddonMatchingNames: string[] = [];
    let addonUUIDMapper = JSON.parse(fs.readFileSync('./potentialQA_SDK/mapper.json', 'utf-8'));
    for (let [key, value] of Object.entries(addonUUIDMapper)) {
        if (value === addonUUID) {
            allAddonMatchingNames.push(camelToSnakeCase(key) as string);
        }
    }
    return allAddonMatchingNames;
}

function camelToSnakeCase(str) {
    return (str.split(/(?=[A-Z])/).join('_').toLowerCase());
}

//this function is infra function to print addon versions - DO NOT TOUCH
export async function test_data(client: Client, testerFunctions: TesterFunctions) {
    const service = new GeneralService(client);
    if (testName == '') {
        testName = 'Test_Data';
        service.PrintMemoryUseToLog('Start', testName);
        testerFunctions = service.initiateTesterFunctions(client, testName);
        const testResult = await Promise.all([await test_data(client, testerFunctions)]).then(() =>
            testerFunctions.run(),
        );
        service.PrintMemoryUseToLog('End', testName);
        testName = '';
        return testResult;
    } else {
        return TestDataTests(service, testerFunctions);
    }
}

/**
 * this is an example you can immediately run - a true full Automation test fromm the automation framework
 * all you have to do is take the 'Run local data_index test' from 'automation_assets/automation_template.postman_collection.json' & run via postman
 */
export async function users_example(client: Client, addonClient: Client, request: Request, testerFunctions: TesterFunctions) {
    const systemService = new GeneralService(client);
    const addonService = new GeneralService(addonClient);
    testName = 'ObjectUsers'; //printing your test name - done for logging
    systemService.PrintMemoryUseToLog('Start', testName);
    testerFunctions = systemService.initiateTesterFunctions(client, testName);
    await UsersTests(systemService, addonService, request, testerFunctions);//this is the call to YOUR test function
    await test_data(client, testerFunctions);//this is done to print versions at the end of test - can be deleted
    return (await testerFunctions.run());
};
context["object_users"] = users_example;


export async function schema_extensions(client: Client, addonClient: Client, request: Request, testerFunctions: TesterFunctions) {
    const service = new GeneralService(client);
    const serviceAddon = new GeneralService(addonClient);
    testName = 'SchemaExtensions'; //printing your test name - done for logging
    service.PrintMemoryUseToLog('Start', testName);
    testerFunctions = service.initiateTesterFunctions(client, testName);
    await SchemaExtensions(service, serviceAddon, request, testerFunctions);//this is the call to YOUR test function
    await test_data(client, testerFunctions);//this is done to print versions at the end of test - can be deleted
    return (await testerFunctions.run());
};

context["schema_extensions"] = schema_extensions;

export async function dimx_tests(client: Client, addonClient: Client, request: Request, testerFunctions: TesterFunctions) {
    const service = new GeneralService(client);
    const serviceAddon = new GeneralService(addonClient);
    testName = 'DimxTests'; //printing your test name - done for logging
    service.PrintMemoryUseToLog('Start', testName);
    testerFunctions = service.initiateTesterFunctions(client, testName);
    await DimxTests(service, serviceAddon, request, testerFunctions);//this is the call to YOUR test function
    await test_data(client, testerFunctions);//this is done to print versions at the end of test - can be deleted
    return (await testerFunctions.run());
};
context["dimx_tests"] = dimx_tests;

export async function data_index_where_clause(client: Client, addonClient: Client, request: Request, testerFunctions: TesterFunctions) {
    // TODO: remove next 3 lines, part of a temporarily fix
    client.AddonUUID = AddonUUIDFromAddonConfig;
    let tempService = new GeneralService(client);
    client.AddonSecretKey = tempService.getSecret()[1];


    const service = new GeneralService(client);
    const serviceAddon = new GeneralService(addonClient);
    testName = 'DataIndexWhereClause'; //printing your test name - done for logging
    service.PrintMemoryUseToLog('Start', testName);
    testerFunctions = service.initiateTesterFunctions(client, testName);
    await DataIndex(service, serviceAddon, request, testerFunctions);//this is the call to YOUR test function
    await test_data(client, testerFunctions);//this is done to print versions at the end of test - can be deleted
    return (await testerFunctions.run());
};
context["data_index_where_clause"] = data_index_where_clause;

export async function nebula_test(client: Client, addonClient: Client, request: Request, testerFunctions: TesterFunctions) {
    const service = new GeneralService(client);
    const serviceAddon = new GeneralService(addonClient);
    testName = 'NebulaTest'; //printing your test name - done for logging
    service.PrintMemoryUseToLog('Start', testName);
    testerFunctions = service.initiateTesterFunctions(client, testName);
    await NebulaTest(service, serviceAddon, request, testerFunctions);//this is the call to YOUR test function
    // await test_data(client, testerFunctions);//this is done to print versions at the end of test - can be deleted
    return (await testerFunctions.run());
};
context["nebula_test"] = nebula_test;
