import { AddonDataScheme } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { BaseCommand } from "./base-command";

export class ContentLengthCommand extends BaseCommand {
    private timeOfDataInsertion: Date | undefined;
    private contentLength: number = 0
    private dataObj: DataObject = {Schema: undefined, Data: undefined}

    async setupSchemes(): Promise<ADALTableService> {
        const schema = this.syncAdalService.generateSchemeWithFields(1, `_${this.constructor.name}`)
        const adalService = await this.syncAdalService.getAdalService(schema)
        this.dataObj.Schema = adalService.getSchema()
        return adalService
    }
    async pushData(adalService: ADALTableService): Promise<any> {
        this.timeOfDataInsertion = new Date()
        const data = this.syncAdalService.generateFieldsData(1,1)
        this.dataObj.Data = data
        this.contentLength = Buffer.byteLength(JSON.stringify(this.dataObj), 'utf8')
        await adalService.upsertBatch(data)

        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
    }
    async sync(): Promise<any> {
        let auditLog = await this.syncService.pull({
            ModificationDateTime: this.timeOfDataInsertion!.toISOString(),
        }, false, false, false)
        return auditLog
    }
    async processSyncResponse(syncRes: any): Promise<any> {
        this.syncDataResult.data =  await this.syncService.getSyncData(syncRes)
        return this.syncDataResult.data;
    }

    async  test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(syncRes).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(syncRes).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined
        const responseContentLength = this.syncDataResult.getResourcesContentLength()
        expect(responseContentLength).to.be.equal(this.contentLength)
    }

}

export interface DataObject{
    Schema: AddonDataScheme | undefined,
    Data: any
}