import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonData, PapiClient } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { ResourceManagerService } from "../../resource_management/resource_manager.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { SyncAdalService } from "../services/sync-adal-service";
import { SyncDimxService } from "../services/sync-dimx-service";
import { SyncFileService } from "../services/sync-file-service";
import { BaseCommand as BaseCommand } from "./base-command";


export class TenThousandRecordsCommand extends BaseCommand {
    papiClient: PapiClient;
    client: Client    
    syncDimxService: SyncDimxService
    syncFileService: SyncFileService
    constructor(syncAdalService: SyncAdalService, client: Client , papiClient: PapiClient, resourceManager: ResourceManagerService){
        super(syncAdalService, client, papiClient, resourceManager)
        this.papiClient = papiClient
        this.client = client
        this.syncDimxService = new SyncDimxService()
        this.syncFileService = new SyncFileService(this.client, this.papiClient)
    }
    protected MAX_RECORDS_TO_UPLOAD = 40000
    private schemeCreated: any = undefined
    private automationUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4"
    protected resourceManager = new ResourceManagerService(this.papiClient,this.automationUUID) 

    async setupSchemes(): Promise<any> {
        // generate schema with fields
        const schema = this.syncAdalService.generateSchemeWithFields(1)
        const adalService = await this.syncAdalService.getAdalService(schema)
        this.schemeCreated = adalService
        return Promise.resolve(adalService)    
    }

    async pushData(adalService: ADALTableService): Promise<any> {
        // initializing adal schema with data, first property is number of fields
        // second propety is number of characters in each field
        
        let objectForDimx: any
        await this.syncFileService.createPFSSchema()
        await this.syncDimxService.createRelation(this.resourceManager, adalService.schemaName)
        objectForDimx = this.syncAdalService.generateFieldsData(1, 1, this.MAX_RECORDS_TO_UPLOAD)
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
        this.syncDataResult.data =  await this.syncService.handleSyncData(syncRes,true)
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

        const uniqueKeys = new Set(recordsObjects.map(record => {return record.Key}))
        expect(uniqueKeys.size).to.equal(this.MAX_RECORDS_TO_UPLOAD)

        await this.resourceManager.cleanup()
    }
    
  }