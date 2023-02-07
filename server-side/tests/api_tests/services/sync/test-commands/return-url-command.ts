import { SchemaExistsCommand } from "./schema-exists-command";
export class ReturnURLCommand extends SchemaExistsCommand {
    async sync(): Promise<any> {
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        let auditLog = await this.syncService.pull({
            ModificationDateTime: dateTime.toISOString(),
        },true, false, false)
        return auditLog
    }
    async processSyncResponse(syncRes: any): Promise<any> {
        return await this.syncService.handleSyncData(syncRes,true)
    }
    async test(syncRes: any, syncData: any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(syncRes).to.have.property('ResourcesURL').that.is.a('String').and.is.not.undefined
        await this.syncService.handleSyncData(syncRes,true)
        let schemes = await this.syncDataResult.getSchemes()
        expect(schemes).to.contain(this.syncAdalService.schemeName)
    }
    
  }