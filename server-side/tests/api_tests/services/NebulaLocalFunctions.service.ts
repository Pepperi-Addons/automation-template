import { PapiClient, Subscription } from "@pepperi-addons/papi-sdk";
import GeneralService from "../../../potentialQA_SDK/server_side/general.service";
import { NebulaTestService, unitTestsResult } from "./nebulatest.service";
import { Promise } from "bluebird";
import { BasicRecord, NebulaPNSEmulator, PNSPostBody } from "./NebulaPNSEmulator.service";
import { AddonUUID as testingAddonUUID } from "../../../../addon.config.json";
import { GetResourcesRequiringSyncParameters, GetResourcesRequiringSyncResponse, GetRecordsRequiringSyncParameters, GetRecordsRequiringSyncResponse } from "../../entities/nebula/types";

export class NebulaLocalFunctions extends NebulaTestService {

    savedSubscriptions: Subscription[] = [];
    pnsEmulator: NebulaPNSEmulator;
    nebulaAddonUUID = '00000000-0000-0000-0000-000000006a91';
    adalAddonUUID = '00000000-0000-0000-0000-00000000ada1';
    nebulaLocalRelativeURL = `http://localhost:4500`;
    originalBaseURL: string;

    nebulaGetResourcesRequiringSyncRelativeURL = `${this.nebulaLocalRelativeURL}/api/get_resources_requiring_sync`;
    nebulaGetRecordsRequiresSyncRelativeURL = `${this.nebulaLocalRelativeURL}/api/get_record_keys_requiring_sync`;
    nebulaGetRecordsRelativeURL = `${this.nebulaLocalRelativeURL}/inner_endpoints/get_records_of_schema_from_nebula`;
    nebulaSchemesChangesRelativeURL = `${this.nebulaLocalRelativeURL}/pns_endpoints/schemes_changes`;
    nebulaRecordChangesRelativeURL = `${this.nebulaLocalRelativeURL}/pns_endpoints/record_changes`;
    nebulaUnitTests = `${this.nebulaLocalRelativeURL}/tests/neptune_graph_service`

    constructor(public systemService: GeneralService, public addonService: PapiClient, dataObject: any) {
        super(systemService, addonService, dataObject);
        this.pnsEmulator = new NebulaPNSEmulator(addonService);
        this.originalBaseURL = this.addonService['options']['baseURL'];
    }

    async runUnitTests(): Promise<unitTestsResult> {
        try {
            this.routerClient['options']['baseURL'] = "";
            const result = await this.addonService.post(this.nebulaUnitTests, {});
            this.routerClient['options']['baseURL'] = this.originalBaseURL;
            return result;

        }
        catch (ex) {
            console.error(`Error in runUnitTests: ${ex}`);
            this.routerClient['options']['baseURL'] = this.originalBaseURL;
            throw new Error((ex as { message: string }).message);
        }
    }


