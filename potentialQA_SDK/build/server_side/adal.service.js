"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ADALService {
    constructor(papiClient) {
        this.papiClient = papiClient;
        this.papiClient = papiClient;
    }
    async postSchema(addonDataScheme) {
        return await this.papiClient.addons.data.schemes.post(addonDataScheme);
    }
    async getDataFromSchema(addonUUID, tableName, options) {
        return await this.papiClient.addons.data.uuid(addonUUID).table(tableName).find(options);
    }
    async postDataToSchema(addonUUID, tableName, addonData) {
        return await this.papiClient.addons.data.uuid(addonUUID).table(tableName).upsert(addonData);
    }
    async postBatchDataToSchema(addonUUID, tableName, addonData) {
        return await this.papiClient.post(`/addons/data/batch/${addonUUID}/${tableName}`, { Objects: addonData });
    }
    async deleteSchema(tableName) {
        return await this.papiClient.post(`/addons/data/schemes/${tableName}/purge`);
    }
}
exports.ADALService = ADALService;
//# sourceMappingURL=adal.service.js.map