import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonData, PapiClient } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { ResourceManagerService } from "../../resource_management/resource_manager.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { SyncAdalService } from "../services/sync-adal-service";
import { SyncDimxService } from "../services/sync-dimx-service";
import { SyncFileService } from "../services/sync-file-service";
import { BaseCommand as BaseCommand } from "./base-command";

// this class should not be executed, only inherited
export class NumberOfRecordsCommand extends BaseCommand {
    papiClient: PapiClient;
    client: Client    
    syncDimxService: SyncDimxService
    syncFileService: SyncFileService
    private resourceManager: ResourceManagerService

    constructor(syncAdalService: SyncAdalService, client: Client){
        super(syncAdalService, client)
        this.client = client
        this.syncDimxService = new SyncDimxService()
        this.papiClient = syncAdalService.papiClient
        this.syncFileService = new SyncFileService(this.client, this.papiClient)
        this.resourceManager = new ResourceManagerService(this.papiClient, this.automationUUID) 
        
    }
    protected MAX_RECORDS_TO_UPLOAD = -1
    private schemeCreated: any = undefined
    private automationUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4"

    async setupSchemes(): Promise<any> {
        // generate schema with fields
        const schema = this.syncAdalService.generateSchemeWithFields(1, `_${this.constructor.name}_${this.MAX_RECORDS_TO_UPLOAD}`)
        const adalService = await this.syncAdalService.getAdalService(schema)
        this.schemeCreated = adalService
        return adalService  
    }

    async pushData(adalService: ADALTableService): Promise<any> {    

        // create relation between DIMX and the created shchema
        await this.syncDimxService.createRelation(this.resourceManager, adalService.schemaName)    
        // generate data    
        const objectForDimx = this.syncAdalService.generateFieldsData(1, 1, this.MAX_RECORDS_TO_UPLOAD)
        // upload data
        await this.syncFileService.uploadFilesAndImport(objectForDimx, adalService.schemaName)
        
        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
    }

    async sync(): Promise<any> {
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        // start sync
        let auditLog = await this.syncService.pull({
            ModificationDateTime: dateTime.toISOString(),
        }, false, false)
        return auditLog
    }

    async processSyncResponse(syncRes: any): Promise<any> {
        this.syncDataResult.data =  await this.syncService.handleSyncData(syncRes, true)
        return this.syncDataResult.data;
    }
    
    async  test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(syncRes).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(syncRes).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined

        let schemes = await this.syncDataResult.getSchemes()

        expect(schemes).to.contain(this.schemeCreated.schemaName)
        const recordsObjects = this.syncDataResult.getObjects(this.schemeCreated.schemaName)
        expect(recordsObjects.length).to.equal(this.MAX_RECORDS_TO_UPLOAD)

        //getting all of the keys to sync from nebula, creating set which contains only the unique keys (without reoccurence)
        //  validating that the unique keys is in the same ength - validating that each key is exactly one time in the sync
        const uniqueKeys = new Set(recordsObjects.map(record => {return record.Key}))
        expect(uniqueKeys.size).to.equal(this.MAX_RECORDS_TO_UPLOAD)

    }
    
    async cleanup(): Promise<any> {
        await this.resourceManager.cleanup();
    }
    
  }