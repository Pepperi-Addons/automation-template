import { AddonDataScheme, PapiClient, AddonData, FindOptions } from '@pepperi-addons/papi-sdk';
import { ADALService } from "../../../../potentialQA_SDK/server_side/adal.service"
import { RemovableResource } from './removable_resource.service';

export class ADALTableService extends RemovableResource {
    adalService: ADALService;
    schemaName: string;

    constructor(public papiClient: PapiClient, private addonUUID: string, private schema: AddonDataScheme) {
        super(papiClient);
        this.adalService = new ADALService(papiClient);
        this.schemaName = schema.Name;
    }

    async initResource(): Promise<AddonDataScheme> {
        try {
            return await this.adalService.postSchema(this.schema);
        }
        catch (ex) {
            console.error(`initResource - adal_table: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async removeResource(): Promise<any> {
        try {
            return await this.adalService.deleteSchema(this.schemaName);
        }
        catch (ex) {
            console.error(`removeResource - adal_table: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async resetSchema(): Promise<AddonDataScheme> {
        await this.removeResource();
        return await this.initResource();
    }

    getSchema(): AddonDataScheme {
        return this.schema;
    }

    async getRecords(options?: FindOptions): Promise<AddonData[]> {
        try {
            return await this.adalService.getDataFromSchema(this.addonUUID, this.schemaName, options);
        }
        catch (ex) {
            console.error(`getRecords - adal_table: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async getRecordByKey(key: string): Promise<AddonData> {
        try {
            return await this.papiClient.addons.data.uuid(this.addonUUID).table(this.schemaName).key(key);
        }
        catch (ex) {
            console.error(`getRecordByKey - adal_table: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async upsertRecord(dataToUpsert: AddonData): Promise<AddonData> {
        try {
            return await this.adalService.postDataToSchema(this.addonUUID, this.schemaName, dataToUpsert);
        }
        catch (ex) {
            console.error(`upsertRecord - adal_table: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async upsertBatch(dataArrayToUpsert: AddonData[]): Promise<any> {
        try {
            return await this.adalService.postBatchDataToSchema(this.addonUUID, this.schemaName, dataArrayToUpsert);
        }
        catch (ex) {
            console.error(`upsertRecord - adal_table: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }

    async updateSchema(schema: AddonDataScheme): Promise<AddonDataScheme> {
        try {
            return await this.adalService.postSchema(schema);
        }
        catch (ex) {
            console.error(`updateSchema - adal_table: ${ex}`);
            throw new Error((ex as { message: string }).message);
        }
    }
}
