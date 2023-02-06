import { SchemaExistsCommand } from "./schema-exists-command";
export class ReturnURLCommand extends SchemaExistsCommand {
    async sync(): Promise<any> {
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        let auditLog = await this.syncService.pull({
            ModificationDateTime: dateTime.toISOString(),
        },true, false)
        return auditLog
    }
    async processSyncResponse(syncRes: any): Promise<any> {
        return await this.syncService.handleSyncData(syncRes,true)
    }
    async test(auditLog: any, objToTest: any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(auditLog).to.have.property('ResourcesURL').that.is.a('String').and.is.not.undefined
        await this.syncService.handleSyncData(auditLog,true)
        let schemes = await this.syncDataResult.getSchemes()
        expect(schemes).to.contain(this.syncAdalService.schemeName)
    }
    
  }