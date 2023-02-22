import { ADALTableService } from "../../resource_management/adal_table.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { SystemFilterNone } from "./system-filter-none-command";

export class ConnectAccountDelta extends SystemFilterNone{
    private accountsCreated: accountsCreated = {
        adalScheme: undefined,
        newAccount: undefined,
        hiddenAccount: undefined,
        timeAfterCreation: undefined
    }

    async setupSchemes(): Promise<any> {
        const accountSchema = this.systemFilterService.generateScheme(`Account`)
        const adalService = await this.syncAdalService.getAdalService(accountSchema)
        this.accountsCreated.adalScheme = adalService

        let newAccount = await this.systemFilterService.createAccount()
        this.accountsCreated!.newAccount = newAccount
        await this.systemFilterService.hideAccountFromCurrentUser(newAccount)

        let hiddenAccount = await this.systemFilterService.createAccount()
        this.accountsCreated!.hiddenAccount = hiddenAccount
        return adalService
    }

    async pushData(adalService: ADALTableService): Promise<any> {
        const accountData = await this.systemFilterService.generateAccountsData([this.accountsCreated?.hiddenAccount.UUID,this.accountsCreated?.newAccount.UUID])
        await adalService.upsertBatch(accountData)

        this.accountsCreated!.timeAfterCreation = new Date()

        await this.systemFilterService.hideAccountFromCurrentUser(this.accountsCreated!.hiddenAccount)
        await this.systemFilterService.connectAccountToCurrentUser(this.accountsCreated!.newAccount)

        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
        return Promise.resolve(undefined)
    }

    async sync(): Promise<any> {
        // start sync
        const systemFilter = this.systemFilterService.generateSystemFilter(false,false)
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
        expect(schemes).to.contain(this.accountsCreated.adalScheme.schemaName)

        const recordsObjects = this.syncDataResult.getObjects(this.accountsCreated.adalScheme.schemaName)
        expect(recordsObjects).to.be.lengthOf.least(2)

        const accounts = recordsObjects.map(record =>{
             return record.Account_Field
        })
        const hidden = recordsObjects.map(record => {
            if(record.Account_Field == this.accountsCreated.newAccount.UUID || record.Account_Field == this.accountsCreated.hiddenAccount.UUID ){
                return record.Hidden
            }
        })

        expect(accounts).to.contain(this.accountsCreated.newAccount.UUID)
        expect(accounts).to.contain(this.accountsCreated.hiddenAccount.UUID)
        expect(hidden).to.contain(true).and.to.contain(false)
        // add check that account field contains both account uuids
        // add check to hidden account is hidden in objects
    }

    async cleanup(): Promise<any> {
        await this.systemFilterService.cleanupAccounts()
    }
}

export interface accountsCreated{
    adalScheme: any;
    newAccount: any;
    hiddenAccount:any;
    timeAfterCreation: any;
}