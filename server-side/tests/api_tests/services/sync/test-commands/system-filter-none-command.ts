import { ADALTableService } from "../../resource_management/adal_table.service";
import { AuditLogService } from "../services/audit-log-service";
import { SyncAdalService } from "../services/sync-adal-service";
import { SyncService } from "../services/sync-tests-service";
import { SystemFilterService } from "../services/system-filter-service";
import { BaseCommand as BaseCommand } from "./base-command";


export class SystemFilterNone extends BaseCommand {
    protected systemFilterService: SystemFilterService; 
    protected adalTableServices? : {account:ADALTableService,user:ADALTableService,none:ADALTableService}
    constructor(syncService: SyncService,auditLogService:AuditLogService,syncAdalService:SyncAdalService,systemFilterService:SystemFilterService){
        super(syncService,auditLogService,syncAdalService)
        this.systemFilterService = systemFilterService
    } 
  
    async setupSchemes(): Promise<any> {
        // generate schema with fields
        const accountSchema = this.systemFilterService.generateSystemFilterScheme(true,false)
        const accountAdalService = await this.syncAdalService.getAdalService(accountSchema)
        const userSchema = this.systemFilterService.generateSystemFilterScheme(false,true)
        const userAdalService = await this.syncAdalService.getAdalService(userSchema)
        const noneSchema = this.systemFilterService.generateSystemFilterScheme(false,false)
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
        await this.syncService.sleep(this.TIME_TO_SLEEP_FOR_ADAL)
    }

    async syncData(): Promise<any> {
        // start sync
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        const systemFilter = this.systemFilterService.getSystemFilter(false,false)
        let auditLog = await this.syncService.pull(dateTime.toISOString(),false, systemFilter)
        return auditLog
    }
    
    async test(auditLog: any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        const schemaNames:{account:string, user:string,none:string} = this.syncAdalService.getSchemaNameFromAdalServices(this.adalTableServices)
        expect(auditLog).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(auditLog).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined
        let auditLogData = await this.auditLogService.getDataFromAuditLog(auditLog,false)
        let schemes = await this.auditLogService.getSchemesFromAudit(auditLogData)
        expect(schemes).to.contain(schemaNames.account).and.to.contain(schemaNames.user).and.to.contain(schemaNames.none)
        let fields = await this.auditLogService.getFieldsFromSchemasInAudit(auditLogData,schemaNames)
        expect(fields).to.have.a.property('user');
        expect(fields).to.have.a.property('none');
        expect(fields).to.have.a.property('account');
        expect(Object.keys(fields.account)).to.have.a.lengthOf(3)
        expect(Object.keys(fields.user)).to.have.a.lengthOf(3)
        expect(Object.keys(fields.none)).to.have.a.lengthOf(3)
    }
  }