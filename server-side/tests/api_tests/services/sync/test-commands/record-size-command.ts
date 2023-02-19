import { ADALTableService } from "../../resource_management/adal_table.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { NumberOfRecordsCommand } from "./number-of-records-command";

export class RecordSizeCommand extends NumberOfRecordsCommand {
    private MIN_CHARS_IN_RECORD = 1
    private MAX_CHARS_IN_RECORD = 100000
    protected override MAX_RECORDS_TO_UPLOAD: number = this.MAX_CHARS_IN_RECORD;
    protected override MIN_RECORDS_TO_UPLOAD: number = this.MIN_CHARS_IN_RECORD;

    async pushData(adalService: ADALTableService): Promise<any> {
        // initializing adal schema with data, first property is number of fields
        // second propety is number of characters in each field
        
        let objectForDimx: any
        await this.syncFileService.createPFSSchema()
        for (let recordLength = this.MIN_CHARS_IN_RECORD; recordLength <= this.MAX_CHARS_IN_RECORD; recordLength *= 10) {
            await this.syncDimxService.createRelation(this.resourceManager,this.schemesCreated[recordLength].schemaName,this.papiClient)
            objectForDimx = this.syncAdalService.generateFieldsData(1, recordLength)
            await adalService.upsertBatch(objectForDimx)
            // await this.syncFileService.uploadFilesAndImport(objectForDimx,this.schemesCreated[recordLength].schemaName)
        }
        
        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
    }

    async processSyncResponse(syncRes: any): Promise<any> {
        this.syncDataResult.data =  await this.syncService.handleSyncData(syncRes,false)
        return this.syncDataResult.data;
    }

    async  test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // tests

        expect(syncRes).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(syncRes).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined

        let schemes = await this.syncDataResult.getSchemes()

        let schemesCreated = this.syncAdalService.getSchemeNamesFromObject(this.schemesCreated)
        expect(schemes).to.include.members(schemesCreated)

        for (let recordLength = this.MIN_CHARS_IN_RECORD; recordLength <= this.MAX_CHARS_IN_RECORD; recordLength *= 10) {
            const recordsObjects = this.syncDataResult.getObjects(this.schemesCreated![recordLength].schemaName)
            console.log(recordLength)
            expect(recordsObjects[0].Field1.length).to.equal(recordLength)
        }

        // for (let recordNumber = this.MIN_RECORDS_TO_UPLOAD; recordNumber <= this.MAX_RECORDS_TO_UPLOAD; recordNumber *= 10) {
        //     const recordsObjects = this.syncDataResult.getObjects(this.schemesCreated![recordNumber].schemaName)
        //     expect(recordsObjects.length).to.equal(recordNumber)
        // }
    }
}