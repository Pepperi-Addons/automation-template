import { ADALTableService } from "../../resource_management/adal_table.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { BaseCommand as BaseCommand } from "./base-command";


export class SchemaExistsCommand extends BaseCommand {    
  
    async setupSchemes(): Promise<ADALTableService> {
        // generate schema with fields
        const schema = this.syncAdalService.generateSchemeWithFields(1)
        const adalService = await this.syncAdalService.getAdalService(schema)
        return adalService;    
    }

    async pushData(adalService: ADALTableService): Promise<any> {
        // initializing adal schema with data, first property is number of fields
        // second propety is number of characters in each field
        const data = this.syncAdalService.generateFieldsData(1,1)
        await adalService.upsertRecord(data)
        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
    }

    async sync(): Promise<any> {
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        // start sync
        let auditLog = await this.syncService.pull({
            ModificationDateTime: dateTime.toISOString(),
        })
        return auditLog
    }

    async processSyncResponse(syncRes: any): Promise<any> {
        return await this.syncService.handleSyncData(syncRes)
    }
    
    async test(auditLog: any,syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(auditLog).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(auditLog).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined
        let schemes = await this.syncService.getSchemes()
        expect(schemes).to.contain(this.syncAdalService.schemeName)
    }
    
  }