//00000000-0000-0000-0000-000000006a91
import { PapiClient } from '@pepperi-addons/papi-sdk';
import GeneralService from '../../../potentialQA_SDK/server_side/general.service';
import jwtDecode from "jwt-decode";
import { GetResourcesRequiringSyncParameters, GetResourcesRequiringSyncResponse, GetRecordsRequiringSyncParameters } from '../../entities/nebula/types';
import { BasicRecord } from './NebulaPNSEmulator.service';

export interface GetRecordsRequiringSyncResponse {
    Keys: string[],
    HiddenKeys: string[]
};

export interface unitTestsResult {
    "stats": {
        "suites": number,
        "tests": number,
        "passes": number,
        "pending": number,
        "failures": number,
        "start": string
        "end": string
        "duration": number
    },
    "tests":
    {
        "title": string
        "duration": number
        "failed": boolean,
        "passed": boolean,
        "suite": string,
        "superSuite": string
    }[]
}

export class NebulaTestService {
    pnsInsertRecords(testingAddonUUID: string, tableName: string, test_7_items: import("./NebulaPNSEmulator.service").BasicRecord[]) {
        return
    }

    async pnsUpdateRecords(addonUUID: string, resource: string, oldRecords: BasicRecord[], newRecords: BasicRecord[]) {
        return
    }
    //     try {
    //         return await this.routerClient.post(this.nebulaCypherRelativeURL, {
    //             "Query": cypher
    //         });
    //     }
    //     catch (ex) {
    //         console.error(`Error in sendCypherToNebula: ${ex}`);
    //         throw new Error((ex as { message: string }).message);
    //     }
    // }
    initPNS() {
        return
    }

    async pollExecution(papiClient: PapiClient, ExecutionUUID: string, interval = 1000, maxAttempts = 60, validate = (res) => {
        return res != null && (res.Status.Name === 'Failure' || res.Status.Name === 'Success');
    }) {
        let attempts = 0;

        const executePoll = async (resolve, reject) => {
            console.log(`Polling execution ${ExecutionUUID} attempt ${attempts}`);
            const result = await papiClient.get(`/audit_logs/${ExecutionUUID}`);
            attempts++;

            if (validate(result)) {
                return resolve({ "success": result.Status.Name === 'Success', "errorCode": 0, 'resultObject': result.AuditInfo.ResultObject });
            }
            else if (maxAttempts && attempts === maxAttempts) {
                return resolve({ "success": false, "errorCode": 1 });
            }
            else {
                setTimeout(executePoll, interval, resolve, reject);
            }
        };

        return new Promise<any>(executePoll);
    }

    async runUnitTests(): Promise<unitTestsResult> {
        try {
            const result = await this.addonService.post(this.nebulaUnitTests, {});
            const executionID = result.ExecutionUUID;
            const pollResult = await this.pollExecution(this.addonService, executionID, 5000, 100);
            if (pollResult.success) {
                return JSON.parse(pollResult.resultObject);
            }
            else {
                throw new Error(`Error in runUnitTests: ${pollResult.errorCode}`);
            }
        }
        catch (ex) {
            console.error(`Error in runUnitTests: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    pnsUpdateSchemaSyncStatus(testingAddonUUID: string, tableName: string, arg2: boolean) {
        return
    }
    pnsInsertSchema(testingAddonUUID: string, tableName: string) {
        return;
    }

    pnsUpdateSchemaHiddenStatus(addonUUID: string, resource: string, hiddenNewValue: boolean) {
        return;
    }
    papiClient: PapiClient;
    routerClient: PapiClient;
    generalService: GeneralService;
    dataObject: any; // the 'Data' object passed inside the http request sent to start the test -- put all the data you need here
    distributorUUID: any;

    constructor(public systemService: GeneralService, public addonService: PapiClient, dataObject: any) {
        this.papiClient = systemService.papiClient; // client which will ALWAYS go OUT
        this.generalService = systemService;
        this.routerClient = addonService; // will run according to passed 'isLocal' flag
        this.dataObject = dataObject;
        this.distributorUUID = (jwtDecode(this.papiClient['options'].token)['pepperi.distributoruuid']).toLowerCase();
    }

    nebulaAddonUUID = '00000000-0000-0000-0000-000000006a91';

    nebulaAsyncRelativeURL = `/addons/api/async/${this.nebulaAddonUUID}`;
    nebulaSyncRelativeURL = `/addons/api/${this.nebulaAddonUUID}`;

    nebulaGetResourcesRequiringSyncRelativeURL = `${this.nebulaSyncRelativeURL}/api/get_resources_requiring_sync`;
    nebulaGetRecordsRequiresSyncRelativeURL = `${this.nebulaSyncRelativeURL}/api/get_record_keys_requiring_sync`;
    nebulaGetRecordsRelativeURL = `${this.nebulaSyncRelativeURL}/inner_endpoints/get_records_of_schema_from_nebula`;
    nebulaUnitTests = `${this.nebulaAsyncRelativeURL}/tests/neptune_graph_service`

    getRecordLabelFromAddonUUIDAndResource(addonUUID: string, resource: string) {
        return `Record_${this.replaceDashWithUnderscore(this.distributorUUID)}_${this.replaceDashWithUnderscore(addonUUID)}_${resource}`;
    }

    replaceDashWithUnderscore(str: string) {
        return str.replace(/-/g, '_');
    }

    async getResourcesRequiringSync(parameters: GetResourcesRequiringSyncParameters): Promise<GetResourcesRequiringSyncResponse[]> {
        try {
            return (await this.routerClient.post(this.nebulaGetResourcesRequiringSyncRelativeURL, {
                ModificationDateTime: parameters.ModificationDateTime,
                IncludeDeleted: parameters.IncludeDeleted ?? false,
                SystemFilter: parameters.SystemFilter
            })).results;
        }
        catch (error) {
            console.error(`Error in getSchemasRequiringSync: ${(error as Error).message}`);
            throw error;
        }
    }

    async getRecordsRequiringSync(parameters: GetRecordsRequiringSyncParameters): Promise<GetRecordsRequiringSyncResponse> {
        try {
            return await this.routerClient.post(`${this.nebulaGetRecordsRequiresSyncRelativeURL}?addon_uuid=${parameters.AddonUUID}&resource=${parameters.Resource}`, {
                ModificationDateTime: parameters.ModificationDateTime,
                IncludeDeleted: parameters.IncludeDeleted,
                SystemFilter: parameters.SystemFilter
            });
        }
        catch (error) {
            console.error(`Error in getRecordsRequiringSync: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * wait for 30 seconds
     */
    async waitForPNS() {
        const pnsDelaySeconds = 30;
        console.log(`Waiting for ${pnsDelaySeconds} seconds for PNS to catch up...`);
        await this.generalService.sleep(pnsDelaySeconds * 1000);
        console.log(`Done waiting for PNS`);
    }
}
