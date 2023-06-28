import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { AccountsService } from "../services/accounts-service";
import { GlobalSyncService } from "../services/global-sync-service";
import { SyncAdalService } from "../services/sync-adal-service";
import { TIME_TO_SLEEP_FOR_NEBULA } from "../services/sync-tests-service";
import { PathDataService } from "../services/path-data-service";
import { BaseCommand as BaseCommand } from "./base-command";


export class PathDataNone extends BaseCommand {
    protected systemFilterService: PathDataService; 
    protected adalTableServices? : {account:ADALTableService,user:ADALTableService,none:ADALTableService}
    auditLogService: any;
    private papiClient:PapiClient
    protected accountService: AccountsService
    
    constructor(adalTableService: SyncAdalService, client: Client){
        super(adalTableService, client)
        this.papiClient = this.syncAdalService.papiClient
        this.systemFilterService = new PathDataService(client)
        this.accountService = new AccountsService(this.papiClient)
    } 
    
  
    async setupSchemes(): Promise<any> {
        // generate schema with fields
        const accountSchema = this.systemFilterService.generateScheme('Account')
        const userSchema = this.systemFilterService.generateScheme('User')
        const noneSchema = this.systemFilterService.generateScheme('None')
        // upser schemes
        const accountAdalService = await this.syncAdalService.getAdalService(accountSchema)
        const userAdalService = await this.syncAdalService.getAdalService(userSchema)
        const noneAdalService = await this.syncAdalService.getAdalService(noneSchema)
        
        this.adalTableServices = {
            account: accountAdalService,
            user: userAdalService,
            none: noneAdalService
        }
        
        return this.adalTableServices;    
    }

    async pushData(adalService: any): Promise<any> {
        const accountData = await this.systemFilterService.generateAccountsData()
        await adalService.account.upsertBatch(accountData)
        
        const userData = await this.systemFilterService.generateUserData();
        await adalService.user.upsertBatch(userData)
        
        const noneData = await this.syncAdalService.generateFieldsData(1, 1, 2)
        await adalService.none.upsertBatch(noneData)
        
        await GlobalSyncService.sleep(TIME_TO_SLEEP_FOR_NEBULA)
    }

    async sync(): Promise<any> {
        // start sync
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        const pathData = this.systemFilterService.generatePathData(false,false)
        
        let auditLog = await this.syncService.pull({
            ModificationDateTime: dateTime.toISOString(),
            PathData: pathData
        }, false, false, false)

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

        const responseSchemes = await this.syncDataResult.getSchemes()
        expect(responseSchemes).to.contain(this.adalTableServices?.account.schemaName)
        expect(responseSchemes).to.contain(this.adalTableServices?.user.schemaName)
        expect(responseSchemes).to.contain(this.adalTableServices?.none.schemaName)
        
        const noneObjects = this.syncDataResult.getObjects(this.adalTableServices!.none.schemaName)
        expect(Object.keys(noneObjects)).to.have.a.lengthOf(2)
        
        const accountObjects = this.syncDataResult.getObjects(this.adalTableServices!.account.schemaName)
        expect(Object.keys(accountObjects)).to.have.a.lengthOf(2)
        
        const userObjects = this.syncDataResult.getObjects(this.adalTableServices!.user.schemaName)
        expect(Object.keys(userObjects)).to.have.a.lengthOf(1)
    }
  }