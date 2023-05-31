//00000000-0000-0000-0000-000000006a91
import { PerformanceManager } from "./services/performance_management/performance_manager";
import { ResourceManagerService } from "./services/resource_management/resource_manager.service";
import { AddonData, AddonDataScheme, PapiClient } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "./services/resource_management/adal_table.service";
import { v4 as uuidv4 } from 'uuid';
import { AddonUUID as testingAddonUUID } from "../../../addon.config.json";
import { BasicRecord } from "./services/NebulaPNSEmulator.service";
import jwt from 'jwt-decode';
import { GetRecordsRequiringSyncParameters, GetResourcesRequiringSyncParameters, PathDestination } from "../entities/nebula/types";
import { NebulaServiceFactory } from "./services/NebulaServiceFactory";
import { AccountsService } from "./services/accounts.service";
import { AccountUser, AccountUsersService } from "./services/account-users.service";
import { UsersService } from "./services/users.service";
import { GeneralService, TesterFunctions } from "test_infra";
import { FabulaService } from "./services/febula/febula.service";
import { EmployeeType, FilterObject, ProfileFilterObject } from "./services/febula/types";
import { GeneralService, TesterFunctions } from "../../potentialQA_SDK/src/infra_services/general.service";

export async function NebulaTest(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions) {

    // the 'Data' object passed inside the http request sent to start the test -- put all the data you need here
    const dataObj = request.body.Data;
    const isLocal = request.body.isLocal;
    //setting 'mocha verbs' to use
    const describe = tester.describe;
    const expect = tester.expect;
    const it = tester.it;

    const automationAddonUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4";

    async function cleanUp(resourceManager: ResourceManagerService, performanceManager: PerformanceManager) {
        //TODO: add PNS cleanup here
        await resourceManager.cleanup();
        console.log(JSON.stringify(performanceManager.getStatistics()));
    }

    function buildGetRecordsRequiringSyncParameters(tableName: string, token: string): GetRecordsRequiringSyncParameters {
        return {
            AddonUUID: automationAddonUUID,
            Resource: tableName,
            Token: token,
        };
    }

    function buildPathData(destinations?: PathDestination[], includedResources: string[] = [], excludedResources: string[] = []): GetResourcesRequiringSyncParameters['PathData'] {

        return {
            Destinations: destinations ?? [],
            IncludedResources: includedResources,
            ExcludedResources: excludedResources,
            PermissionSet: 'Sync'
        } as GetResourcesRequiringSyncParameters['PathData'];
    }

    function buildGetResourcesRequiringSyncParameters(pathData: GetResourcesRequiringSyncParameters['PathData'], modificationDateTime?: string, includeDeleted: boolean = false): GetResourcesRequiringSyncParameters {
        return {
            IncludeDeleted: includeDeleted,
            ModificationDateTime: modificationDateTime,
            PathData: pathData
        } as GetResourcesRequiringSyncParameters;
    }

    function getAccountPathData(accountUUID: string): GetResourcesRequiringSyncParameters['PathData'] {
        return buildPathData([
            { Resource: 'accounts', Key: accountUUID },
            { Resource: 'users', Key: usersService.getCurrentUserUUID() },
        ], ['accounts'], []);
    }

    function getUsersPathData(): GetResourcesRequiringSyncParameters['PathData'] {
        return buildPathData([
            { Resource: 'users', Key: usersService.getCurrentUserUUID() },
        ], [], ['accounts']);
    }
    
    async function getTokenForDocuments(nebulatestService, schemaName: string, pathData: GetResourcesRequiringSyncParameters['PathData'], timeStamp?: string, includeDeleted: boolean = false): Promise<string> {
        const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStamp, includeDeleted);
        const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

        expect(resourcesRequiringSync).to.not.be.undefined;
        const currentlyTestedResource = resourcesRequiringSync.find(resource => resource.Resource === schemaName);        
        return currentlyTestedResource?.Token;
    }

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
            const pathData = buildPathData();
            const token = await getTokenForDocuments(nebulatestService, tableName, pathData);
            expect(token).to.not.be.undefined;
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName, token);
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
            const pathData = buildPathData();
            let token = await getTokenForDocuments(nebulatestService, tableName, pathData);
            expect(token).to.be.undefined;

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
            token = await getTokenForDocuments(nebulatestService, tableName, pathData);
            expect(token).to.not.be.undefined;
            let getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName, token);
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
            const pathData = buildPathData();
            let token = await getTokenForDocuments(nebulatestService, tableName, pathData);
            expect(token).to.not.be.undefined;
            let getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName, token);
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

            // try to get token for test_7_table:
            token = await getTokenForDocuments(nebulatestService, tableName, pathData);
            expect(token).to.be.undefined;

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
            const pathData = buildPathData();
            let getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, currentTimeX);
            const resourcesRequiringSyncX = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);
            console.log(`resourcesRequiringSyncX: ${JSON.stringify(resourcesRequiringSyncX)}`);

            // check that the resource is in the list
            expect(resourcesRequiringSyncX.find(resource => resource.Resource === tableName)).to.not.equal(undefined);

            // get records requiring sync using X
            let token = await getTokenForDocuments(nebulatestService, tableName, pathData, currentTimeX);
            expect(token).to.not.be.undefined;
            let getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName, token);
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
            getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, currentTimeY);
            const resourcesRequiringSyncY = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);
            console.log(`resourcesRequiringSyncY: ${JSON.stringify(resourcesRequiringSyncY)}`);

            // check that the resource is not in the list
            expect(resourcesRequiringSyncY.find(resource => resource.Resource === tableName)).to.be.undefined;

            // try to get records requiring sync using Y
            token = await getTokenForDocuments(nebulatestService, tableName, pathData, currentTimeY);
            expect(token).to.be.undefined;

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
            token = await getTokenForDocuments(nebulatestService, tableName, pathData, currentTimeY);
            expect(token).to.not.be.undefined;
            getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName, token);
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
            const pathData = buildPathData();
            let getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, currentTimeX);
            const resourcesRequiringSyncX = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);
            console.log(`resourcesRequiringSyncX: ${JSON.stringify(resourcesRequiringSyncX)}`);

            // check that the resource is in the list
            expect(resourcesRequiringSyncX.find(resource => resource.Resource === tableName)).to.not.equal(undefined);

            // get records requiring sync using X
            let token = await getTokenForDocuments(nebulatestService, tableName, pathData, currentTimeX);
            expect(token).to.not.be.undefined;
            let getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName, token);
            const recordsRequiringSyncX = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            console.log(`recordsRequiringSyncX: ${JSON.stringify(recordsRequiringSyncX)}`);

            // check that the records are not in the list
            expect(recordsRequiringSyncX.Keys.length).to.equal(0);

            // get resources requiring sync using X with IncludeDeleted = true
            getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, currentTimeX, true);
            const resourcesRequiringSyncX2 = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);
            console.log(`resourcesRequiringSyncX2: ${JSON.stringify(resourcesRequiringSyncX2)}`);

            // check that the resource is in the list
            expect(resourcesRequiringSyncX2.find(resource => resource.Resource === tableName)).to.not.equal(undefined);

            // get records requiring sync using X with IncludeDeleted = true
            token = await getTokenForDocuments(nebulatestService, tableName, pathData, currentTimeX, true);
            expect(token).to.not.be.undefined;
            getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName, token);
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
            const pathData = buildPathData();
            let token = await getTokenForDocuments(nebulatestService, tableName, pathData);
            expect(token).to.not.equal(undefined);
            let getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(tableName, token);
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
        let resourceToken: string | undefined = undefined;

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

        it('Preparations - get token from get schemes', async () => {
            const pathData = buildPathData();
            resourceToken = await getTokenForDocuments(nebulatestService, pointingSchemaService!.schemaName!, pathData, timeStampBeforeCreation);
            expect(resourceToken).to.not.be.undefined;
        });

        it('Call getRecordsRequiringSync, expect only documents pointing to user in result', async () => {
            assertInitialPreparations();

            // Check only documents that points to current user are retrieved.
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName!, resourceToken!);
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
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName!, resourceToken!);
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
        let resourceToken: string | undefined = undefined;

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

        it('Preparations - get token from get schemes', async () => {
            const pathData = buildPathData();
            resourceToken = await getTokenForDocuments(nebulatestService, pointingSchemaService!.schemaName!, pathData, timeStampBeforeCreation);
            expect(resourceToken).to.not.be.undefined;
        });

        it('Call getRecordsRequiringSync, expect only documents pointing to "current account" (account that point to current user) in result', async () => {
            assertInitialPreparations();

            // Check only documents that points to "current account" (account that point to current user) are retrieved.
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName, resourceToken!);
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
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName, resourceToken!);
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
            //const filter = buildSystemFilter(accounts.pointingAccount.UUID!)
            const pathData = getAccountPathData(accounts.pointingAccount.UUID!)
            const token = await getTokenForDocuments(nebulatestService, pointingSchemaService!.schemaName!, pathData, timeStampBeforeCreation, false);
            expect(token).to.not.be.undefined;

            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName, token);
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
            //const filter = buildSystemFilter(accounts.otherAccount.UUID!);
            const pathData = getAccountPathData(accounts.otherAccount.UUID!)
            const token = await getTokenForDocuments(nebulatestService, pointingSchemaService!.schemaName!, pathData, timeStampBeforeCreation, false);
            expect(token).to.not.be.undefined;

            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName, token);
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
        let accountUUID: string;
        const documentKey = '1';
        let pointingSchemaService: ADALTableService | undefined = undefined;
        let resourceToken: string | undefined = undefined;

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

        it('Preparations - get token from get schemes', async () => {
            const pathData = buildPathData();
            resourceToken = await getTokenForDocuments(nebulatestService, pointingSchemaService!.schemaName!, pathData, timeStampBeforeCreation, true);
            expect(resourceToken).to.not.be.undefined;
        });

        it('Call getRecordsRequiringSync, expect document to be returned as a hidden node', async () => {

            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName, resourceToken!);
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
                const account = await accountUsersService.getAccountPointingToCurrentUser();
                const pathData = getAccountPathData(account.UUID!);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
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
                const pathData = getUsersPathData();
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
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
                const pathData = buildPathData();
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
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
            let accountUUID: string | undefined = undefined;
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

                const account = await accountUsersService.getAccountPointingToCurrentUser();
                accountUUID = account.UUID;
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
                const pathData = getAccountPathData(accountUUID!);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
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
                const pathData = getUsersPathData();
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
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
                const pathData = buildPathData();
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
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
                const pathData = getAccountPathData(accountUUID!);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, futuristicTimeStamp, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check we got a valid response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.length).to.be.equal(0);
            });

            it('System filter type "User", using futuristicTimeStamp, expect to get zero tables', async () => {
                // Get schemas that have the account in their path
                const pathData = getUsersPathData();
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, futuristicTimeStamp, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schema is in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.length).to.be.equal(0);
            });

            it('System filter type "None", using futuristicTimeStamp, expect to get zero tables', async () => {
                // Get schemas that have the account in their path
                const pathData = buildPathData();
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, futuristicTimeStamp, false);
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
                const pathData = getAccountPathData((await accountUsersService.getAccountPointingToCurrentUser()).UUID!);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
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
                const pathData = getUsersPathData();
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
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
                const pathData = buildPathData();
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
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
                const pathData = buildPathData();
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, true);
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
                const pathData = buildPathData();
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, true);
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
    
    describe('GetSchemesRequiringSync - Path Data', () => {
        const nebulatestService = NebulaServiceFactory.getNebulaService(generalService, addonService.papiClient, dataObj, isLocal);
        const performanceManager: PerformanceManager = new PerformanceManager();
        const resourceManager: ResourceManagerService = new ResourceManagerService(generalService.papiClient, automationAddonUUID);
        const febulaService = new FabulaService(addonService.papiClient);
        const USERS_TABLE = 'users';
        const ACCOUNTS_TABLE = 'accounts';
    });    
}

        function getSchemaPointingToResource(resource: string, field: string, referencedAddonUUID: string): AddonDataScheme {
            return {
                Name: `nebula_test_point_to_${resource}_${getShortUUID()}`,
                Type: "data",
                Fields:
                {
                    [field]: {
                        Type: "Resource",
                        ApplySystemFilter: true,
                        AddonUUID: referencedAddonUUID,
                        Resource: resource
                    },
                },
                SyncData: {
                    Sync: true
                },
                GenericResource: true
            };
        }

        describe('single 2 hop path to user from resource (not accounts), X -> Y -> users', () => {

            // Preparations parameters
            const timeStampBeforeCreation = new Date().toISOString();
            let ySchemaService: ADALTableService | undefined = undefined;
            let xSchemaService: ADALTableService | undefined = undefined;
            const profileFilterKey = uuidv4();
            const filterName = 'testFilter' + getShortUUID();
            const yFieldName = 'UserRef';
            const xFieldName = 'YRef';

            function getFilter(): FilterObject {
                return {
                    Key: filterName,
                    Name: filterName,
                    Resource: ySchemaService!.schemaName!,
                    Field: 'Key',
                    PreviousField: yFieldName,
                    PreviousFilter: "CurrentUser",
                };
            }

            function getProfileFilter(): ProfileFilterObject {
                return {
                    Key: profileFilterKey,
                    EmployeeType: 1,
                    Resource: ySchemaService!.schemaName!,
                    Filter: filterName
                };
            }

            it('Preparations - create a table pointing to users.', async () => {
                ySchemaService = await resourceManager.createAdalTable(getSchemaPointingToResource(USERS_TABLE, yFieldName, CORE_RESOURCES_UUID));
                await nebulatestService.pnsInsertSchema(testingAddonUUID, ySchemaService!.schemaName!);
                console.debug(`Y Schema name is: ${ySchemaService?.schemaName}`);
            });

            it('Preparations - create a table pointing to previous table.', async () => {
                xSchemaService = await resourceManager.createAdalTable(getSchemaPointingToResource(ySchemaService!.schemaName!, xFieldName, automationAddonUUID));
                await nebulatestService.pnsInsertSchema(testingAddonUUID, xSchemaService!.schemaName!);
                console.debug(`X Schema name is: ${xSchemaService?.schemaName}`);
            });

            it('Preparations - wait for PNS after table creation.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('Preparations - upsert filter.', async () => {
                // We must create the filter before the profile filter otherwise it will fail the validation
                const filter = getFilter();
                const result = await febulaService.upsertFilter(filter);
                // await nebulatestService.pnsInsertFilter(result.Key); // Disabled because it is meaningless without the profile filter
                console.debug(`Filter name is: ${result.Name}`);
                console.debug(`Filter key is: ${result.Key}`);
            });

            it('Preparations - upsert profile filter.', async () => {
                const profileFilter = getProfileFilter();
                const result = await febulaService.upsertProfileFilter(profileFilter);
                await nebulatestService.pnsInsertProfileFilter(result.Key);
                console.debug(`Profile filter key is: ${result.Key}`);
            });

            it('Preparations - wait for PNS after profile/filter upsertion.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('Preparations - upsert documents into Y table.', async () => {
                const userDocuments: AddonData[] = [{
                    Key: '1',
                    [yFieldName]: usersService.getCurrentUserUUID()
                }];
                await ySchemaService!.upsertBatch(userDocuments);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, ySchemaService!.schemaName!, (userDocuments as BasicRecord[]));
            });

            it('Preparations - upsert documents into table X table.', async () => {
                const documents: AddonData[] = [{
                    Key: '1',
                    [xFieldName]: '1'
                }];
                await xSchemaService!.upsertBatch(documents);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, xSchemaService!.schemaName!, (documents as BasicRecord[]));
            });

            it('Preparations - wait for PNS after documents upsertion.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('get resources requiring sync pointing to current user without passing "accounts" table, expect to get tables', async () => {
                // Get schemas that have the account in their path
                const pathData = getUsersPathData();
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('get resources requiring sync pointing to a different user, expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const pathData = getUsersPathData();
                pathData!.Destinations![0].Key = (await usersService.getNotCurrentUser()).UUID!;
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('get resources requiring sync pointing to current user who don`t pass thro "users" table, expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const pathData = getUsersPathData();
                pathData!.ExcludedResources! = [USERS_TABLE];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('trim path to Y table existent document, expect to get both tables', async () => {
                // Get schemas that have the account in their path
                const pathData = buildPathData([{
                    Resource: ySchemaService!.schemaName!,
                    Key: '1'
                }]);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('trim path to Y table non-existent document, expect to get only table Y', async () => {
                // Get schemas that have the account in their path
                const pathData = buildPathData([{
                    Resource: ySchemaService!.schemaName!,
                    Key: '2'
                }]);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('get resources requiring sync with accounts table in the path, expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const pathData = buildPathData(undefined, ['accounts']);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it(`Cleanup Of All Inserted profiles/filters`, async () => {
                const filter = getFilter();
                await febulaService.deleteFilter(filter);

                const profileFilter = getProfileFilter();
                await febulaService.deleteProfileFilter(profileFilter);
            });

            it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
                await cleanUp(resourceManager, performanceManager);
            });

        });

        describe('single 2 hop path to accounts, X -> Y -> accounts -> account_users -> users', () => {

            // Preparations parameters
            const timeStampBeforeCreation = new Date().toISOString();
            let ySchemaService: ADALTableService | undefined = undefined;
            let xSchemaService: ADALTableService | undefined = undefined;
            const profileFilterKey = uuidv4();
            const filterName = 'testFilter' + getShortUUID();
            const yFieldName = 'AccountRef';
            const xFieldName = 'YRef';

            function getFilter(): FilterObject {
                return {
                    Key: filterName,
                    Name: filterName,
                    Resource: ySchemaService!.schemaName!,
                    Field: 'Key',
                    PreviousField: yFieldName,
                    PreviousFilter: "ConnectedAccounts",
                };
            }

            function getProfileFilter(): ProfileFilterObject {
                return {
                    Key: profileFilterKey,
                    EmployeeType: getCurrentEmployeeType(addonService.papiClient),
                    Resource: ySchemaService!.schemaName!,
                    Filter: filterName
                };
            }

            it('Preparations - create a table pointing to accounts.', async () => {
                ySchemaService = await resourceManager.createAdalTable(getSchemaPointingToResource(ACCOUNTS_TABLE, yFieldName, CORE_RESOURCES_UUID));
                await nebulatestService.pnsInsertSchema(testingAddonUUID, ySchemaService!.schemaName!);
                console.debug(`Y Schema name is: ${ySchemaService?.schemaName}`);
            });

            it('Preparations - create a table pointing to previous table.', async () => {
                xSchemaService = await resourceManager.createAdalTable(getSchemaPointingToResource(ySchemaService!.schemaName!, xFieldName, automationAddonUUID));
                await nebulatestService.pnsInsertSchema(testingAddonUUID, xSchemaService!.schemaName!);
                console.debug(`X Schema name is: ${xSchemaService?.schemaName}`);
            });

            it('Preparations - wait for PNS after table creation.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('Preparations - upsert filter.', async () => {
                // We must create the filter before the profile filter otherwise it will fail the validation
                const filter = getFilter();
                const result = await febulaService.upsertFilter(filter);
                // await nebulatestService.pnsInsertFilter(result.Key); // Disabled because it is meaningless without the profile filter
                console.debug(`Filter name is: ${result.Name}`);
                console.debug(`Filter key is: ${result.Key}`);
            });

            it('Preparations - upsert profile filter.', async () => {
                const profileFilter = getProfileFilter();
                const result = await febulaService.upsertProfileFilter(profileFilter);
                await nebulatestService.pnsInsertProfileFilter(result.Key);
                console.debug(`Profile filter key is: ${result.Key}`);
            });

            it('Preparations - wait for PNS after profile/filter upsertion.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('Preparations - upsert documents into Y table.', async () => {
                const documents: AddonData[] = [{
                    Key: '1',
                    [yFieldName]: (await accountUsersService.getAccountPointingToCurrentUser()).UUID!
                }];
                await ySchemaService!.upsertBatch(documents);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, ySchemaService!.schemaName!, (documents as BasicRecord[]));
            });

            it('Preparations - upsert documents into table X table.', async () => {
                const documents: AddonData[] = [{
                    Key: '1',
                    [xFieldName]: '1'
                }];
                await xSchemaService!.upsertBatch(documents);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, xSchemaService!.schemaName!, (documents as BasicRecord[]));
            });

            it('Preparations - wait for PNS after documents upsertion.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('get resources requiring sync with accounts table in the path, expect to get both tables', async () => {
                // Get schemas that have the account in their path
                const pathData = buildPathData(undefined, ['accounts']);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('get resources requiring sync pointing to current user, expect to get tables', async () => {
                const pathData = getUsersPathData();
                pathData!.ExcludedResources = [];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('get resources requiring sync pointing to current user who don`t pass thro "users" table, expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const pathData = getUsersPathData();
                pathData!.ExcludedResources! = [USERS_TABLE];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('get resources requiring sync pointing to current user not via accounts, expect to not get tables', async () => {
                const pathData = getUsersPathData();
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('get resources requiring sync pointing to current user with Y table in path, expect to only get X table', async () => {
                const pathData = getUsersPathData();
                pathData!.ExcludedResources! = [];
                pathData!.IncludedResources! = [ySchemaService!.schemaName!];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('get resources requiring sync pointing to current user not via Y table, expect to only get Y table', async () => {
                const pathData = getUsersPathData();
                pathData!.ExcludedResources! = [ySchemaService!.schemaName!];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('get resources requiring sync pointing to current with X table in path, expect to not get tables', async () => {
                const pathData = getUsersPathData();
                pathData!.ExcludedResources! = [];
                pathData!.IncludedResources! = [xSchemaService!.schemaName!];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('get resources requiring sync pointing to current user not via X table, expect to get both tables', async () => {
                const pathData = getUsersPathData();
                pathData!.ExcludedResources! = [xSchemaService!.schemaName!];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('get resources requiring sync pointing to a different user, expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const pathData = getUsersPathData();
                pathData!.Destinations![0].Key = (await usersService.getNotCurrentUser()).UUID!;
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('get resources requiring sync pointing to account that points to current user, expect to get tables', async () => {
                // Get schemas that have the account in their path
                const pathData = getAccountPathData((await accountUsersService.getAccountPointingToCurrentUser()).UUID!);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('get resources requiring sync pointing to account that points to a different user, expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const pathData = getAccountPathData((await accountUsersService.getAccountNotPointingToCurrentUser()).UUID!);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('trim path to Y table existent document, expect to get both tables', async () => {
                // Get schemas that have the account in their path
                const pathData = buildPathData([{
                    Resource: ySchemaService!.schemaName!,
                    Key: '1'
                }]);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('trim path to Y table non-existent document, expect to get only table Y', async () => {
                // Get schemas that have the account in their path
                const pathData = buildPathData([{
                    Resource: ySchemaService!.schemaName!,
                    Key: '2'
                }]);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });
            
            it(`Cleanup Of All Inserted profiles/filters`, async () => {
                const filter = getFilter();
                await febulaService.deleteFilter(filter);

                const profileFilter = getProfileFilter();
                await febulaService.deleteProfileFilter(profileFilter);
            });

            it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
                await cleanUp(resourceManager, performanceManager);
            });

        });

        describe('double 2 hop path tests (X → Y → users | X → account → account_users → users)', () => {

            // Preparations parameters
            const timeStampBeforeCreation = new Date().toISOString();
            let ySchemaService: ADALTableService | undefined = undefined;
            let xSchemaService: ADALTableService | undefined = undefined;
            const profileFilterKey = uuidv4();
            const filterName = 'testFilter' + getShortUUID();
            const yFieldName = 'UserRef';

            function getSchema(): AddonDataScheme {
                return {
                    Name: `nebula_test_2_2_hop_${getShortUUID()}`,
                    Type: "data",
                    Fields:
                    {
                        AccountRef: {
                            Type: "Resource",
                            ApplySystemFilter: true,
                            AddonUUID: CORE_RESOURCES_UUID,
                            Resource: ACCOUNTS_TABLE
                        },
                        YRef: {
                            Type: "Resource",
                            ApplySystemFilter: true,
                            AddonUUID: automationAddonUUID,
                            Resource: ySchemaService!.schemaName!
                        },
                    },
                    SyncData: {
                        Sync: true
                    },
                    GenericResource: true
                };
            }

            function getFilter(): FilterObject {
                return {
                    Key: filterName,
                    Name: filterName,
                    Resource: ySchemaService!.schemaName!,
                    Field: 'Key',
                    PreviousField: yFieldName,
                    PreviousFilter: "CurrentUser",
                };
            }

            function getProfileFilter(): ProfileFilterObject {
                return {
                    Key: profileFilterKey,
                    EmployeeType: getCurrentEmployeeType(addonService.papiClient),
                    Resource: ySchemaService!.schemaName!,
                    Filter: filterName
                };
            }

            it('Preparations - create table Y.', async () => {
                const schema = getSchemaPointingToResource(USERS_TABLE, yFieldName, CORE_RESOURCES_UUID);
                ySchemaService = await resourceManager.createAdalTable(schema);
                await nebulatestService.pnsInsertSchema(testingAddonUUID, ySchemaService!.schemaName!);
                console.debug(`Y Schema name is: ${ySchemaService?.schemaName}`);
            });

            it('Preparations - create a table pointing to previous table & accounts.', async () => {
                const schema = getSchema();
                xSchemaService = await resourceManager.createAdalTable(schema);
                await nebulatestService.pnsInsertSchema(testingAddonUUID, xSchemaService!.schemaName!);
                console.debug(`X Schema name is: ${xSchemaService?.schemaName}`);
            });

            it('Preparations - wait for PNS after table creation.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('Preparations - upsert filter.', async () => {
                // We must create the filter before the profile filter otherwise it will fail the validation
                const filter = getFilter();
                const result = await febulaService.upsertFilter(filter);
                // await nebulatestService.pnsInsertFilter(result.Key); // Disabled because it is meaningless without the profile filter
                console.debug(`Filter name is: ${result.Name}`);
                console.debug(`Filter key is: ${result.Key}`);
            });

            it('Preparations - upsert profile filter.', async () => {
                const profileFilter = getProfileFilter();
                const result = await febulaService.upsertProfileFilter(profileFilter);
                await nebulatestService.pnsInsertProfileFilter(result.Key);
                console.debug(`Profile filter key is: ${result.Key}`);
            });

            it('Preparations - wait for PNS after profile/filter upsertion.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('Preparations - upsert documents into Y table.', async () => {
                const documents: AddonData[] = [{
                    Key: '1',
                    [yFieldName]: usersService.getCurrentUserUUID()
                }];
                await ySchemaService!.upsertBatch(documents);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, ySchemaService!.schemaName!, (documents as BasicRecord[]));
            });

            it('Preparations - upsert documents into table X table.', async () => {
                const documents: AddonData[] = [{
                    Key: '1',
                    'YRef': '1',
                    'AccountRef': (await accountUsersService.getAccountPointingToCurrentUser()).UUID!
                }];
                await xSchemaService!.upsertBatch(documents);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, xSchemaService!.schemaName!, (documents as BasicRecord[]));
            });

            it('Preparations - wait for PNS after documents upsertion.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('get resources requiring sync with accounts table in the path, expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const pathData = buildPathData(undefined, ['accounts']);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('get resources requiring sync pointing to current user, expect to get both tables', async () => {
                const pathData = getUsersPathData();
                pathData!.ExcludedResources = [];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('get resources requiring sync pointing to current user who don`t pass thro "users" table, expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const pathData = getUsersPathData();
                pathData!.ExcludedResources! = [USERS_TABLE];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('get resources requiring sync pointing to current user where accounts table is not in path, expect to only get Y table', async () => {
                const pathData = getUsersPathData();
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('get resources requiring sync pointing to current user with Y table in path, expect to not get tables', async () => {
                const pathData = getUsersPathData();
                pathData!.ExcludedResources! = [];
                pathData!.IncludedResources! = [ySchemaService!.schemaName!];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('get resources requiring sync pointing to current user not via Y table, expect to only get Y table', async () => {
                const pathData = getUsersPathData();
                pathData!.ExcludedResources! = [ySchemaService!.schemaName!];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemes are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('get resources requiring sync pointing to current user with X table in path, expect to not get tables', async () => {
                const pathData = getUsersPathData();
                pathData!.ExcludedResources! = [];
                pathData!.IncludedResources! = [xSchemaService!.schemaName!];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('get resources requiring sync pointing to current user not via X table, expect to get both tables', async () => {
                const pathData = getUsersPathData();
                pathData!.ExcludedResources! = [xSchemaService!.schemaName!];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('get resources requiring sync pointing to a different user, expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const pathData = getUsersPathData();
                pathData!.Destinations![0].Key = (await usersService.getNotCurrentUser()).UUID!;
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('trim path to Y table existent document, expect to get both tables', async () => {
                // Get schemas that have the account in their path
                const pathData = buildPathData([{
                    Resource: ySchemaService!.schemaName!,
                    Key: '1'
                }]);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('trim path to Y table non-existent document, expect to get only table Y', async () => {
                // Get schemas that have the account in their path
                const pathData = buildPathData([{
                    Resource: ySchemaService!.schemaName!,
                    Key: '2'
                }]);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it(`Cleanup Of All Inserted profiles/filters`, async () => {
                const filter = getFilter();
                await febulaService.deleteFilter(filter);

                const profileFilter = getProfileFilter();
                await febulaService.deleteProfileFilter(profileFilter);
            });

            it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
                await cleanUp(resourceManager, performanceManager);
            });

        });

        describe('double 2 hop path to users with loop, X -> Y|users, Y -> X', () => {

            // Preparations parameters
            const timeStampBeforeCreation = new Date().toISOString();
            let ySchemaService: ADALTableService | undefined = undefined;
            let xSchemaService: ADALTableService | undefined = undefined;
            const profileFilterKey = uuidv4();
            const yTableName =  `nebula_test_Y_2_2_hop_${getShortUUID()}`
            const filterName = 'testFilter' + getShortUUID();
            const yFieldName = 'AccountRef';
            const xFieldName = 'UserRef';

            function getFilter(): FilterObject {
                return {
                    Key: filterName,
                    Name: filterName,
                    Resource: ySchemaService!.schemaName!,
                    Field: 'Key',
                    PreviousField: yFieldName,
                    PreviousFilter: "ConnectedAccounts",
                };
            }

            function getProfileFilter(): ProfileFilterObject {
                return {
                    Key: profileFilterKey,
                    EmployeeType: getCurrentEmployeeType(addonService.papiClient),
                    Resource: ySchemaService!.schemaName!,
                    Filter: filterName
                };
            }

            function getYSchema(): AddonDataScheme {
                return {
                    Name: yTableName,
                    Type: "data",
                    Fields:
                    {
                        XRef: {
                            Type: "Resource",
                            ApplySystemFilter: true,
                            AddonUUID: automationAddonUUID,
                            Resource: xSchemaService!.schemaName!
                        },
                    },
                    SyncData: {
                        Sync: true
                    },
                    GenericResource: true
                };
            }

            function getXSchema(): AddonDataScheme {
                return {
                    Name: `nebula_test_X_2_2_hop_${getShortUUID()}`,
                    Type: "data",
                    Fields:
                    {
                        UsersRef: {
                            Type: "Resource",
                            ApplySystemFilter: true,
                            AddonUUID: CORE_RESOURCES_UUID,
                            Resource: USERS_TABLE
                        },
                        YRef: {
                            Type: "Resource",
                            ApplySystemFilter: true,
                            AddonUUID: automationAddonUUID,
                            Resource: yTableName
                        },
                    },
                    SyncData: {
                        Sync: true
                    },
                };
            }

            it('Preparations - create X table.', async () => {
                const schema = getXSchema();
                xSchemaService = await resourceManager.createAdalTable(schema);
                await nebulatestService.pnsInsertSchema(testingAddonUUID, xSchemaService!.schemaName!);
                console.debug(`X Schema name is: ${xSchemaService?.schemaName}`);
            });

            it('Preparations - create Y table', async () => {
                const schema = getYSchema();
                ySchemaService = await resourceManager.createAdalTable(schema);
                await nebulatestService.pnsInsertSchema(testingAddonUUID, ySchemaService!.schemaName!);
                console.debug(`Y Schema name is: ${ySchemaService?.schemaName}`);
            });

            it('Preparations - wait for PNS after table creation.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('Preparations - upsert filter.', async () => {
                // We must create the filter before the profile filter otherwise it will fail the validation
                const filter = getFilter();
                const result = await febulaService.upsertFilter(filter);
                // await nebulatestService.pnsInsertFilter(result.Key); // Disabled because it is meaningless without the profile filter
                console.debug(`Filter name is: ${result.Name}`);
                console.debug(`Filter key is: ${result.Key}`);
            });

            it('Preparations - upsert profile filter.', async () => {
                const profileFilter = getProfileFilter();
                const result = await febulaService.upsertProfileFilter(profileFilter);
                await nebulatestService.pnsInsertProfileFilter(result.Key);
                console.debug(`Profile filter key is: ${result.Key}`);
            });

            it('Preparations - wait for PNS after profile/filter upsertion.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('Preparations - upsert documents into Y table.', async () => {
                const documents: AddonData[] = [{
                    Key: '1',
                    [yFieldName]: (await accountUsersService.getAccountPointingToCurrentUser()).UUID!
                }];
                await ySchemaService!.upsertBatch(documents);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, ySchemaService!.schemaName!, (documents as BasicRecord[]));
            });

            it('Preparations - upsert documents into table X table.', async () => {
                const documents: AddonData[] = [{
                    Key: '1',
                    [xFieldName]: '1'
                }];
                await xSchemaService!.upsertBatch(documents);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, xSchemaService!.schemaName!, (documents as BasicRecord[]));
            });

            it('Preparations - wait for PNS after documents upsertion.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('get resources requiring sync with accounts table in the path, expect to get both tables', async () => {
                // Get schemas that have the account in their path
                const pathData = buildPathData(undefined, ['accounts']);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('get resources requiring sync pointing to current user, expect to get tables', async () => {
                const pathData = getUsersPathData();
                pathData!.ExcludedResources = [];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('get resources requiring sync pointing to current user who don`t pass thro "users" table, expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const pathData = getUsersPathData();
                pathData!.ExcludedResources! = [USERS_TABLE];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('get resources requiring sync pointing to current user not via accounts, expect to not get tables', async () => {
                const pathData = getUsersPathData();
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('get resources requiring sync pointing to current user with Y table in path, expect to only get X table', async () => {
                const pathData = getUsersPathData();
                pathData!.ExcludedResources! = [];
                pathData!.IncludedResources! = [ySchemaService!.schemaName!];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('get resources requiring sync pointing to current user not via Y table, expect to only get Y table', async () => {
                const pathData = getUsersPathData();
                pathData!.ExcludedResources! = [ySchemaService!.schemaName!];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('get resources requiring sync pointing to current with X table in path, expect to not get tables', async () => {
                const pathData = getUsersPathData();
                pathData!.ExcludedResources! = [];
                pathData!.IncludedResources! = [xSchemaService!.schemaName!];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('get resources requiring sync pointing to current user not via X table, expect to get both tables', async () => {
                const pathData = getUsersPathData();
                pathData!.ExcludedResources! = [xSchemaService!.schemaName!];
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('get resources requiring sync pointing to a different user, expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const pathData = getUsersPathData();
                pathData!.Destinations![0].Key = (await usersService.getNotCurrentUser()).UUID!;
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('get resources requiring sync pointing to account that points to current user, expect to get tables', async () => {
                // Get schemas that have the account in their path
                const pathData = getAccountPathData((await accountUsersService.getAccountPointingToCurrentUser()).UUID!);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('get resources requiring sync pointing to account that points to a different user, expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const pathData = getAccountPathData((await accountUsersService.getAccountNotPointingToCurrentUser()).UUID!);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.be.undefined;
            });

            it('trim path to Y table existent document, expect to get both tables', async () => {
                // Get schemas that have the account in their path
                const pathData = buildPathData([{
                    Resource: ySchemaService!.schemaName!,
                    Key: '1'
                }]);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });

            it('trim path to Y table non-existent document, expect to get only table Y', async () => {
                // Get schemas that have the account in their path
                const pathData = buildPathData([{
                    Resource: ySchemaService!.schemaName!,
                    Key: '2'
                }]);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(pathData, timeStampBeforeCreation, false);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === xSchemaService!.schemaName)).to.be.undefined;
                expect(resourcesRequiringSync.find(resource => resource.Resource === ySchemaService!.schemaName)).to.not.be.undefined;
            });
            
            it(`Cleanup Of All Inserted profiles/filters`, async () => {
                const filter = getFilter();
                await febulaService.deleteFilter(filter);

                const profileFilter = getProfileFilter();
                await febulaService.deleteProfileFilter(profileFilter);
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

function getCurrentEmployeeType(papiClient: PapiClient): EmployeeType {
    const decodedToken: any = jwt(papiClient['options'].token);
    const employeeType = decodedToken["pepperi.employeetype"];
    return employeeType as EmployeeType;
}
