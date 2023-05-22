import { ADALTableService } from "../../resource_management/adal_table.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { SchemaExistsCommand } from "./schema-exists-command";
export class ReturnURLCommand extends SchemaExistsCommand {

    async setupSchemes(): Promise<ADALTableService> {
        // generate schema with fields
        const schema = this.syncAdalService.generateSchemeWithFields(1, `_${this.constructor.name}`)
        const adalService = await this.syncAdalService.getAdalService(schema)

        return adalService
    }

    async pushData(adalService: ADALTableService): Promise<any> {
        // initializing adal schema with data, first property is number of fields
        // second propety is number of characters in each field
        const data = this.syncAdalService.generateFieldsData(1,1)
        await adalService.upsertBatch(data)

        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
    }

    async sync(): Promise<any> {
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        let auditLog = await this.syncService.pull({
            ModificationDateTime: dateTime.toISOString(),
        },true, false, false)
        return auditLog
    }
    async processSyncResponse(syncRes: any): Promise<any> {
        this.syncDataResult.data =  await this.syncService.handleSyncData(syncRes, true)
        return this.syncDataResult.data;
    }
    async test(syncRes: any, syncData: any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(syncRes).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(syncRes).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined
        let schemes = await this.syncDataResult.getSchemes()
        expect(schemes).to.contain(this.syncAdalService.schemeName)
    }
    
  }