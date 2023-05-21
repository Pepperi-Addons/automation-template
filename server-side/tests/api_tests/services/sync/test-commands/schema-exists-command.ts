import { ADALTableService } from "../../resource_management/adal_table.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { BaseCommand as BaseCommand } from "./base-command";


export class SchemaExistsCommand extends BaseCommand {    
    private existAdalSchema
    private hiddenAdalSchema

    async setupSchemes(): Promise<ADALTableService> {
        // generate schema with fields
        const schema = this.syncAdalService.generateSchemeWithFields(1, `_${this.constructor.name}`)
        const adalService = await this.syncAdalService.getAdalService(schema)
        this.existAdalSchema = adalService

        const hiddenSchema = this.syncAdalService.generateSchemeWithFields(1, `_${this.constructor.name}_hidden`)
        const hiddenAdalService = await this.syncAdalService.getAdalService(hiddenSchema)
        this.hiddenAdalSchema = hiddenAdalService

        return adalService;    
    }

    async pushData(adalService: ADALTableService): Promise<any> {
        // initializing adal schema with data, first property is number of fields
        // second propety is number of characters in each field
        const data = this.syncAdalService.generateFieldsData(1,1)
        await this.existAdalSchema.upsertBatch(data)
        await this.hiddenAdalSchema.upsertBatch(data)

        await this.syncAdalService.changeSchemaToHidden(this.hiddenAdalSchema)

        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
    }

    async sync(): Promise<any> {
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        // start sync
        let auditLog = await this.syncService.pull({
            ModificationDateTime: dateTime.toISOString(),
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
        let schemes = await this.syncDataResult.getSchemes()
        expect(schemes).to.contain(this.existAdalSchema.schemeName)
        expect(schemes).to.contain(this.hiddenAdalSchema.schemeName)
    }
    
  }