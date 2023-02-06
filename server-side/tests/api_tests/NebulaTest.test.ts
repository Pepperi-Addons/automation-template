//00000000-0000-0000-0000-000000006a91
import { GetRecordsRequiringSyncResponse, unitTestsResult } from "./services/nebulatest.service";
import GeneralService, { TesterFunctions } from "../../potentialQA_SDK/server_side/general.service";
import { PerformanceManager } from "./services/performance_management/performance_manager";
import { ResourceManagerService } from "./services/resource_management/resource_manager.service";
import { Account, AddonData, AddonDataScheme, PapiClient, User } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "./services/resource_management/adal_table.service";
import { v4 as uuidv4 } from 'uuid';
import { AddonUUID as testingAddonUUID } from "../../../addon.config.json";
import { BasicRecord } from "./services/NebulaPNSEmulator.service";
import jwt from 'jwt-decode';
import { SystemFilter, GetRecordsRequiringSyncParameters, GetResourcesRequiringSyncParameters, SystemFilterType } from "../entities/nebula/types";
import { NebulaServiceFactory } from "./services/NebulaServiceFactory";
import { AccountsService } from "./services/accounts.service";
import { AccountUser, AccountUsersService } from "./services/account-users.service";
import { UsersService } from "./services/users.service";

export async function NebulaTest(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions) {

    // the 'Data' object passed inside the http request sent to start the test -- put all the data you need here
    const dataObj = request.body.Data;
    const isLocal = request.body.isLocal;
    //setting 'mocha verbs' to use
    const describe = tester.describe;
    const expect = tester.expect;
    const it = tester.it;

    const automationAddonUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4";
    const CORE_RESOURCES_UUID = 'fc5a5974-3b30-4430-8feb-7d5b9699bc9f';
    const CORE_UUID = '00000000-0000-0000-0000-00000000c07e';
    const accountsService = new AccountsService(generalService.papiClient);
    const usersService = new UsersService(generalService.papiClient);
    const accountUsersService = new AccountUsersService(generalService.papiClient);

    async function cleanUp(resourceManager: ResourceManagerService, performanceManager: PerformanceManager) {
        //TODO: add PNS cleanup here
        await resourceManager.cleanup();
        console.log(JSON.stringify(performanceManager.getStatistics()));
    }

    function buildGetRecordsRequiringSyncParameters(tableName: string, modificationDateTime?: string, includeDeleted: boolean = false, filter: SystemFilter | undefined = undefined): GetRecordsRequiringSyncParameters {
        return {
            AddonUUID: automationAddonUUID,
            Resource: tableName,
            ModificationDateTime: modificationDateTime,
            IncludeDeleted: includeDeleted,
            SystemFilter: filter
        };
    }

    function buildGetResourcesRequiringSyncParameters(modificationDateTime: string, includeDeleted: boolean = false, filter: SystemFilter | undefined = undefined): GetResourcesRequiringSyncParameters {
        return {
            ModificationDateTime: modificationDateTime,
            IncludeDeleted: includeDeleted,
            SystemFilter: filter
        };
    }

    describe('Nebula unit tests', () => {
        const nebulaTestService = NebulaServiceFactory.getNebulaService(generalService, addonService.papiClient, dataObj, isLocal);
        const performanceManager: PerformanceManager = new PerformanceManager();

        it(`run the Nebula unit tests endpoint and make sure everything passed`, async () => {
            performanceManager.startMeasure(`Test 1`, `run the Nebula unit tests endpoint and make sure everything passed`);
            const results: unitTestsResult = await nebulaTestService.runUnitTests();
            expect(results.stats.failures).to.equal(0,
                `The following unit tests failed: ${JSON.stringify(results.tests.filter(test => test.failed === true))}`);
            performanceManager.stopMeasure(`Test 1`);
        })

    });

    describe('NebulaTest Suites', () => {
        const nebulatestService = NebulaServiceFactory.getNebulaService(generalService, addonService.papiClient, dataObj, isLocal);
        const performanceManager: PerformanceManager = new PerformanceManager();
        const resourceManager: ResourceManagerService = new ResourceManagerService(generalService.papiClient, automationAddonUUID);

        // it(`first clean of PNS`, async () => {
        //     await nebulatestService.initPNS();
        //     //const originalBaseURL = nebulatestService.papiClient['options'].baseURL;
        //     //nebulatestService.papiClient['options'].baseURL = "";
        //     //await nebulatestService.papiClient.post('http://localhost:4500/pns_endpoints/foo', { hello: "world" });
        //     //await nebulatestService.papiClient.post('http://localhost:4500/pns_endpoints/foo', { hello: "world" });
        //     //nebulatestService.papiClient['options'].baseURL = originalBaseURL;
        // });

        it(`Create ADAL schema with sync=true, add items, wait for 16 seconds and check if nebula has the records`, async () => {
            performanceManager.startMeasure(`Test 1`, `Create ADAL schema with sync=true, add items, wait for 16 seconds and check if nebula has the records`);

            const tableName = "nebulaTestTable1" + getShortUUID();
            // create ADAL schema with sync=true
            const test_1_schema: AddonDataScheme = {
                "Name": tableName,
                "Type": "data",
                "Fields":
                {
                    StringProperty: { Type: "String" },
                    Key: { Type: "String" } // no need key
                }
                ,
                "SyncData": {
                    "Sync": true
                }
            }

            // create ADAL table
            const test_1_table_service: ADALTableService = await resourceManager.createAdalTable(test_1_schema);
            await nebulatestService.pnsInsertSchema(testingAddonUUID, tableName);
            console.log(`created table test_1_table_service`);

            // wait for PNS to notify nebula about the new schema
            await nebulatestService.waitForPNS();

            // init PNS
            await nebulatestService.initPNS();

            // add 10 items to the table
            const test_1_items: BasicRecord[] = [];
            for (let i = 0; i < 10; i++) {
                test_1_items.push({
                    Key: `test_1_item_${i}`,
                    StringProperty: `test_1_item_${i}`
                });
            }
            await test_1_table_service.upsertBatch(test_1_items);
            await nebulatestService.pnsInsertRecords(testingAddonUUID, tableName, test_1_items);
            console.log(`added items to table test_1_table_service: ${JSON.stringify(test_1_items)}`);

            // wait for PNS to notify nebula about the new items
            await nebulatestService.waitForPNS();

            // get nodes of test_1_table from nebula:
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName);
            const nodes = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);

            console.log(`nodes: ${JSON.stringify(nodes)}`);

            // check if nebula has the records (unordered)
            expect(nodes.Keys.length).to.equal(10);
            for (let i = 0; i < 10; i++) {
                expect(nodes.Keys.find(nodeKey => nodeKey === `test_1_item_${i}`)).to.not.equal(undefined);
            }
            performanceManager.stopMeasure("Test 1");
        });

        it(`Create ADAL schema with sync=false, add items, check to see that nebula doesn't hold the records, set sync=true, wait for 16 seconds and check if nebula has the records`, async () => {
            performanceManager.startMeasure("Test 2", `Create ADAL schema with sync=false, add items, check to see that nebula doesn't hold the records, set sync=true, wait for 16 seconds and check if nebula has the records`);

            const tableName = "nebulaTestTable2" + getShortUUID();
            // create ADAL schema with sync=true
            const test_2_schema: AddonDataScheme = {
                "Name": tableName,
                "Type": "data",
                "Fields":
                {
                    StringProperty: { Type: "String" },
                    Key: { Type: "String" }
                }
                ,
                "SyncData": {
                    "Sync": false
                }
            }

            // create ADAL table
            const test_2_table_service: ADALTableService = await resourceManager.createAdalTable(test_2_schema);
            await nebulatestService.pnsInsertSchema(testingAddonUUID, tableName);
            console.log(`created table test_2_table_service`);

            // add 10 items to the table
            const test_2_items: AddonData[] = [];
            for (let i = 0; i < 10; i++) {
                test_2_items.push({
                    Key: `test_2_item_${i}`,
                    StringProperty: `test_2_item_${i}`
                });
            }

            await test_2_table_service.upsertBatch(test_2_items);
            console.log(`added items to table test_2_table_service: ${JSON.stringify(test_2_items)}`);

            // wait for PNS to notify nebula about the new schema
            await nebulatestService.waitForPNS();

            // get nodes of test_2_table from nebula:
            let getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName);
            const nodes_before_sync = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            console.log(`nodes_before_sync: ${JSON.stringify(nodes_before_sync)}`);

            // check that nebula doesn't have the records
            expect(nodes_before_sync.Keys.length).to.equal(0);
            expect(nodes_before_sync.HiddenKeys.length).to.equal(0);

            // set sync=true
            const newSchema: AddonDataScheme = {
                "Name": tableName,
                "Type": "data",
                "Fields":
                {
                    StringProperty: { Type: "String" },
                    Key: { Type: "String" }
                }
                ,
                "SyncData": {
                    "Sync": true
                }
            }
            await test_2_table_service.updateSchema(newSchema);
            await nebulatestService.pnsUpdateSchemaSyncStatus(testingAddonUUID, tableName, true);

            // wait for PNS to notify nebula about the new schema
            await nebulatestService.waitForPNS();

            // init PNS
            await nebulatestService.initPNS();

            // get nodes of test_2_table from nebula:
            getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName);
            const nodes_after_sync = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            console.log(`nodes_after_sync: ${JSON.stringify(nodes_after_sync)}`);

            // check if nebula has the records (unordered)
            expect(nodes_after_sync.Keys.length).to.equal(10);
            for (let i = 0; i < 10; i++) {
                expect(nodes_after_sync.Keys.find(nodeKey => nodeKey === `test_2_item_${i}`)).to.not.equal(undefined);
            }
            performanceManager.stopMeasure("Test 2");
        });

        it(`Create ADAL schema with sync=true, add items, wait for 16 seconds and check if nebula has the records, set sync=false, check to see that nebula doesn't hold the records`, async () => {
            performanceManager.startMeasure("Test 7", `Create ADAL schema with sync=true, add items, wait for 16 seconds and check if nebula has the records, set sync=false, check to see that nebula doesn't hold the records`);

            const tableName = "nebulaTestTable7" + getShortUUID();
            // create ADAL schema with sync=true
            const test_7_schema: AddonDataScheme = {
                "Name": tableName,
                "Type": "data",
                "Fields":
                {
                    StringProperty: { Type: "String" },
                    Key: { Type: "String" }
                }
                ,
                "SyncData": {
                    "Sync": true
                }
            }

            // create ADAL table
            const test_7_table_service: ADALTableService = await resourceManager.createAdalTable(test_7_schema);
            await nebulatestService.pnsInsertSchema(testingAddonUUID, tableName);
            console.log(`created table test_7_table_service`);

            // wait for PNS to notify nebula about the new schema
            await nebulatestService.waitForPNS();

            // init PNS
            await nebulatestService.initPNS();

            // add 10 items to the table
            const test_7_items: BasicRecord[] = [];
            for (let i = 0; i < 10; i++) {
                test_7_items.push({
                    Key: `test_7_item_${i}`,
                    StringProperty: `test_7_item_${i}`
                });
            }

            await test_7_table_service.upsertBatch(test_7_items);
            await nebulatestService.pnsInsertRecords(testingAddonUUID, tableName, test_7_items);
            console.log(`added items to table test_7_table_service: ${JSON.stringify(test_7_items)}`);

            // wait for PNS to notify nebula about the new items
            await nebulatestService.waitForPNS();

            // get nodes of test_7_table from nebula:
            let getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName);
            const nodes_before_sync = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            console.log(`nodes_before_sync: ${JSON.stringify(nodes_before_sync)}`);

            // check that nebula has the records
            expect(nodes_before_sync.Keys.length).to.equal(10);
            for (let i = 0; i < 10; i++) {
                expect(nodes_before_sync.Keys.find(nodeKey => nodeKey === `test_7_item_${i}`)).to.not.equal(undefined);
            }

            // set sync=false
            const newSchema: AddonDataScheme = {
                "Name": tableName,
                "Type": "data",
                "Fields":
                {
                    StringProperty: { Type: "String" },
                    Key: { Type: "String" }
                }
                ,
                "SyncData": {
                    "Sync": false
                }
            }
            await test_7_table_service.updateSchema(newSchema);
            await nebulatestService.pnsUpdateSchemaSyncStatus(testingAddonUUID, tableName, false);

            // wait for PNS to notify nebula about the new schema
            await nebulatestService.waitForPNS();

            // init PNS
            await nebulatestService.initPNS();

            // get nodes of test_7_table from nebula:
            getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName);
            const nodes_after_sync = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            console.log(`nodes_after_sync: ${JSON.stringify(nodes_after_sync)}`);

            // check if nebula doesn't have the records
            expect(nodes_after_sync.Keys.length).to.equal(0);
            performanceManager.stopMeasure("Test 7");
        });

        it(`Create ADAL schema with sync=true, wait for PNS, save current time X, and add records. get resources requiring sync using X, and should find the resource. get records requiring sync using X and should find the records. save current time Y, and get resources requiring sync using Y, and should not find the resource. get records requiring sync using Y and should not find the records. add records, wait for PNS, and get records requiring sync using Y and should find only the new records.`, async () => {
            performanceManager.startMeasure("Test 3", `Create ADAL schema with sync=true, wait for PNS, save current time X, and add records. get resources requiring sync using X, and should find the resource. get records requiring sync using X and should find the records. save current time Y, and get resources requiring sync using Y, and should not find the resource. get records requiring sync using Y and should not find the records. add records, wait for PNS, and get records requiring sync using Y and should find only the new records.`);

            const tableName = "nebulaTestTable3" + getShortUUID();
            // create ADAL schema with sync=true
            const test_3_schema: AddonDataScheme = {
                "Name": tableName,
                "Type": "data",
                "Fields":
                {
                    StringProperty: { Type: "String" },
                    Key: { Type: "String" }
                }
                ,
                "SyncData": {
                    "Sync": true
                }
            }

            // create ADAL table
            const test_3_table_service: ADALTableService = await resourceManager.createAdalTable(test_3_schema);
            await nebulatestService.pnsInsertSchema(testingAddonUUID, tableName);
            console.log(`created table test_3_table_service`);

            // wait for PNS to notify nebula about the new schema
            await nebulatestService.waitForPNS();

            // init PNS
            await nebulatestService.initPNS();

            // save current time X
            const currentTimeX = new Date().toISOString();

            // add 10 items to the table
            const test_3_items: BasicRecord[] = [];
            for (let i = 0; i < 10; i++) {
                test_3_items.push({
                    Key: `test_3_item_${i}`,
                    StringProperty: `test_3_item_${i}`
                });
            }

            await test_3_table_service.upsertBatch(test_3_items);
            await nebulatestService.pnsInsertRecords(testingAddonUUID, tableName, test_3_items);
            console.log(`added items to table test_3_table_service: ${JSON.stringify(test_3_items)}`);

            // wait for PNS to notify nebula about the new items
            await nebulatestService.waitForPNS();

            // get resources requiring sync using X
            let getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(currentTimeX);
            const resourcesRequiringSyncX = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);
            console.log(`resourcesRequiringSyncX: ${JSON.stringify(resourcesRequiringSyncX)}`);

            // check that the resource is in the list
            expect(resourcesRequiringSyncX.find(resource => resource.Resource === tableName)).to.not.equal(undefined);

            // get records requiring sync using X
            let getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName, currentTimeX);
            const recordsRequiringSyncX = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            console.log(`recordsRequiringSyncX: ${JSON.stringify(recordsRequiringSyncX)}`);

            // check that the records are in the list
            expect(recordsRequiringSyncX.Keys.length).to.equal(10);
            for (let i = 0; i < 10; i++) {
                expect(recordsRequiringSyncX.Keys.find(recordKey => recordKey === `test_3_item_${i}`)).to.not.equal(undefined);
            }

            // save current time Y
            const currentTimeY = new Date().toISOString();

            // get resources requiring sync using Y
            getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(currentTimeY);
            const resourcesRequiringSyncY = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);
            console.log(`resourcesRequiringSyncY: ${JSON.stringify(resourcesRequiringSyncY)}`);

            // check that the resource is not in the list
            expect(resourcesRequiringSyncY.find(resource => resource.Resource === tableName)).to.be.undefined;

            // get records requiring sync using Y
            getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName, currentTimeY);
            const recordsRequiringSyncY = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            console.log(`recordsRequiringSyncY: ${JSON.stringify(recordsRequiringSyncY)}`);

            // check that the records are not in the list
            expect(recordsRequiringSyncY.Keys.length).to.equal(0);

            // add 10 items to the table
            const test_3_items2: BasicRecord[] = [];
            for (let i = 10; i < 20; i++) {
                test_3_items2.push({
                    Key: `test_3_item_${i}`,
                    StringProperty: `test_3_item_${i}`
                });
            }

            await test_3_table_service.upsertBatch(test_3_items2);
            await nebulatestService.pnsInsertRecords(testingAddonUUID, tableName, test_3_items2);
            console.log(`added items to table test_3_table_service: ${JSON.stringify(test_3_items2)}`);

            // wait for PNS to notify nebula about the new schema
            await nebulatestService.waitForPNS();

            // get records requiring sync using Y
            getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName, currentTimeY);
            const recordsRequiringSyncY2 = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            console.log(`recordsRequiringSyncY2: ${JSON.stringify(recordsRequiringSyncY2)}`);

            // check that the records are in the list
            expect(recordsRequiringSyncY2.Keys.length).to.equal(10);
            for (let i = 10; i < 20; i++) {
                expect(recordsRequiringSyncY2.Keys.find(recordKey => recordKey === `test_3_item_${i}`)).to.not.equal(undefined);
            }

            performanceManager.stopMeasure("Test 3");
        });

        it(`Create ADAL schema, wait for PNS, add items with Hidden=true, get resources requiring sync, and should find the resource. get records requiring sync, and should not find the records. Get  them again with IncludeDeleted = true, and should find the records and resource.`, async () => {
            performanceManager.startMeasure("Test 4", `Create ADAL schema, wait for PNS, add items with Hidden=true, get resources requiring sync, and should find the resource. get records requiring sync, and should not find the records. Get  them again with IncludeDeleted = true, and should find the records and resource.`);

            const tableName = "nebulaTestTable4" + getShortUUID();
            // create ADAL schema
            const test_4_schema: AddonDataScheme = {
                "Name": tableName,
                "Type": "data",
                "Fields":
                {
                    StringProperty: { Type: "String" },
                    Key: { Type: "String" }
                },
                "SyncData": {
                    "Sync": true
                }
            }

            // create ADAL table
            const test_4_table_service: ADALTableService = await resourceManager.createAdalTable(test_4_schema);
            await nebulatestService.pnsInsertSchema(testingAddonUUID, tableName);
            console.log(`created table test_4_table_service`);

            // wait for PNS to notify nebula about the new schema
            await nebulatestService.waitForPNS();

            // init PNS
            await nebulatestService.initPNS();

            // save current time X
            const currentTimeX = new Date().toISOString();

            // add 10 items to the table
            const test_4_items: BasicRecord[] = [];
            for (let i = 0; i < 10; i++) {
                test_4_items.push({
                    Key: `test_4_item_${i}`,
                    StringProperty: `test_4_item_${i}`,
                    Hidden: true
                });
            }

            await test_4_table_service.upsertBatch(test_4_items);
            await nebulatestService.pnsInsertRecords(testingAddonUUID, tableName, test_4_items);
            console.log(`added items to table test_4_table_service: ${JSON.stringify(test_4_items)}`);

            // wait for PNS to notify nebula about the new schema
            await nebulatestService.waitForPNS();

            // get resources requiring sync using X
            let getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(currentTimeX);
            const resourcesRequiringSyncX = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);
            console.log(`resourcesRequiringSyncX: ${JSON.stringify(resourcesRequiringSyncX)}`);

            // check that the resource is in the list
            expect(resourcesRequiringSyncX.find(resource => resource.Resource === tableName)).to.not.equal(undefined);

            // get records requiring sync using X
            let getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName, currentTimeX);
            const recordsRequiringSyncX = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            console.log(`recordsRequiringSyncX: ${JSON.stringify(recordsRequiringSyncX)}`);

            // check that the records are not in the list
            expect(recordsRequiringSyncX.Keys.length).to.equal(0);

            // get resources requiring sync using X with IncludeDeleted = true
            getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(currentTimeX, true);
            const resourcesRequiringSyncX2 = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);
            console.log(`resourcesRequiringSyncX2: ${JSON.stringify(resourcesRequiringSyncX2)}`);

            // check that the resource is in the list
            expect(resourcesRequiringSyncX2.find(resource => resource.Resource === tableName)).to.not.equal(undefined);

            // get records requiring sync using X with IncludeDeleted = true
            getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName, currentTimeX, true);
            const recordsRequiringSyncX2 = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            console.log(`recordsRequiringSyncX2: ${JSON.stringify(recordsRequiringSyncX2)}`);

            // check that the records are in the list
            expect(recordsRequiringSyncX2.HiddenKeys.length).to.equal(10);
            for (let i = 0; i < 10; i++) {
                expect(recordsRequiringSyncX2.HiddenKeys.find(recordKey => recordKey === `test_4_item_${i}`)).to.not.equal(undefined);
            }

            performanceManager.stopMeasure("Test 4");
        });

        it(`same as the first tests only the table name contains an underscore`, async () => {
            performanceManager.startMeasure("Test 5", `same as the first tests only the table name contains an underscore`);

            const tableName = "nebula_Test_Table_5" + getShortUUID();
            // create ADAL schema
            const test_5_schema: AddonDataScheme = {
                "Name": tableName,
                "Type": "data",
                "Fields":
                {
                    StringProperty: { Type: "String" },
                    Key: { Type: "String" }
                },
                "SyncData": {
                    "Sync": true
                }
            }

            // create ADAL table
            const test_5_table_service: ADALTableService = await resourceManager.createAdalTable(test_5_schema);
            await nebulatestService.pnsInsertSchema(testingAddonUUID, tableName);
            console.log(`created table test_5_table_service`);

            // wait for PNS to notify nebula about the new schema
            await nebulatestService.waitForPNS();

            // init PNS
            await nebulatestService.initPNS();

            // add 10 items to the table
            const test_5_items: BasicRecord[] = [];
            for (let i = 0; i < 10; i++) {
                test_5_items.push({
                    Key: `test_5_item_${i}`,
                    StringProperty: `test_5_item_${i}`
                });
            }

            await test_5_table_service.upsertBatch(test_5_items);
            await nebulatestService.pnsInsertRecords(testingAddonUUID, tableName, test_5_items);
            console.log(`added items to table test_5_table_service: ${JSON.stringify(test_5_items)}`);

            // wait for PNS to notify nebula about the new items
            await nebulatestService.waitForPNS();

            // get nodes of test_5_table from nebula:
            let getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName);
            const nodes = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            console.log(`nodes: ${JSON.stringify(nodes)}`);

            // check if nebula has the records (unordered)
            expect(nodes.Keys.length).to.equal(10);
            for (let i = 0; i < 10; i++) {
                expect(nodes.Keys.find(nodeKey => nodeKey === `test_5_item_${i}`)).to.not.equal(undefined);
            }
            performanceManager.stopMeasure("Test 5");
        });

        it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
            await cleanUp(resourceManager, performanceManager);
        });
    });

    describe('GetDocumentKeysRequiringSync - users reference fields without system filter (type=None)', async () => {
        // services
        const nebulatestService = NebulaServiceFactory.getNebulaService(generalService, addonService.papiClient, dataObj, isLocal);
        const performanceManager: PerformanceManager = new PerformanceManager();
        const resourceManager: ResourceManagerService = new ResourceManagerService(generalService.papiClient, automationAddonUUID);

        const USERS_TABLE = 'users';

        /**
         * @returns current user and one additional user.
         */
        async function getUsersToPointTo(): Promise<Users> {
            const users = await getUsers();

            const currentUserUUID: string = getCurrentUserUUID(addonService.papiClient)
            const currentUser = users.find(user => { return user.UUID === currentUserUUID });
            const otherUser = users.find(user => { return user.UUID !== currentUserUUID });

            if (currentUser === undefined || otherUser === undefined) {
                throw new Error('Could not find required users for test, make sure you have at least two users and try again.');
            }

            return {
                CurrentUser: currentUser,
                OtherUser: otherUser
            };
        }

        async function getUsers() {
            const users = await generalService.papiClient.users.find();

            if (users.length < 2) {
                throw new Error('Distributor does not have enough users to preform test, create a user and try again.');
            }

            return users;
        }

        function getSchema(): AddonDataScheme {
            return {
                Name: "nebulaTestPointToUserTable" + getShortUUID(),
                Type: "data",
                Fields:
                {
                    field1: {
                        Type: "Resource",
                        ApplySystemFilter: true,
                        AddonUUID: CORE_RESOURCES_UUID,
                        Resource: USERS_TABLE
                    },
                },
                SyncData: {
                    Sync: true
                }
            };
        }

        /**
         * Check if schema was created, if not throws.
         */
        function assertInitialPreparations(): void {
            if (pointingSchemaService === undefined) {
                throw new Error(`Schema was not created, cannot run test`);
            }

            if (users === undefined) {
                throw new Error(`Failed fetching users, cannot run test`);
            }
        }

        // Preparations parameters
        const timeStampBeforeCreation = new Date().toISOString();
        type Users = { CurrentUser: User, OtherUser: User };
        let users: Users | undefined = undefined;
        const documentsThatShouldRequireSync = ['4', '5', '6'];
        const documentsThatShouldNotRequireSync = ['1', '2', '3'];
        let pointingSchemaService: ADALTableService | undefined = undefined;

        it('Preparations - create table, upsert documents and wait for PNS', async () => {

            // get users
            users = await getUsersToPointTo();

            // Create a table with a reference field that point to users table.
            const pointingSchema: AddonDataScheme = getSchema();
            pointingSchemaService = await resourceManager.createAdalTable(pointingSchema);
            await nebulatestService.pnsInsertSchema(testingAddonUUID, pointingSchema.Name);

            await nebulatestService.waitForPNS();

            await nebulatestService.initPNS();

            // Upsert documents, half points to current user, and the others to a different one.
            const pointingSchemaDocuments: AddonData[] = [{
                Key: documentsThatShouldNotRequireSync[0],
                field1: users!.OtherUser.UUID
            }, {
                Key: documentsThatShouldNotRequireSync[1],
                field1: users!.OtherUser.UUID
            }, {
                Key: documentsThatShouldNotRequireSync[2],
                field1: users!.OtherUser.UUID
            }, {
                Key: documentsThatShouldRequireSync[0],
                field1: users!.CurrentUser.UUID
            }, {
                Key: documentsThatShouldRequireSync[1],
                field1: users!.CurrentUser.UUID
            }, {
                Key: documentsThatShouldRequireSync[2],
                field1: users!.CurrentUser.UUID
            }];
            await pointingSchemaService!.upsertBatch(pointingSchemaDocuments);

            await nebulatestService.pnsInsertRecords(testingAddonUUID, pointingSchema.Name, (pointingSchemaDocuments as BasicRecord[]));
            // wait for PNS callback to create nodes and edges in graph.
            await nebulatestService.waitForPNS();
        });

        it('Call getRecordsRequiringSync, expect only documents pointing to user in result', async () => {
            assertInitialPreparations();
            const pointingSchemaName: string = pointingSchemaService!.schemaName!;

            // Check only documents that points to current user are retrieved.
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName!, timeStampBeforeCreation);
            let recordsRequiringSync = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            expect(recordsRequiringSync).to.not.be.undefined;
            expect(recordsRequiringSync.Keys.length).to.be.equal(3);

            recordsRequiringSync.Keys.forEach(recordKeyRequiringSync => {
                expect(documentsThatShouldRequireSync.includes(recordKeyRequiringSync)).to.be.true;
            });
        });

        // Switch pointers between two documents in order to test PNS callback
        const documentThatShouldRequireSync = documentsThatShouldNotRequireSync[0];
        const documentThatShouldNotRequireSync = documentsThatShouldRequireSync[0];

        it('Preparations - edit documents and wait for PNS', async () => {
            assertInitialPreparations();

            // Upsert two documents.
            const pointingSchemaDocumentsUpdate: AddonData[] = [{
                Key: documentThatShouldRequireSync,
                field1: users!.CurrentUser.UUID
            }, {
                Key: documentThatShouldNotRequireSync,
                field1: users!.OtherUser.UUID
            }];
            await pointingSchemaService!.upsertBatch(pointingSchemaDocumentsUpdate);

            await nebulatestService.pnsInsertRecords(testingAddonUUID, pointingSchemaService!.schemaName!, (pointingSchemaDocumentsUpdate as BasicRecord[]));
            // wait for PNS callback to create nodes and edges in graph.
            await nebulatestService.waitForPNS();
        });

        it('Call getRecordsRequiringSync, expect only documents pointing to user in result', async () => {
            assertInitialPreparations();

            // Check only documents that points to current user are retrieved.
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName!, timeStampBeforeCreation);
            const recordsKeysRequiringSync = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            expect(recordsKeysRequiringSync).to.not.be.undefined;
            expect(recordsKeysRequiringSync.Keys.length).to.be.equal(3);

            // Check updated document's edges.
            expect(recordsKeysRequiringSync.Keys.find(recordKey => recordKey === documentThatShouldRequireSync)).to.not.be.undefined;
            expect(recordsKeysRequiringSync.Keys.find(recordKey => recordKey === documentThatShouldNotRequireSync)).to.be.undefined;
        });

        it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
            await cleanUp(resourceManager, performanceManager);
        });
    });

    describe('GetDocumentKeysRequiringSync - account reference fields without system filter (type=None)', async () => {
        // services
        const nebulatestService = NebulaServiceFactory.getNebulaService(generalService, addonService.papiClient, dataObj, isLocal);
        const performanceManager: PerformanceManager = new PerformanceManager();
        const resourceManager: ResourceManagerService = new ResourceManagerService(generalService.papiClient, automationAddonUUID);

        const ACCOUNTS_TABLE = 'accounts';

        async function getAccountsToPointTo(): Promise<Accounts> {
            // Get data
            const accounts = await getAccounts();
            const currentUserUUID: string = getCurrentUserUUID(addonService.papiClient);
            const accountsUsers = await getAccountUsers();

            // find an account that points to current user, and one that does not.
            let accountsThatPoint: string[] = [];
            accountsUsers.forEach(accountUser => {
                if (accountUser.User === currentUserUUID) {
                    accountsThatPoint.push(accountUser.Account);
                }
            });

            if (accountsThatPoint.length === accounts.length) {
                throw new Error('Could not find required accounts for test, make sure you have an account that points to your user and one that does not and try again.');
            }

            const accountThatPoint = accounts.find(account => { return account.UUID === accountsThatPoint[0] });
            const accountThatDoesNotPoint = accounts.find(account => { return (accountsThatPoint.includes(account.UUID!) === false) });

            if (accountThatPoint === undefined || accountThatDoesNotPoint === undefined) {
                throw new Error('Could not find required accounts for test, make sure you have an account that points to your user and one that does not and try again.');
            }

            return {
                pointingAccount: accountThatPoint,
                otherAccount: accountThatDoesNotPoint
            };
        }

        async function getAccounts(): Promise<Account[]> {
            const accounts = await generalService.papiClient.accounts.find();

            if (accounts.length < 2) {
                throw new Error('Distributor does not have enough accounts to preform test, create an account and try again.');
            }

            return accounts;
        }

        async function getAccountUsers(): Promise<any[]> {
            const accountUsersUrl = `/addons/data/${CORE_RESOURCES_UUID}/account_users?where=Hidden=0`;
            try {
                const accountsUsers = await generalService.papiClient.get(accountUsersUrl);
                return accountsUsers;
            }
            catch (err) {
                throw new Error(`Failed fetching accounts users, error: ${err}`);
            }
        }

        function getSchema(): AddonDataScheme {
            return {
                Name: "nebulaTestPointToAccountTable" + getShortUUID(),
                Type: "data",
                Fields:
                {
                    field1: {
                        Type: "Resource",
                        ApplySystemFilter: true,
                        AddonUUID: CORE_RESOURCES_UUID,
                        Resource: ACCOUNTS_TABLE
                    },
                },
                SyncData: {
                    Sync: true
                }
            };
        }

        /**
         * Check if schema was created, if not throws.
         */
        function assertInitialPreparations(): void {
            if (pointingSchemaService === undefined) {
                throw new Error(`Schema was not created, cannot run test`);
            }

            if (accounts === undefined) {
                throw new Error(`Failed fetching accounts, cannot run test`);
            }
        }

        // Preparations parameters
        const timeStampBeforeCreation = new Date().toISOString();
        type Accounts = { pointingAccount: Account; otherAccount: Account; };
        let accounts: Accounts | undefined = undefined;
        const documentsThatShouldRequireSync = ['1', '2', '3'];
        const documentsThatShouldNotRequireSync = ['4', '5', '6'];
        let pointingSchemaService: ADALTableService | undefined = undefined;

        it('Preparations - create table, upsert documents and wait for PNS', async () => {

            // Create a table that points to the accounts table.
            const pointingSchema: AddonDataScheme = getSchema();
            accounts = await getAccountsToPointTo();
            pointingSchemaService = await resourceManager.createAdalTable(pointingSchema);

            await nebulatestService.pnsInsertSchema(testingAddonUUID, pointingSchemaService!.schemaName!);
            await nebulatestService.waitForPNS();

            await nebulatestService.initPNS();

            // Upsert documents, half points to current account, and the others to a different one.
            const pointingSchemaDocuments: AddonData[] = [{
                Key: documentsThatShouldNotRequireSync[0],
                field1: accounts.otherAccount.UUID
            }, {
                Key: documentsThatShouldNotRequireSync[1],
                field1: accounts.otherAccount.UUID
            }, {
                Key: documentsThatShouldNotRequireSync[2],
                field1: accounts.otherAccount.UUID
            }, {
                Key: documentsThatShouldRequireSync[0],
                field1: accounts.pointingAccount.UUID
            }, {
                Key: documentsThatShouldRequireSync[1],
                field1: accounts.pointingAccount.UUID
            }, {
                Key: documentsThatShouldRequireSync[2],
                field1: accounts.pointingAccount.UUID
            }];
            await pointingSchemaService!.upsertBatch(pointingSchemaDocuments);

            await nebulatestService.pnsInsertRecords(testingAddonUUID, pointingSchemaService!.schemaName!, (pointingSchemaDocuments as BasicRecord[]));

            // wait for PNS callback to create nodes and edges in graph.
            await nebulatestService.waitForPNS();
        });

        it('Call getRecordsRequiringSync, expect only documents pointing to "current account" (account that point to current user) in result', async () => {
            assertInitialPreparations();

            // Check only documents that points to "current account" (account that point to current user) are retrieved.
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName, timeStampBeforeCreation);
            const recordsKeysRequiringSync = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            expect(recordsKeysRequiringSync).to.not.be.undefined;
            expect(recordsKeysRequiringSync.Keys.length).to.be.equal(3);

            recordsKeysRequiringSync.Keys.forEach(recordKeyRequiringSync => {
                expect(documentsThatShouldRequireSync.includes(recordKeyRequiringSync)).to.be.true;
            });
        });

        // Switch pointers between two documents in order to test PNS callback
        const documentThatShouldRequireSync = documentsThatShouldNotRequireSync[0];
        const documentThatShouldNotRequireSync = documentsThatShouldRequireSync[0];

        it('Preparations - edit documents and wait for PNS', async () => {
            assertInitialPreparations();

            // upsert two documents with switched pointers
            const pointingSchemaDocumentsUpdates: AddonData[] = [{
                Key: documentThatShouldRequireSync,
                field1: accounts!.pointingAccount.UUID
            }, {
                Key: documentThatShouldNotRequireSync,
                field1: accounts!.otherAccount.UUID
            }];
            await pointingSchemaService!.upsertBatch(pointingSchemaDocumentsUpdates);

            await nebulatestService.pnsInsertRecords(testingAddonUUID, pointingSchemaService!.schemaName!, (pointingSchemaDocumentsUpdates as BasicRecord[]));
            // wait for PNS callback to create nodes and edges in graph.
            await nebulatestService.waitForPNS();
        });

        it('Call getRecordsRequiringSync, expect only documents pointing to "current account" in result', async () => {
            assertInitialPreparations();
            const schemaName = pointingSchemaService!.schemaName;

            // Check only documents that points to "current account" are retrieved.
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName, timeStampBeforeCreation);
            const recordsKeysRequiringSync = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            expect(recordsKeysRequiringSync).to.not.be.undefined;
            expect(recordsKeysRequiringSync.Keys.length).to.be.equal(3);

            // Check updated document's edges.
            expect(recordsKeysRequiringSync.Keys.find(recordKey => recordKey === documentThatShouldRequireSync)).to.not.be.undefined;
            expect(recordsKeysRequiringSync.Keys.find(recordKey => recordKey === documentThatShouldNotRequireSync)).to.be.undefined;
        });

        it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
            await cleanUp(resourceManager, performanceManager);
        });
    });

    describe('GetDocumentKeysRequiringSync - account reference fields with system filter (type=Account)', async () => {
        // services
        const nebulatestService = NebulaServiceFactory.getNebulaService(generalService, addonService.papiClient, dataObj, isLocal);
        const performanceManager: PerformanceManager = new PerformanceManager();
        const resourceManager: ResourceManagerService = new ResourceManagerService(generalService.papiClient, automationAddonUUID);

        const ACCOUNTS_TABLE = 'accounts';

        async function getAccountsToPointTo(): Promise<Accounts> {
            // Get data
            const accounts = await getAccounts();
            const currentUserUUID: string = getCurrentUserUUID(addonService.papiClient);
            const accountsUsers = await getAccountUsers();

            // find an account that points to current user, and one that does not.
            let accountsThatPoint: string[] = [];
            accountsUsers.forEach(accountUser => {
                if (accountUser.User === currentUserUUID) {
                    accountsThatPoint.push(accountUser.Account);
                }
            });

            if (accountsThatPoint.length === accounts.length) {
                throw new Error('Could not find required accounts for test, make sure you have an account that points to your user and one that does not and try again.');
            }

            const accountThatPoint = accounts.find(account => { return account.UUID === accountsThatPoint[0] });
            const accountThatDoesNotPoint = accounts.find(account => { return (accountsThatPoint.includes(account.UUID!) === false) });

            if (accountThatPoint === undefined || accountThatDoesNotPoint === undefined) {
                throw new Error('Could not find required accounts for test, make sure you have an account that points to your user and one that does not and try again.');
            }

            return {
                pointingAccount: accountThatPoint,
                otherAccount: accountThatDoesNotPoint
            };
        }

        async function getAccounts(): Promise<Account[]> {
            const accounts = await generalService.papiClient.accounts.find();

            if (accounts.length < 2) {
                throw new Error('Distributor does not have enough accounts to preform test, create an account and try again.');
            }

            return accounts;
        }

        async function getAccountUsers(): Promise<any[]> {
            const accountUsersUrl = `/addons/data/${CORE_RESOURCES_UUID}/account_users?where=Hidden=0`;
            const accountsUsers = await generalService.papiClient.get(accountUsersUrl);
            return accountsUsers;
        }

        function getSchema(): AddonDataScheme {
            return {
                Name: "nebulaTestPointToAccountTable" + getShortUUID(),
                Type: "data",
                Fields:
                {
                    field1: {
                        Type: "Resource",
                        ApplySystemFilter: true,
                        AddonUUID: CORE_RESOURCES_UUID,
                        Resource: ACCOUNTS_TABLE
                    },
                },
                SyncData: {
                    Sync: true
                }
            };
        }

        /**
         * Check if schema was created, if not throws.
         */
        function assertInitialPreparations(): void {
            if (pointingSchemaService === undefined) {
                throw new Error(`Schema was not created, cannot run test`);
            }

            if (accounts === undefined) {
                throw new Error(`Failed fetching accounts, cannot run test`);
            }
        }

        // Preparations parameters
        const timeStampBeforeCreation = new Date().toISOString();
        type Accounts = { pointingAccount: Account; otherAccount: Account; };
        let accounts: Accounts | undefined = undefined;
        const documentsThatPointA = ['1', '2', '3'];
        const documentsThatPointB = ['4', '5', '6'];
        let pointingSchemaService: ADALTableService | undefined = undefined;

        function buildSystemFilter(accountUUID: string): SystemFilter {
            return {
                Type: "Account",
                AccountUUID: accountUUID
            };
        }

        it('Preparations - create table, upsert documents and wait for PNS', async () => {

            // Create a table that points to the accounts table.
            const pointingSchema: AddonDataScheme = getSchema();
            accounts = await getAccountsToPointTo();
            pointingSchemaService = await resourceManager.createAdalTable(pointingSchema);

            await nebulatestService.pnsInsertSchema(testingAddonUUID, pointingSchemaService!.schemaName!);
            await nebulatestService.waitForPNS();

            await nebulatestService.initPNS();
            // Upsert documents, half points to current account, and the others to a different one.
            const pointingSchemaDocuments: AddonData[] = [{
                Key: documentsThatPointB[0],
                field1: accounts.otherAccount.UUID
            }, {
                Key: documentsThatPointB[1],
                field1: accounts.otherAccount.UUID
            }, {
                Key: documentsThatPointB[2],
                field1: accounts.otherAccount.UUID
            }, {
                Key: documentsThatPointA[0],
                field1: accounts.pointingAccount.UUID
            }, {
                Key: documentsThatPointA[1],
                field1: accounts.pointingAccount.UUID
            }, {
                Key: documentsThatPointA[2],
                field1: accounts.pointingAccount.UUID
            }];
            await pointingSchemaService!.upsertBatch(pointingSchemaDocuments);
            await nebulatestService.pnsInsertRecords(testingAddonUUID, pointingSchemaService!.schemaName!, (pointingSchemaDocuments as BasicRecord[]));
            // wait for PNS callback to create nodes and edges in graph.
            await nebulatestService.waitForPNS();
        });

        it('Call getRecordsRequiringSync, expect only documents pointing to given account in result', async () => {
            assertInitialPreparations();

            // Check only documents that points to "current account" (account that point to current user) are retrieved.
            accounts = await getAccountsToPointTo();
            const filter = buildSystemFilter(accounts.pointingAccount.UUID!)
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName, timeStampBeforeCreation, false, filter);
            const recordsKeysRequiringSync = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            expect(recordsKeysRequiringSync).to.not.be.undefined;
            expect(recordsKeysRequiringSync.Keys.length).to.be.equal(3);

            recordsKeysRequiringSync.Keys.forEach(recordKeyRequiringSync => {
                expect(documentsThatPointA.includes(recordKeyRequiringSync)).to.be.true;
            });
        });

        it('Call getRecordsRequiringSync with a different account UUID in filter, expect only documents pointing to given account in result', async () => {
            assertInitialPreparations();

            // Check only documents that points to "current account" (account that point to current user) are retrieved.
            accounts = await getAccountsToPointTo();
            const filter = buildSystemFilter(accounts.otherAccount.UUID!)
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName, timeStampBeforeCreation, false, filter);
            const recordsKeysRequiringSync = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            expect(recordsKeysRequiringSync).to.not.be.undefined;
            expect(recordsKeysRequiringSync.Keys.length).to.be.equal(3);

            recordsKeysRequiringSync.Keys.forEach(recordKeyRequiringSync => {
                expect(documentsThatPointB.includes(recordKeyRequiringSync)).to.be.true;
            });
        });

        it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
            await cleanUp(resourceManager, performanceManager);
        });
    });

    describe('GetDocumentKeysRequiringSync - hidden edge causes nodes to return hidden', async () => {
        // services
        const nebulatestService = NebulaServiceFactory.getNebulaService(generalService, addonService.papiClient, dataObj, isLocal);
        const performanceManager: PerformanceManager = new PerformanceManager();
        const resourceManager: ResourceManagerService = new ResourceManagerService(generalService.papiClient, automationAddonUUID);
        const ACCOUNTS_TABLE = 'accounts';
        const ACCOUNT_USERS_TABLE = 'account_users';

        function getSchema(): AddonDataScheme {
            return {
                Name: "nebulaTestPointToAccountTable" + getShortUUID(),
                Type: "data",
                Fields:
                {
                    field1: {
                        Type: "Resource",
                        ApplySystemFilter: true,
                        AddonUUID: CORE_RESOURCES_UUID,
                        Resource: ACCOUNTS_TABLE
                    },
                },
                SyncData: {
                    Sync: true
                }
            };
        }

        // Preparations parameters
        const timeStampBeforeCreation = new Date().toISOString();
        type Accounts = { pointingAccount: Account; otherAccount: Account; };
        let accountUUID: string;
        const documentKey = '1';
        let pointingSchemaService: ADALTableService | undefined = undefined;

        it('Preparations - create table', async () => {

            // Create a table that points to the accounts table.
            const schema: AddonDataScheme = getSchema();
            pointingSchemaService = await resourceManager.createAdalTable(schema);

            await nebulatestService.pnsInsertSchema(testingAddonUUID, pointingSchemaService!.schemaName!);
            await nebulatestService.initPNS();
        });

        it('Preparations - wait for PNS', async () => {
            await nebulatestService.waitForPNS();
        });

        it('Preparations - upsert documents', async () => {

            // Upsert documents, half points to current account, and the others to a different one.
            accountUUID = (await accountUsersService.getAccountPointingToCurrentUser()).UUID!;
            const pointingSchemaDocuments: AddonData[] = [{
                Key: documentKey,
                field1: accountUUID
            }];

            await pointingSchemaService!.upsertBatch(pointingSchemaDocuments);
            await nebulatestService.pnsInsertRecords(testingAddonUUID, pointingSchemaService!.schemaName!, (pointingSchemaDocuments as BasicRecord[]));
        });

        it('Preparations - wait for PNS', async () => {
            await nebulatestService.waitForPNS();
        });

        it('Preparations - hide edge', async () => {
            const currentUserUUID = usersService.getCurrentUserUUID();
            const accountUser: AccountUser = await accountUsersService.hideAccountUser(accountUUID, currentUserUUID);

            // emit offline PNS event
            const oldAccountUser = { ...accountUser, Hidden: false };
            await nebulatestService.pnsUpdateRecords(CORE_UUID, ACCOUNT_USERS_TABLE, [oldAccountUser], [accountUser]);
        });

        it('Preparations - wait for PNS', async () => {
            await nebulatestService.waitForPNS();
        });

        it('Call getRecordsRequiringSync, expect document to be returned as a hidden node', async () => {

            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName, timeStampBeforeCreation, true, { Type: "None" });
            const recordsKeysRequiringSync: GetRecordsRequiringSyncResponse = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            console.log(JSON.stringify(recordsKeysRequiringSync));
            expect(recordsKeysRequiringSync).to.not.be.undefined;
            expect(recordsKeysRequiringSync.HiddenKeys.length).to.be.at.least(1);
            expect(recordsKeysRequiringSync.HiddenKeys.includes(documentKey)).to.be.true;
        });

        it(`Cleanup - unhide edge`, async () => {
            const currentUserUUID = usersService.getCurrentUserUUID();
            const accountUser: AccountUser = await accountUsersService.unhideAccountUser(accountUUID, currentUserUUID);

            // emit offline PNS event
            const oldAccountUser = { ...accountUser, Hidden: true };
            await nebulatestService.pnsUpdateRecords(CORE_UUID, ACCOUNT_USERS_TABLE, [oldAccountUser], [accountUser]);
        });

        it(`Cleanup - Delete all inserted data and print performance statistics`, async () => {
            await cleanUp(resourceManager, performanceManager);
        });
    });

    describe('GetSchemasRequiringSync', () => {
        const nebulatestService = NebulaServiceFactory.getNebulaService(generalService, addonService.papiClient, dataObj, isLocal);
        const performanceManager: PerformanceManager = new PerformanceManager();
        const resourceManager: ResourceManagerService = new ResourceManagerService(generalService.papiClient, automationAddonUUID);
        const ACCOUNTS_TABLE = 'accounts';
        const USERS_TABLE = 'users';

        function buildSystemFilter(type: SystemFilterType, accountUUID?: string): SystemFilter {
            return {
                Type: type,
                AccountUUID: accountUUID
            };
        }

        function getSchemaPointingToAccounts(): AddonDataScheme {
            return {
                Name: "nebulaTestPointToAccountTable" + getShortUUID(),
                Type: "data",
                Fields:
                {
                    field1: {
                        Type: "Resource",
                        ApplySystemFilter: true,
                        AddonUUID: CORE_RESOURCES_UUID,
                        Resource: ACCOUNTS_TABLE
                    },
                },
                SyncData: {
                    Sync: true
                }
            };
        }

        function getSchemaPointingToUsers(): AddonDataScheme {
            return {
                Name: "nebulaTestPointToUserTable" + getShortUUID(),
                Type: "data",
                Fields:
                {
                    field1: {
                        Type: "Resource",
                        ApplySystemFilter: true,
                        AddonUUID: CORE_RESOURCES_UUID,
                        Resource: USERS_TABLE
                    },
                },
                SyncData: {
                    Sync: true
                }
            };
        }

        describe('Tables without documents - system filter', () => {

            // Preparations parameters
            const timeStampBeforeCreation = new Date().toISOString();
            let usersSchemaService: ADALTableService | undefined = undefined;
            let accountsSchemaService: ADALTableService | undefined = undefined;

            it('Preparations - create a table pointing to accounts.', async () => {
                accountsSchemaService = await resourceManager.createAdalTable(getSchemaPointingToAccounts());
                await nebulatestService.pnsInsertSchema(testingAddonUUID, accountsSchemaService!.schemaName!);
                console.debug(`Accounts Schema: ${accountsSchemaService?.schemaName}`);
            });

            it('Preparations - create a table pointing to users.', async () => {
                usersSchemaService = await resourceManager.createAdalTable(getSchemaPointingToUsers());
                await nebulatestService.pnsInsertSchema(testingAddonUUID, usersSchemaService!.schemaName!);
                console.debug(`Users Schema: ${usersSchemaService?.schemaName}`);
            });

            it('Preparations - wait for PNS after table creation.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('System filter type "Account", expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('Account');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check we got a valid response
                expect(resourcesRequiringSync).to.not.be.undefined;

                // Check table pointing to accounts is not in response
                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToAccounts).to.be.undefined;

                // Check table pointing to users is not in response
                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.be.undefined;
            });

            it('System filter type "User", expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('User');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schema is in response
                expect(resourcesRequiringSync).to.not.be.undefined;

                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.be.undefined;

                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToAccounts).to.be.undefined;
            });

            it('System filter type "None", expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('None');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;

                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.be.undefined;
                expect(schemaPointingToAccounts).to.be.undefined;
            });

            it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
                await cleanUp(resourceManager, performanceManager);
            });
        });

        describe('Tables with documents - system filter with current and futuristic modification date', () => {

            // Preparations parameters
            const timeStampBeforeCreation = new Date().toISOString();
            const futuristicTimeStamp = new Date(Date.now() + 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 10).toISOString();
            let usersSchemaService: ADALTableService | undefined = undefined;
            let accountsSchemaService: ADALTableService | undefined = undefined;

            async function getAnAccountUUID(): Promise<string> {
                const accounts = await generalService.papiClient.accounts.find();
                const validAccount = accounts.find(account => account.UUID !== undefined);

                if (validAccount === undefined) {
                    throw new Error('Distributor does not have an account with a UUID, create an account and try again.');
                }

                return validAccount.UUID!;
            }

            it('Preparations - create a table pointing to accounts.', async () => {
                accountsSchemaService = await resourceManager.createAdalTable(getSchemaPointingToAccounts());
                await nebulatestService.pnsInsertSchema(testingAddonUUID, accountsSchemaService!.schemaName!);
                console.debug(`Accounts Schema: ${accountsSchemaService?.schemaName}`);
            });

            it('Preparations - create a table pointing to users.', async () => {
                usersSchemaService = await resourceManager.createAdalTable(getSchemaPointingToUsers());
                await nebulatestService.pnsInsertSchema(testingAddonUUID, usersSchemaService!.schemaName!);
                console.debug(`Users Schema: ${usersSchemaService?.schemaName}`);
            });

            it('Preparations - wait for PNS after table creation.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('Preparations - upsert documents into table pointing to accounts.', async () => {
                const accountUUID = await getAnAccountUUID();
                const accountDocuments: AddonData[] = [{
                    Key: '1',
                    field1: accountUUID
                }];
                await accountsSchemaService!.upsertBatch(accountDocuments);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, accountsSchemaService!.schemaName!, (accountDocuments as BasicRecord[]));
            });

            it('Preparations - upsert documents into table pointing to users.', async () => {
                const userDocuments: AddonData[] = [{
                    Key: '1',
                    field1: getCurrentUserUUID(addonService.papiClient)
                }];
                await usersSchemaService!.upsertBatch(userDocuments);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, usersSchemaService!.schemaName!, (userDocuments as BasicRecord[]));
            });

            it('Preparations - wait for PNS after documents upsertion.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('System filter type "Account", expect to get table pointing to accounts and not users', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('Account');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check we got a valid response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.length).to.be.at.least(1);

                // Check table pointing to accounts is in response
                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToAccounts).to.not.be.undefined;

                // Check table pointing to users is not in response
                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.be.undefined;
            });

            it('System filter type "User", expect to get table pointing to users and not accounts', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('User');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schema is in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.length).to.be.at.least(1);

                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.not.be.undefined;

                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToAccounts).to.be.undefined;
            });

            it('System filter type "None", expect to get both tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('None');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.length).to.be.at.least(2);

                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.not.be.undefined;
                expect(schemaPointingToAccounts).to.not.be.undefined;
            });

            it('System filter type "Account", using futuristicTimeStamp, expect to get zero tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('Account');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(futuristicTimeStamp, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check we got a valid response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.length).to.be.equal(0);
            });

            it('System filter type "User", using futuristicTimeStamp, expect to get zero tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('User');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(futuristicTimeStamp, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schema is in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.length).to.be.equal(0);
            });

            it('System filter type "None", using futuristicTimeStamp, expect to get zero tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('None');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(futuristicTimeStamp, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.length).to.be.equal(0);
            });

            it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
                await cleanUp(resourceManager, performanceManager);
            });
        });

        describe('Tables with documents that does not point to current user/account', () => {

            // Preparations parameters
            const timeStampBeforeCreation = new Date().toISOString();
            let usersSchemaService: ADALTableService | undefined = undefined;
            let accountsSchemaService: ADALTableService | undefined = undefined;

            it('Preparations - create a table pointing to accounts.', async () => {
                accountsSchemaService = await resourceManager.createAdalTable(getSchemaPointingToAccounts());
                await nebulatestService.pnsInsertSchema(testingAddonUUID, accountsSchemaService!.schemaName!);
                console.debug(`Accounts Schema: ${accountsSchemaService?.schemaName}`);
            });

            it('Preparations - create a table pointing to users.', async () => {
                usersSchemaService = await resourceManager.createAdalTable(getSchemaPointingToUsers());
                await nebulatestService.pnsInsertSchema(testingAddonUUID, usersSchemaService!.schemaName!);
                console.debug(`Users Schema: ${usersSchemaService?.schemaName}`);
            });

            it('Preparations - wait for PNS after table creation.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('Preparations - upsert a document that points an account which does not point to current user.', async () => {
                const accountDocuments: AddonData[] = [{
                    Key: '1',
                    field1: (await accountUsersService.getAccountNotPointingToCurrentUser()).UUID
                }];
                await accountsSchemaService!.upsertBatch(accountDocuments);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, accountsSchemaService!.schemaName!, (accountDocuments as BasicRecord[]));
            });

            it('Preparations - upsert a document that points to a user which is not current user.', async () => {

                const userDocuments: AddonData[] = [{
                    Key: '1',
                    field1: (await usersService.getNotCurrentUser()).UUID
                }];
                await usersSchemaService!.upsertBatch(userDocuments);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, usersSchemaService!.schemaName!, (userDocuments as BasicRecord[]));
            });

            it('Preparations - wait for PNS after documents upsertion.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('System filter type "Account", expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('Account', (await accountUsersService.getAccountPointingToCurrentUser()).UUID);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check we got a valid response
                expect(resourcesRequiringSync).to.not.be.undefined;

                // Check table pointing to accounts is not in response
                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToAccounts).to.be.undefined;

                // Check table pointing to users is not in response
                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.be.undefined;
            });

            it('System filter type "User", expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('User');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schema is in response
                expect(resourcesRequiringSync).to.not.be.undefined;

                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.be.undefined;

                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToAccounts).to.be.undefined;
            });

            it('System filter type "None", expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('None');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;

                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.be.undefined;
                expect(schemaPointingToAccounts).to.be.undefined;
            });

            it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
                await cleanUp(resourceManager, performanceManager);
            });
        });

        describe('Hidden table with documents', () => {

            // Preparations parameters
            const timeStampBeforeCreation = new Date().toISOString();
            const futuristicTimeStamp = new Date(Date.now() + 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 10).toISOString();
            let usersSchemaService: ADALTableService | undefined = undefined;

            it('Preparations - create a table pointing to users.', async () => {
                usersSchemaService = await resourceManager.createAdalTable(getSchemaPointingToUsers());
                await nebulatestService.pnsInsertSchema(testingAddonUUID, usersSchemaService!.schemaName!);
                console.debug(`Users Schema: ${usersSchemaService?.schemaName}`);
            });

            it('Preparations - wait for PNS after table creation.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('Preparations - upsert documents into table pointing to users.', async () => {
                const userDocuments: AddonData[] = [{
                    Key: '1',
                    field1: getCurrentUserUUID(addonService.papiClient)
                }];
                await usersSchemaService!.upsertBatch(userDocuments);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, usersSchemaService!.schemaName!, (userDocuments as BasicRecord[]));
            });

            it('Preparations - wait for PNS after documents upsertion.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('Preparations - hide table.', async () => {
                const schema = usersSchemaService!.getSchema();
                schema.Hidden = true;
                await usersSchemaService!.updateSchema(schema);
                await nebulatestService.pnsUpdateSchemaHiddenStatus(testingAddonUUID, usersSchemaService!.schemaName!, true);
            });

            it('Preparations - wait for PNS after hiding table.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('System filter type "None", expect to not get hidden table', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('None');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, true, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;

                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.be.undefined;
            });

            it('Cleanup - unhide table for purging.', async () => {
                const schema = usersSchemaService!.getSchema();
                schema.Hidden = false;
                await usersSchemaService!.updateSchema(schema);
                await nebulatestService.pnsUpdateSchemaHiddenStatus(testingAddonUUID, usersSchemaService!.schemaName!, true);
            });

            it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
                await cleanUp(resourceManager, performanceManager);
            });
        });

        describe('Table with documents - verify we get type & sync data', () => {

            // Preparations parameters
            const timeStampBeforeCreation = new Date().toISOString();
            let usersSchemaService: ADALTableService | undefined = undefined;

            it('Preparations - create a table pointing to users.', async () => {
                usersSchemaService = await resourceManager.createAdalTable(getSchemaPointingToUsers());
                await nebulatestService.pnsInsertSchema(testingAddonUUID, usersSchemaService!.schemaName!);
                console.debug(`Users Schema: ${usersSchemaService?.schemaName}`);
            });

            it('Preparations - wait for PNS after table creation.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('Preparations - upsert documents into table pointing to users.', async () => {
                const userDocuments: AddonData[] = [{
                    Key: '1',
                    field1: getCurrentUserUUID(addonService.papiClient)
                }];
                await usersSchemaService!.upsertBatch(userDocuments);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, usersSchemaService!.schemaName!, (userDocuments as BasicRecord[]));
            });

            it('Preparations - wait for PNS after documents upsertion.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('System filter type "None", expect to get table with type and sync data fields', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('None');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, true, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas & fields are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.length).to.be.at.least(1);
                expect(resourcesRequiringSync[0].Type).to.not.be.undefined;
                expect(resourcesRequiringSync[0].SyncData).to.not.be.undefined;
            });

            it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
                await cleanUp(resourceManager, performanceManager);
            });
        });

    });
    
}

function getShortUUID(): string {
    return uuidv4().split('-')[0];
}

function getCurrentUserUUID(papiClient: PapiClient): string {
    const decodedToken: any = jwt(papiClient['options'].token);
    const currentUser = decodedToken["pepperi.useruuid"];
    return currentUser;
}
