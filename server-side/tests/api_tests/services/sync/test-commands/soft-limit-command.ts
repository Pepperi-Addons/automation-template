import { AddonDataScheme } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { BaseCommand } from "./base-command";

export class SoftLimitCommand extends BaseCommand {
    syncTestService: Sy

    async setupSchemes(): Promise<ADALTableService> {
        const schema = this.syncAdalService.generateSchemeWithFields(1, `_${this.constructor.name}`)
        const adalService = await this.syncAdalService.getAdalService(schema)
        return adalService
    }
    async pushData(adalService: ADALTableService): Promise<any> {
        const data = this.syncAdalService.generateFieldsData(100,10000)
        await adalService.upsertBatch(data)

        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
    }
    async sync(): Promise<any> {
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        let auditLog = await this.syncService.pull({
            ModificationDateTime: dateTime.toISOString(),
        }, false, false, false)
        return auditLog
    }
    async processSyncResponse(syncRes: any): Promise<any> {
        this.syncDataResult.data =  await this.syncService.getSyncData(syncRes)
        return this.syncDataResult.data;
    }

    async test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(syncRes).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(syncRes).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined
        const responseContentLength = this.syncDataResult.getResourcesContentLength())
    }

    async cleanup(): Promise<any> {
        // do nothing
        return await this.syn
    }

}

export interface DataObject{
    Schema: AddonDataScheme | undefined,
    Data: any
}