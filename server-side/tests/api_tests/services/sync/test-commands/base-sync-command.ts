import { ADALTableService } from "../../resource_management/adal_table.service";
import { BaseCommand as BaseCommand } from "./base-command";


export class BaseSyncCommand extends BaseCommand {    
  
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
        this.syncTestService.sleep(5000)
    }

    async syncData(): Promise<any> {
        // start sync
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        let auditLog = await this.syncTestService.callSyncPullAPI(dateTime.toISOString(),false)
        return auditLog
    }
    
    async test(auditLog: any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(auditLog).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(auditLog).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined
        let schemes = await this.auditLogService.getSchemesFromAudit(auditLog,false)
        expect(schemes).to.contain(this.syncAdalService.schemeName)
    }
    
  }