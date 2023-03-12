import { ADALTableService } from "../../resource_management/adal_table.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { NumberOfRecordsCommand } from "./number-of-records-command";

export class RecordSizeCommand extends NumberOfRecordsCommand {
    protected MAX_CHARS_IN_RECORD = -1
    MAX_RECORDS_TO_UPLOAD = 1
    async setupSchemes(): Promise<any> {
        // generate schema with one field
        const schema = this.syncAdalService.generateSchemeWithFields(1, `_${this.constructor.name}_${this.MAX_CHARS_IN_RECORD}`)
        const adalService = await this.syncAdalService.getAdalService(schema)
        this.schemeCreated = adalService
        return adalService  
    }

    async pushData(adalService: ADALTableService): Promise<any> {
        // initializing adal schema with data, first property is number of fields
        // second propety is number of characters in each field, third property is number of records
        
        let objectForAdal = this.syncAdalService.generateFieldsData(1, this.MAX_CHARS_IN_RECORD, this.MAX_RECORDS_TO_UPLOAD)
        await adalService.upsertBatch(objectForAdal)
        
        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
    }

    async  test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // tests

        expect(syncRes).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(syncRes).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined

        // validating that the scheme that was created exists
        let schemes = await this.syncDataResult.getSchemes()
        expect(schemes).to.contain(this.schemeCreated.schemaName)

        // validating that the scheme data returns in the same length it was created
        const recordsObjects = this.syncDataResult.getObjects(this.schemeCreated.schemaName)
        expect(recordsObjects[0].Field1.length).to.equal(this.MAX_CHARS_IN_RECORD)
    }
}