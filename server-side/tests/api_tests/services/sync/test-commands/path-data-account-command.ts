import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { ResourceManagerService } from "../../resource_management/resource_manager.service";
import { SyncAdalService } from "../services/sync-adal-service";;
import { PathDataService } from "../services/path-data-service";
import { PathDataNone } from "./path-data-none-command";


export class PathDataAccount extends PathDataNone {
    protected systemFilterService: PathDataService; 
    protected adalTableServices? : {account: ADALTableService, user: ADALTableService, none: ADALTableService}
    auditLogService: any;

    connectedAccountUUID: string = "";
    constructor(adalTableService: SyncAdalService, client: Client) {
        super(adalTableService, client)
        this.systemFilterService = new PathDataService(client)
    } 
  
    async sync(): Promise<any> {
        this.connectedAccountUUID = await this.systemFilterService.accountsService.getConnectedAccountUUID()
        // start sync
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        const pathData = this.systemFilterService.generatePathData(true, false, this.connectedAccountUUID)
        let auditLog = await this.syncService.pull({
            ModificationDateTime:dateTime.toISOString(),
            PathData: pathData
        }, false, false, false)
        return auditLog
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
        expect(Object.keys(noneObjects)).to.have.a.lengthOf(0)
        
        const accountObjects = this.syncDataResult.getObjects(this.adalTableServices!.account.schemaName)
        expect(Object.keys(accountObjects)).to.have.a.lengthOf(1)
        
        const userObjects = this.syncDataResult.getObjects(this.adalTableServices!.user.schemaName)
        expect(Object.keys(userObjects)).to.have.a.lengthOf(0)  
        
        // test the data
        expect(accountObjects[0].Account_Field == this.connectedAccountUUID)
    }
  }