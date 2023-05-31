import { ADALTableService } from "../../resource_management/adal_table.service";
import { AccountsService } from "../services/accounts-service";
import { GlobalSyncService } from "../services/global-sync-service";
import { PathDataNone } from "./path-data-none-command";

export class ConnectAccountDelta extends PathDataNone{
    private adalScheme
    private connectedAccount
    private hiddenAccount
    private timeAfterCreation

    async setupSchemes(): Promise<any> {
        const accountSchema = this.systemFilterService.generateScheme(`Account`)
        const adalService = await this.syncAdalService.getAdalService(accountSchema)
        this.adalScheme = adalService

        let connectedAccount = await this.accountService.createAccount()
        this.connectedAccount = connectedAccount
        await this.accountService.hideAccountFromCurrentUser(connectedAccount)

        let hiddenAccount = await this.accountService.createAccount()
        this.hiddenAccount = hiddenAccount
        return adalService
    }

    async pushData(adalService: ADALTableService): Promise<any> {
        const accountData = await this.accountService.generateAccountData([this.hiddenAccount.UUID,this.connectedAccount.UUID])
        await adalService.upsertBatch(accountData)

        this.timeAfterCreation = new Date()

        await this.accountService.hideAccountFromCurrentUser(this.hiddenAccount)
        await this.accountService.connectAccountToCurrentUser(this.connectedAccount)

        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
        return Promise.resolve(undefined)
    }

    async sync(): Promise<any> {
        // start sync
        const pathData = this.systemFilterService.generatePathData(false,false)
        let auditLog = await this.syncService.pull({
            ModificationDateTime:this.timeAfterCreation.toISOString(),
            PathData: pathData
        },false, false, false)
        return auditLog
    }

    async test(auditLog: any, objToTest: any, expect: Chai.ExpectStatic): Promise<any> {
        expect(auditLog).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(auditLog).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined

        let schemes = await this.syncDataResult.getSchemes()
        expect(schemes).to.contain(this.adalScheme.schemaName)

        const recordsObjects = this.syncDataResult.getObjects(this.adalScheme.schemaName)
        expect(recordsObjects).to.be.lengthOf.least(2)

        // creating an object with account uuid as key and if is hidden as value
        const accounts = recordsObjects.map(record =>{
            const accountUUID = record.Account_Field
            const isHidden = record.Hidden

            // known issue that data from hidden account is returned
            if(accountUUID == this.hiddenAccount.UUID && isHidden == false){
                throw new Error(`Test failing due to nebula issue, bug DI-23903 is open on this issue`)
            }

             return { [accountUUID]:isHidden}
        })

        // add check that account field contains both account uuids
        // add check to hidden account is hidden in objects
        // validating this as a key-value pairs of account uuid and is hidden
        expect(accounts).to.include.deep.members([{[this.connectedAccount.UUID]: false}])
        expect(accounts).to.include.deep.members([{[this.hiddenAccount.UUID]:true}])
        
    }

    async cleanup(): Promise<any> {
        await this.accountService.cleanupAccounts()
    }
}