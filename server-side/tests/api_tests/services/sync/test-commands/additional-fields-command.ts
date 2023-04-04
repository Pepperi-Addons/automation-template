import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { AccountsService } from "../services/accounts-service";
import { GlobalSyncService } from "../services/global-sync-service";
import { SyncAdalService } from "../services/sync-adal-service";
import { TIME_TO_SLEEP_FOR_NEBULA } from "../services/sync-tests-service";
import { SystemFilterService } from "../services/system-filter-service";
import { BaseCommand as BaseCommand } from "./base-command";


export class AdditionalFieldsCommand extends BaseCommand {
    protected systemFilterService: SystemFilterService; 
    private papiClient:PapiClient
    private adalService?: ADALTableService
    protected accountService: AccountsService
    
    constructor(adalTableService: SyncAdalService, client: Client){
        super(adalTableService, client)
        this.papiClient = this.syncAdalService.papiClient
        this.systemFilterService = new SystemFilterService(client)
        this.accountService = new AccountsService(this.papiClient)
    } 

    async setupSchemes(): Promise<any> {
        // generate schema with fields
        const userSchema = this.systemFilterService.generateScheme('User')
        const userAdalService: ADALTableService = await this.syncAdalService.getAdalService(userSchema)
        this.adalService = userAdalService

        return userAdalService
    }
    async pushData(adalService: ADALTableService): Promise<any> {
        const userData = await this.systemFilterService.generateUserData();
        await adalService.upsertBatch(userData)
        await GlobalSyncService.sleep(TIME_TO_SLEEP_FOR_NEBULA+2000)
    }

    async sync(): Promise<any> {
        // start sync
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        const pathData = this.systemFilterService.generateSystemFilter(false,true)
        let auditLog = await this.syncService.pull({
            ModificationDateTime:dateTime.toISOString(),
            PathData: pathData
        },false, false, false)
        return auditLog
    }

    async processSyncResponse(syncRes: any): Promise<any> {
        this.syncDataResult.data =  await this.syncService.getSyncData(syncRes)
        return this.syncDataResult.data;
    }

    async test(auditLog: any, objToTest: any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(auditLog).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(auditLog).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined

        const schemes = await this.syncDataResult.getSchemes()
        expect(schemes).to.contain(this.adalService?.schemaName)
        const objects = this.syncDataResult.getObjects(this.adalService?.schemaName!)
        expect(objects).to.be.lengthOf(1).and.to.contain.keys('User_Field')
    }
    
    async cleanup(): Promise<any> {
        return Promise.resolve(undefined)
    }

}