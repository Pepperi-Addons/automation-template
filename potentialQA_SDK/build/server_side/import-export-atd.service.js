"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ImportExportATDService {
    constructor(papiClient) {
        this.papiClient = papiClient;
    }
    //ATD Types
    //Transactions
    postTransactionsATD(atd) {
        return this.papiClient.post(`/meta_data/${'transactions'}/types`, atd);
    }
    getTransactionsATD(subTypeID) {
        return this.papiClient.get(`/meta_data/${'transactions'}/types/${subTypeID}`);
    }
    getAllTransactionsATD() {
        return this.papiClient.get(`/meta_data/${'transactions'}/types`);
    }
    //Activities
    postActivitiesATD(atd) {
        return this.papiClient.post(`/meta_data/${'activities'}/types`, atd);
    }
    getActivitiesATD(subTypeID) {
        return this.papiClient.get(`/meta_data/${'activities'}/types/${subTypeID}`);
    }
    getAllActivitiesATD() {
        return this.papiClient.get(`/meta_data/${'activities'}/types`);
    }
    exportATD(type, subtype) {
        return this.papiClient.get(`/addons/api/async/e9029d7f-af32-4b0e-a513-8d9ced6f8186/api/export_type_definition?type=${type}&subtype=${subtype}`);
    }
    exportMappingATD(references) {
        return this.papiClient.post('/addons/api/e9029d7f-af32-4b0e-a513-8d9ced6f8186/api/build_references_mapping', references);
    }
    importATD(type, subtype, body) {
        //18/01/2021 - the respons was changed to not contain object, this is why the response code will have to be verified
        // return this.papiClient.post(
        //     `/addons/api/e9029d7f-af32-4b0e-a513-8d9ced6f8186/api/import_type_definition?type=${type}&subtype=${subtype}`,
        //     body,
        // );
        return this.papiClient.apiCall('POST', `/addons/api/async/e9029d7f-af32-4b0e-a513-8d9ced6f8186/api/import_type_definition?type=${type}&subtype=${subtype}`, body);
    }
    importToNewATD(type, body) {
        //18/01/2021 - the respons was changed to not contain object, this is why the response code will have to be verified
        // return this.papiClient.post(
        //     `/addons/api/e9029d7f-af32-4b0e-a513-8d9ced6f8186/api/import_type_definition?type=${type}`,
        //     body,
        // );
        //18/02/2021 - This was removed to not create trash ATD until (DI-17656) will be solved.
        return `This should not work, it removed from the test and should not be used, type:${type}, body:${body}`;
        // return this.papiClient.apiCall(
        //     'POST',
        //     `/addons/api/async/e9029d7f-af32-4b0e-a513-8d9ced6f8186/api/import_type_definition?type=${type}`,
        //     body,
        // );
    }
    //UDT
    postUDT(udt) {
        return this.papiClient.post(`/meta_data/${'user_defined_tables'}`, udt);
    }
    getUDT(tableID) {
        return this.papiClient.get(`/meta_data/${'user_defined_tables'}/${tableID}`);
    }
    getAllUDT() {
        return this.papiClient.get(`/meta_data/${'user_defined_tables'}`);
    }
    deleteUDT(tableID) {
        return this.papiClient
            .delete(`/meta_data/${'user_defined_tables'}/${tableID}`)
            .then((res) => res.text())
            .then((res) => (res ? JSON.parse(res) : ''));
    }
}
exports.ImportExportATDService = ImportExportATDService;
//# sourceMappingURL=import-export-atd.service.js.map