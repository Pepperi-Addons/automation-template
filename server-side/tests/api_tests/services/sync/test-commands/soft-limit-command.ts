import { ADALTableService } from "../../resource_management/adal_table.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { NumberOfRecordsCommand } from "./number-of-records-command";

export class SoftLimitCommand extends NumberOfRecordsCommand {
    syncDefaultVar: any

    async pushData(adalService: ADALTableService): Promise<any> {
        this.syncDefaultVar = await this.syncService.getSyncVariables()
        const data = this.syncAdalService.generateFieldsData(1,100000,20)
        console.log(`uploading data with size ${Buffer.byteLength(JSON.stringify(data), 'utf8')/1024/1024}MB`)
        await this.syncDimxService.createRelation(this.resourceManager, adalService.schemaName)    

        // upload data
        await this.syncFileService.uploadFilesAndImport(data, adalService.schemaName)

        await this.syncService.setSyncSoftLimit(1, this.syncDefaultVar.SYNC_TIME_LIMITATION)

        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
    }

    async test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(syncData).to.have.property('success').that.is.a('Boolean').and.is.equal(false)
        expect(syncData).to.have.nested.property('resultObject.errorMessage').that.is.a('String').and.is.include('The data size is too big. The maximum data size is 1 MB')
    }

    async cleanup(): Promise<any> {
        return await this.syncService.setSyncSoftLimit(124, this.syncDefaultVar.SYNC_TIME_LIMITATION)
    }

}