    async getAllPNSSubscriptions(): Promise<Subscription[]> {
        try {
            const results: Subscription[] = await this.systemService.papiClient.get(`/notification/subscriptions?where=AddonUUID='${this.nebulaAddonUUID}'`);
            return results;
        }
        catch (ex) {
            console.error(`Error in getAllPNSSubscriptions: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async savePNSSubscriptions(): Promise<void> {
        try {
            const subscriptions = await this.getAllPNSSubscriptions();
            this.savedSubscriptions.concat(subscriptions);
        }
        catch (ex) {
            console.error(`Error in savePNSSubscriptions: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async upsertAllPNSSubscriptions(subscriptions: Subscription[]): Promise<Subscription[]> {
        const PARALLEL_AMOUNT = 5;
        this.addonService['options']['addonUUID'] = this.nebulaAddonUUID;

        const results = await Promise.map(subscriptions,
            async (subscription: Subscription) => {
                return (await this.systemService.papiClient.notification.subscriptions.upsert(subscription))
            },
            { concurrency: PARALLEL_AMOUNT });

        this.addonService['options']['addonUUID'] = testingAddonUUID;
        return results;
    }

    async hideSavedPNSSubscriptions(): Promise<Subscription[]> {
        console.log(`hideSavedPNSSubscriptions - savedSubscriptions: ${JSON.stringify(this.savedSubscriptions)}`);
        // change the Hidden property to true

        const hiddenSubscriptions: Subscription[] = this.savedSubscriptions.map(subscription => {
            subscription.Hidden = true;
            return subscription;
        });

        const results = await this.upsertAllPNSSubscriptions(hiddenSubscriptions);
        console.log(`hideSavedPNSSubscriptions - results: ${JSON.stringify(results)}`);
    }

    async unhideSavedPNSSubscriptions(): Promise<Subscription[]> {
        console.log(`unhideSavedPNSSubscriptions - savedSubscriptions: ${JSON.stringify(this.savedSubscriptions)}`);
        // change the Hidden property to false

        const results = await this.upsertAllPNSSubscriptions(this.savedSubscriptions);
        console.log(`unhideSavedPNSSubscriptions - results: ${JSON.stringify(results)}`);
    }

    async initPNS(): Promise<void> {
        try {
            await this.savePNSSubscriptions();
            await this.hideSavedPNSSubscriptions();
        }
        catch (ex) {
            console.error(`Error in initPNS: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async resetPNS(): Promise<void> {
        await this.unhideSavedPNSSubscriptions();
    }
    //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@



    getRecordLabelFromAddonUUIDAndResource(addonUUID: string, resource: string) {
        return `Record_${this.replaceDashWithUnderscore(this.distributorUUID)}_${this.replaceDashWithUnderscore(addonUUID)}_${resource}`;
    }

    replaceDashWithUnderscore(str: string) {
        return str.replace(/-/g, '_');
    }

    async getResourcesRequiringSync(parameters: GetResourcesRequiringSyncParameters): Promise<GetResourcesRequiringSyncResponse[]> {
        try {
            this.routerClient['options']['baseURL'] = "";
            const results = (await this.routerClient.post(this.nebulaGetResourcesRequiringSyncRelativeURL, {
                ModificationDateTime: parameters.ModificationDateTime,
                IncludeDeleted: parameters.IncludeDeleted,
                SystemFilter: parameters.SystemFilter
            }, { 'Content-Type': 'application/json' })).results;
            this.routerClient['options']['baseURL'] = this.originalBaseURL;
            return results;

        }
        catch (error) {
            console.error(`Error in getSchemasRequiringSync: ${(error as Error).message}`);
            this.routerClient['options']['baseURL'] = this.originalBaseURL;
            throw error;
        }
    }

    async getRecordsRequiringSync(parameters: GetRecordsRequiringSyncParameters): Promise<GetRecordsRequiringSyncResponse[]> {
        try {
            this.routerClient['options']['baseURL'] = "";
            const results = await this.routerClient.post(`${this.nebulaGetRecordsRequiresSyncRelativeURL}?addon_uuid=${parameters.AddonUUID}&resource=${parameters.Resource}`, {
                "ModificationDateTime": parameters.ModificationDateTime,
                "IncludeDeleted": parameters.IncludeDeleted,
                "SystemFilter": parameters.SystemFilter
            }, { 'Content-Type': 'application/json' });
            this.routerClient['options']['baseURL'] = this.originalBaseURL;
            return results;
        }
        catch (error) {
            console.error(`Error in getRecordsRequiringSync: ${(error as Error).message}`);
            this.routerClient['options']['baseURL'] = this.originalBaseURL;
            throw error;
        }
    }

    // here it's actually wait for Nebula to do its thing, so less time is needed.
    async waitForPNS() {
        const pnsDelaySeconds = 5;
        console.log(`Waiting for ${pnsDelaySeconds} seconds for local Nebula to catch up...`);
        await this.generalService.sleep(pnsDelaySeconds * 1000);
        console.log(`Done waiting for local Nebula`);
    }

    async pnsInsertSchema(addonUUID: string, resource: string) {
        var data: PNSPostBody = {
            addonUUID: this.adalAddonUUID,
            resource: 'schemes',
            action: 'insert',
            modifiedObjects: [{
                ObjectKey: `${this.distributorUUID}_${addonUUID}_${resource}`,
                ModifiedFields: [
                ]
            }]
        }

        const url = this.nebulaSchemesChangesRelativeURL;

        try {
            const postPNSdataResults = await this.pnsEmulator.postPNSData(data, url);
            console.log(`postPNSdataResults: ${JSON.stringify(postPNSdataResults)}`);
        }
        catch (ex) {
            console.error(`Error in pnsInsertSchema: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async pnsUpdateSchemaHiddenStatus(addonUUID: string, resource: string, hiddenNewValue: boolean) {

        const data: PNSPostBody = {
            addonUUID: this.adalAddonUUID,
            resource: 'schemes',
            action: 'update',
            modifiedObjects: [{
                ObjectKey: `${this.distributorUUID}_${addonUUID}_${resource}`,
                ModifiedFields: [
                    {
                        FieldID: "Hidden",
                        NewValue: {
                            Sync: hiddenNewValue
                        },
                        OldValue: {
                            Sync: !hiddenNewValue
                        }
                    }
                ]
            }]
        }

        const url = this.nebulaSchemesChangesRelativeURL;

        try {
            const postPNSdataResults = await this.pnsEmulator.postPNSData(data, url);
            console.log(`postPNSdataResults: ${JSON.stringify(postPNSdataResults)}`);
        }
        catch (ex) {
            console.error(`Error in pnsUpdateSchemaSyncStatus: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async pnsUpdateSchemaSyncStatus(addonUUID: string, resource: string, NewSyncStatus: boolean) {
        var data: PNSPostBody = {
            addonUUID: this.adalAddonUUID,
            resource: 'schemes',
            action: 'update',
            modifiedObjects: [{
                ObjectKey: `${this.distributorUUID}_${addonUUID}_${resource}`,
                ModifiedFields: [
                    {
                        FieldID: "SyncData",
                        NewValue: {
                            Sync: NewSyncStatus
                        },
                        OldValue: {
                            Sync: !NewSyncStatus
                        }
                    }
                ]
            }]
        }

        const url = this.nebulaSchemesChangesRelativeURL;

        try {
            const postPNSdataResults = await this.pnsEmulator.postPNSData(data, url);
            console.log(`postPNSdataResults: ${JSON.stringify(postPNSdataResults)}`);
        }
        catch (ex) {
            console.error(`Error in pnsUpdateSchemaSyncStatus: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async pnsRemoveSchema(addonUUID: string, resource: string) {
        var data: PNSPostBody = {
            addonUUID: this.adalAddonUUID,
            resource: 'schemes',
            action: 'remove',
            modifiedObjects: [{
                ObjectKey: `${this.distributorUUID}_${addonUUID}_${resource}`,
                ModifiedFields: [
                ]
            }]
        }

        const url = this.nebulaSchemesChangesRelativeURL;

        try {
            const postPNSdataResults = await this.pnsEmulator.postPNSData(data, url);
            console.log(`postPNSdataResults: ${JSON.stringify(postPNSdataResults)}`);
        }
        catch (ex) {
            console.error(`Error in pnsRemoveSchema: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async pnsInsertRecords(addonUUID: string, resource: string, records: BasicRecord[]) {
        var data: PNSPostBody = {
            addonUUID: addonUUID,
            resource: resource,
            action: 'insert',
            modifiedObjects: records.map(record => {
                return {
                    ObjectKey: record.Key,
                    ModifiedFields: [
                    ]
                }
            })
        }

        const url = this.nebulaRecordChangesRelativeURL;

        try {
            const postPNSdataResults = await this.pnsEmulator.postPNSData(data, url);
            console.log(`postPNSdataResults: ${JSON.stringify(postPNSdataResults)}`);
        }
        catch (ex) {
            console.error(`Error in pnsInsertRecords: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    // looks for the modified fields between oldRecords and newRecords
    async pnsUpdateRecords(addonUUID: string, resource: string, oldRecords: BasicRecord[], newRecords: BasicRecord[]) {
        var data: PNSPostBody = {
            addonUUID: addonUUID,
            resource: resource,
            action: 'update',
            modifiedObjects: oldRecords.map(oldRecord => {
                const newRecord = newRecords.find(newRecord => newRecord.Key === oldRecord.Key);
                const modifiedFields = Object.keys(oldRecord).filter(key => oldRecord[key] !== newRecord![key]).map(key => {
                    return {
                        FieldID: key,
                        NewValue: newRecord![key],
                        OldValue: oldRecord[key]
                    }
                });
                return {
                    ObjectKey: oldRecord.Key,
                    ModifiedFields: modifiedFields
                }
            })
        }

        const url = this.nebulaRecordChangesRelativeURL;

        try {
            const postPNSdataResults = await this.pnsEmulator.postPNSData(data, url);
            console.log(`postPNSdataResults: ${JSON.stringify(postPNSdataResults)}`);
        }
        catch (ex) {
            console.error(`Error in pnsUpdateRecords: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }

    }

    async pnsRemoveRecords(addonUUID: string, resource: string, records: BasicRecord[]) {
        var data: PNSPostBody = {
            addonUUID: addonUUID,
            resource: resource,
            action: 'remove',
            modifiedObjects: records.map(record => {
                return {
                    ObjectKey: record.Key,
                    ModifiedFields: [
                    ]
                }
            })
        }

        const url = this.nebulaRecordChangesRelativeURL;

        try {
            const postPNSdataResults = await this.pnsEmulator.postPNSData(data, url);
            console.log(`postPNSdataResults: ${JSON.stringify(postPNSdataResults)}`);
        }
        catch (ex) {
            console.error(`Error in pnsRemoveRecords: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

}