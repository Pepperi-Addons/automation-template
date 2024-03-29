import { CoreResources } from '../server-side/tests/api_tests/CoreResources.test';
import { SchemasRequiringSyncTests } from '../server-side/tests/api_tests/SchemasRequiringSyncTests.test';
import { DataIndex } from './tests/api_tests/DataIndex.test';
import { NebulaTest } from './tests/api_tests/NebulaTest.test';
import { NebulaTestPart2 } from './tests/api_tests/NebulaTestPart2.test';
import { NebulaInternalTest } from './tests/api_tests/NebulaInternalTest.test';

import { SchemaExtensions } from './tests/api_tests/SchemaExtensions.test';
import { Client, Request } from '@pepperi-addons/debug-server';
import { JsonMapper } from "./potentialQA_SDK/src/mapper";
import { UsersTests } from './tests/api_tests/Users.example.test';
import { DimxTests } from './tests/api_tests/DimxTests.test';
import { AddonUUID as AddonUUIDFromAddonConfig } from '../addon.config.json'; // TODO: remove, part of a temporarily fix
import { GeneralService,TesterFunctions } from "./potentialQA_SDK/src/infra_services/general.service";
import { TestDataTests } from './tests/api_tests/test_data';
import { SyncTests } from './tests/api_tests/SyncTests.test';



let testName = '';
let context = {};

export async function runTest(addonUUID: string, nameOfTest: string, client: Client, request, testerFunctions: TesterFunctions) {
    let functionNames;
    if (addonUUID.length !== 36) {
        throw new Error(`Error: ${addonUUID} Is Not A Valid Addon UUID`);
    }
    if (nameOfTest === undefined) {
        functionNames = mapUuidToTestName(addonUUID);
        if (functionNames.length === 0) {
            throw new Error(`Error: No Test For Addon UUID ${addonUUID} Is Existing`);
        }
    } else {
        if (!doWeHaveSuchTest(nameOfTest)) {
            throw new Error(`Error: No Such Test ${nameOfTest} Is Existing`);
        }
    }
    if (request.body.isLocal === undefined) {
        throw new Error("Error: isLocal is Mandatory Field Inside Test Request Body");
    }
    // copy client object to avoid changing the original client object
    const addonService = Object.assign({}, client)
    if (request.body.isLocal === "true") {
        addonService.BaseURL = "http://localhost:4500";
    }
    if (nameOfTest) {
        let testsResult;
        testsResult = (await context[nameOfTest].apply(this, [client, addonService, request, testerFunctions]));
        return testsResult;
    } else {
        let testsResult: any[] = [];
        for (let index = 0; index < functionNames.length; index++) {
            testsResult.push(await context[functionNames[index]].apply(this, [client, addonService, request, testerFunctions]));
        }
        return testsResult;
    }
}

export function mapUuidToTestName(addonUUID: string): string[] {
    let allAddonMatchingNames: string[] = [];
    let addonUUIDMapper = JsonMapper;
    for (let [key, value] of Object.entries(addonUUIDMapper)) {
        if (value === addonUUID) {
            allAddonMatchingNames.push(camelToSnakeCase(key) as string);
        }
    }
    return allAddonMatchingNames;
}

export function doWeHaveSuchTest(testName: string): boolean {
    let addonUUIDMapper = JsonMapper;
    for (let [key, value] of Object.entries(addonUUIDMapper)) {
        if (camelToSnakeCase(key) === testName) {
            return true;
        }
    }
    return false;
}

function camelToSnakeCase(str) {
    const camel1 = str.split(/(?=[A-Z])/).join('_').toLowerCase();
    const camel2 = camel1.split(/(?=[0-9])/).join('_').toLowerCase();
    return camel2;
}

// this function is infra function to print addon versions - DO NOT TOUCH
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

export async function sync_tests(client: Client, addonClient: Client, request: Request, testerFunctions: TesterFunctions) {
    const service = new GeneralService(client);
    const serviceAddon = new GeneralService(addonClient)
    testName = 'SyncTests'; //printing your test name - done for logging
    service.PrintMemoryUseToLog('Start', testName);
    testerFunctions = service.initiateTesterFunctions(client, testName);
    await SyncTests(service, serviceAddon, request, testerFunctions)
    return (await testerFunctions.run());
};
context["sync_tests"] = sync_tests;

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
    await test_data(client, testerFunctions);//this is done to print versions at the end of test - can be deleted
    return (await testerFunctions.run());
};
context["nebula_test"] = nebula_test;

export async function nebula_test_part_2(client: Client, addonClient: Client, request: Request, testerFunctions: TesterFunctions) {
    const service = new GeneralService(client);
    const serviceAddon = new GeneralService(addonClient);
    testName = 'NebulaTest'; //printing your test name - done for logging
    service.PrintMemoryUseToLog('Start', testName);
    testerFunctions = service.initiateTesterFunctions(client, testName);
    await NebulaTestPart2(service, serviceAddon, request, testerFunctions);//this is the call to YOUR test function
    await test_data(client, testerFunctions);//this is done to print versions at the end of test - can be deleted
    return (await testerFunctions.run());
};
context["nebula_test_part_2"] = nebula_test_part_2;

export async function nebula_internal_test(client: Client, addonClient: Client, request: Request, testerFunctions: TesterFunctions) {
    const service = new GeneralService(client);
    const serviceAddon = new GeneralService(addonClient);
    testName = 'NebulaInternalTest'; //printing your test name - done for logging
    service.PrintMemoryUseToLog('Start', testName);
    testerFunctions = service.initiateTesterFunctions(client, testName);
    await NebulaInternalTest(service, serviceAddon, request, testerFunctions);//this is the call to YOUR test function
    await test_data(client, testerFunctions);//this is done to print versions at the end of test - can be deleted
    return (await testerFunctions.run());
};
context["nebula_internal_test"] = nebula_internal_test;

export async function core_resources(client: Client, addonClient: Client, request: Request, testerFunctions: TesterFunctions) {
    const service = new GeneralService(client);
    const serviceAddon = new GeneralService(addonClient);
    testName = 'CoreResources'; //printing your test name - done for logging
    service.PrintMemoryUseToLog('Start', testName);
    testerFunctions = service.initiateTesterFunctions(client, testName);
    await CoreResources(service, serviceAddon, request, testerFunctions);//this is the call to YOUR test function
    await test_data(client, testerFunctions);//this is done to print versions at the end of test - can be deleted
    return (await testerFunctions.run());
};
context["core_resources"] = core_resources;
export async function schemas_requiring_sync_tests(client: Client, addonClient: Client, request: Request, testerFunctions: TesterFunctions) {
    const service = new GeneralService(client);
    const serviceAddon = new GeneralService(addonClient);
    testName = 'SchemasRequiringSyncTests'; //printing your test name - done for logging
    service.PrintMemoryUseToLog('Start', testName);
    testerFunctions = service.initiateTesterFunctions(client, testName);
    await SchemasRequiringSyncTests(service, serviceAddon, request, testerFunctions);//this is the call to YOUR test function
    await test_data(client, testerFunctions);//this is done to print versions at the end of test - can be deleted
    return (await testerFunctions.run());
};
context["schemas_requiring_sync_tests"] = schemas_requiring_sync_tests;
