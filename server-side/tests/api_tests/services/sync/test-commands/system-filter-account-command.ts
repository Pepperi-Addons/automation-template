import { Client } from "@pepperi-addons/debug-server/dist";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { SyncAdalService } from "../services/sync-adal-service";;
import { SystemFilterService } from "../services/system-filter-service";
import { SystemFilterNone } from "./system-filter-none-command";


export class SystemFilterAccount extends SystemFilterNone {
    protected systemFilterService: SystemFilterService; 
    protected adalTableServices? : {account:ADALTableService,user:ADALTableService,none:ADALTableService}
    auditLogService: any;
    constructor(adalTableService: SyncAdalService,client:Client){
        super(adalTableService, client)
        this.systemFilterService = new SystemFilterService(client)
    } 
  
    async sync(): Promise<any> {
        // start sync
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        const systemFilter = this.systemFilterService.getSystemFilter(true,false,"3b5e29fb-ba1a-44ae-a84f-532028a9a28a")
        let auditLog = await this.syncService.pull({
            ModificationDateTime:dateTime.toISOString(),
            ...systemFilter
        },false,false)
        return auditLog
    }
    
    async test(auditLog: any, objToTest: any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        const schemaNames:{account:string, user:string,none:string} = this.syncAdalService.getSchemaNameFromAdalServices(this.adalTableServices)
        expect(auditLog).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(auditLog).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined
        let schemes = await this.syncDataResult.getSchemes()
        expect(schemes).to.contain(schemaNames.account).and.to.contain(schemaNames.user).and.to.contain(schemaNames.none)
        let fields = await this.syncDataResult.getFields(schemaNames)
        expect(fields).to.have.a.property('user');
        expect(fields).to.have.a.property('none');
        expect(fields).to.have.a.property('account');
        expect(Object.keys(fields.account)).to.have.a.lengthOf(1)
        expect(Object.keys(fields.user)).to.have.a.lengthOf(1)
        expect(Object.keys(fields.none)).to.have.a.lengthOf(3)
    }
  }