import { ADALTableService } from "../../resource_management/adal_table.service";
import { BaseCommand as BaseCommand } from "./base-command";

export class BaseSyncCommand extends BaseCommand {    
  
    async setupSchemes(): Promise<ADALTableService> {
        // generate schema with fields
        const schema = this.syncTestService.generateSchemeWithFields(1)
        const adalService = await this.syncTestService.getAdalService(schema)
        return adalService;    
    }

    async pushData(adalService: ADALTableService): Promise<any> {
        // initializing adal schema with data, first property is number of fields
        // second propety is number of characters in each field
        const data = this.syncTestService.generateFieldsData(1,1)
        await adalService.upsertRecord(data)
    }

    async syncData(): Promise<any> {
        // start sync
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        let auditLog = await this.syncTestService.callSyncPullAPI(dateTime.toISOString())
        return auditLog
    }
    
    async test(auditLog: any, expect: Chai.ExpectStatic) {
        // tests
        expect(auditLog).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(auditLog).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined
        let schemes = await this.syncTestService.getSchemesFromAudit(auditLog)
        expect(schemes).to.contain(this.syncTestService.scehmaName)
    }
    
  }