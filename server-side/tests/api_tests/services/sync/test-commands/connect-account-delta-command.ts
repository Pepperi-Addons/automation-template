import { GlobalSyncService } from "../services/global-sync-service";
import { SystemFilterNone } from "./system-filter-none-command";

export class ConnectAccountDelta extends SystemFilterNone{
    private accountsCreated: accountsCreated | undefined

    async setupSchemes(): Promise<any> {
        const schema = this.syncAdalService.generateSchemeWithFields(1)
        const adalService = await this.syncAdalService.getAdalService(schema)
        let newAccount = await this.systemFilterService.createAccount()
        let hiddenAccount = await this.systemFilterService.createAccount(true)
        this.accountsCreated = {newAccount:newAccount, hiddenAccount:hiddenAccount, timeAfterCreation: new Date()}
        return adalService
    }

    async pushData(adalService: any): Promise<any> {
        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
        return Promise.resolve(undefined)
    }

    async sync(): Promise<any> {
        // start sync
        const systemFilter = this.systemFilterService.getSystemFilter(true,false,this.accountsCreated?.newAccount.UUID)
        let auditLog = await this.syncService.pull({
            ModificationDateTime:this.accountsCreated?.timeAfterCreation.toISOString(),
            ...systemFilter
        },false,false)
        return auditLog
    }

    async test(auditLog: any, objToTest: any, expect: Chai.ExpectStatic): Promise<any> {
        expect(auditLog).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(auditLog).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined
        let schemes = await this.syncDataResult.getSchemes()
        expect(schemes).to.contain(this.syncAdalService.schemeName)
        let fields = this.syncDataResult.getFieldBySchemaName(this.syncAdalService.schemeName)
        expect(fields).to.be.lengthOf.least(0)
    }
}

export interface accountsCreated{
    newAccount: any;
    hiddenAccount:any;
    timeAfterCreation: any;
}