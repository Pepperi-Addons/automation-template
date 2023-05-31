import { AddonDataScheme, PapiClient, AddonData, FindOptions } from '@pepperi-addons/papi-sdk';

export class ADALService {
    constructor(public papiClient: PapiClient) {
        this.papiClient = papiClient;
    }

    async postSchema(addonDataScheme: AddonDataScheme) {
        return await this.papiClient.addons.data.schemes.post(addonDataScheme);
    }

    async getDataFromSchema(addonUUID: string, tableName: string, options?: FindOptions) {
        return await this.papiClient.addons.data.uuid(addonUUID).table(tableName).find(options);
    }

    async postDataToSchema(addonUUID: string, tableName: string, addonData: AddonData) {
        return await this.papiClient.addons.data.uuid(addonUUID).table(tableName).upsert(addonData);
    }

    async postBatchDataToSchema(addonUUID: string, tableName: string, addonData: AddonData[]) {
        return await this.papiClient.post(`/addons/data/batch/${addonUUID}/${tableName}`, { Objects: addonData });
    }

    async deleteSchema(tableName: string) {
        return await this.papiClient.post(`/addons/data/schemes/${tableName}/purge`);
    }
}
