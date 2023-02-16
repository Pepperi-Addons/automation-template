"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@pepperi-addons/papi-sdk");
const elastic_search_service_1 = require(".//elastic-search.service");
const stringFieldsArr = ['City', 'Country', 'Remark'];
const numberFieldsArr = ['ExternalID'];
class DataIndexService {
    constructor(generalService) {
        this.generalService = generalService;
        this.elasticSearchService = new elastic_search_service_1.ElasticSearchService(generalService);
    }
    async createTotalsMapOfField(fieldName) {
        const sortedAndCountedMap = new Map();
        const totlasArr = await this.elasticSearchService.getTotals('all_activities', {
            select: [`count(${fieldName})`],
            group_by: fieldName,
        });
        // debugger;
        if (totlasArr.length <= 0) {
            throw new Error('Empty array response from elastic search');
        }
        totlasArr.forEach((fieldCount) => {
            sortedAndCountedMap.set(fieldCount[Object.keys(fieldCount)[0]], fieldCount[Object.keys(fieldCount)[1]]);
        });
        return sortedAndCountedMap;
    }
    createTestDataForField(fieldName) {
        if (stringFieldsArr.includes(fieldName)) {
            if (fieldName == 'Country') {
                return 'IL';
            }
            return Math.floor(Math.random() * 100000000000).toString(36);
        }
        else if (numberFieldsArr.includes(fieldName)) {
            return Math.floor(Math.random() * 1000000);
        }
        else {
            throw new Error(`NotImplementedException - Field Name: ${fieldName}`);
        }
    }
    cleanDataIndex() {
        return this.generalService.papiClient.post('/addons/api/async/10979a11-d7f4-41df-8993-f06bfd778304/data_index_ui_api/delete_index');
    }
    exportDataToDataIndex(data) {
        return this.generalService.papiClient.post('/addons/api/async/10979a11-d7f4-41df-8993-f06bfd778304/data_index_ui_api/save_ui_data', data);
    }
    rebuildAllActivities() {
        return this.generalService.papiClient.post('/addons/api/async/10979a11-d7f4-41df-8993-f06bfd778304/data_index/all_activities_rebuild');
    }
    pollAllActivities() {
        return this.generalService.papiClient.post('/addons/api/async/10979a11-d7f4-41df-8993-f06bfd778304/data_index/all_activities_polling');
    }
    rebuildTransactionLines() {
        return this.generalService.papiClient.post('/addons/api/async/10979a11-d7f4-41df-8993-f06bfd778304/data_index/transaction_lines_rebuild');
    }
    pollTransactionLines() {
        return this.generalService.papiClient.post('/addons/api/async/10979a11-d7f4-41df-8993-f06bfd778304/data_index/transaction_lines_polling');
    }
}
exports.DataIndexService = DataIndexService;
//# sourceMappingURL=data-index.service.js.map