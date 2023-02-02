import { ADALTableService } from "../../resource_management/adal_table.service"
import { SchemaExistsCommand } from "./schema-exists-command";
export class ReturnURLCommand extends SchemaExistsCommand {
    syncTestService: any;
    auditLogService: any;
    syncAdalService: any;
    async syncData(): Promise<any> {
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        let auditLog = await this.syncTestService.callSyncPullAPI(dateTime.toISOString(),true)
        return auditLog
    }
    async test(auditLog: any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(auditLog).to.have.property('ResourcesURL').that.is.a('String').and.is.not.undefined
        let schemes = await this.auditLogService.getSchemesFromAudit(auditLog,true)
        expect(schemes).to.contain(this.syncAdalService.schemeName)
    }
    
  }