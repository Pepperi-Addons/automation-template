import { Client } from "@pepperi-addons/debug-server/dist";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { GlobalSyncService } from "../services/global-service";
import { SyncAdalService } from "../services/sync-adal-service";
import { TIME_TO_SLEEP_FOR_NEBULA } from "../services/sync-tests-service";
import { SystemFilterService } from "../services/system-filter-service";
import { BaseCommand as BaseCommand } from "./base-command";


export class SystemFilterNone extends BaseCommand {
    protected systemFilterService: SystemFilterService; 
    protected adalTableServices? : {account:ADALTableService,user:ADALTableService,none:ADALTableService}
    auditLogService: any;
    constructor(adalTableService: SyncAdalService,client:Client){
        super(adalTableService, client)
        this.systemFilterService = new SystemFilterService(client)
    } 
  
    async setupSchemes(): Promise<any> {
        // generate schema with fields
        const accountSchema = this.systemFilterService.generateSystemFilterScheme('Account')
        const accountAdalService = await this.syncAdalService.getAdalService(accountSchema)
        const userSchema = this.systemFilterService.generateSystemFilterScheme('User')
        const userAdalService = await this.syncAdalService.getAdalService(userSchema)
        const noneSchema = this.systemFilterService.generateSystemFilterScheme('None')
        const noneAdalService = await this.syncAdalService.getAdalService(noneSchema)
        this.adalTableServices = {account:accountAdalService,user:userAdalService,none:noneAdalService}
        return this.adalTableServices;    
    }

    async pushData(adalService: any): Promise<any> {
        // initializing adal schema with data, first property is number of fields
        // second propety is number of characters in each field
        const accountData = this.systemFilterService.generateSystemFilterData(true,false)
        await adalService.account.upsertBatch(accountData)
        const userData = this.systemFilterService.generateSystemFilterData(false,true)
        await adalService.user.upsertBatch(userData)
        const noneData = this.systemFilterService.generateSystemFilterData(false,false)
        await adalService.none.upsertBatch(noneData)
        await GlobalSyncService.sleep(TIME_TO_SLEEP_FOR_NEBULA)
    }

    async sync(): Promise<any> {
        // start sync
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        const systemFilter = this.systemFilterService.getSystemFilter(false,false)
        let auditLog = await this.syncService.pull({
            ModificationDateTime:dateTime.toISOString(),
            ...systemFilter
        },false)
        return auditLog
    }

    async processSyncResponse(syncRes: any): Promise<any> {
        await this.syncService.handleSyncData(syncRes,false)
    }
    
    async test(auditLog: any, objToTest: any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        const schemaNames:{account:string, user:string,none:string} = this.syncAdalService.getSchemaNameFromAdalServices(this.adalTableServices)
        expect(auditLog).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(auditLog).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined
        let schemes = await this.syncService.getSchemes()
        expect(schemes).to.contain(schemaNames.account).and.to.contain(schemaNames.user).and.to.contain(schemaNames.none)
        let fields = await this.syncService.getFields(schemaNames)
        expect(fields).to.have.a.property('user');
        expect(fields).to.have.a.property('none');
        expect(fields).to.have.a.property('account');
        expect(Object.keys(fields.account)).to.have.a.lengthOf(3)
        expect(Object.keys(fields.user)).to.have.a.lengthOf(3)
        expect(Object.keys(fields.none)).to.have.a.lengthOf(3)
    }
  }