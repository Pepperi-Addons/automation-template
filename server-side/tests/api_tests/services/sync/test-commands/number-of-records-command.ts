import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonData, PapiClient } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { ResourceManagerService } from "../../resource_management/resource_manager.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { SyncAdalService } from "../services/sync-adal-service";
import { SyncDimxService } from "../services/sync-dimx-service";
import { SyncFileService } from "../services/sync-file-service";
import { BaseCommand as BaseCommand } from "./base-command";


export class NumberOfRecordsCommand extends BaseCommand {
    papiClient: PapiClient;    
    syncDimxService: SyncDimxService
    syncFileService: SyncFileService
    constructor(syncAdalService:SyncAdalService, client:Client, papiClient:PapiClient,resourceManager: ResourceManagerService){
        super(syncAdalService, client,papiClient,resourceManager)
        this.papiClient = papiClient
        this.syncDimxService = new SyncDimxService()
        this.syncFileService = new SyncFileService(this.papiClient)
    }
    protected schemesCreated:{} = {}
    private MAX_RECORDS_TO_UPLOAD = 40000
    private MIN_RECORDS_TO_UPLOAD = 4

    async setupSchemes(): Promise<any> {
        // generate schema with fields
        for (let fieldNumber = this.MIN_RECORDS_TO_UPLOAD; fieldNumber <= this.MAX_RECORDS_TO_UPLOAD; fieldNumber *= 10) {
            const schema = this.syncAdalService.generateSchemeWithFields(1)
            const adalService = await this.syncAdalService.getAdalService(schema)
            this.schemesCreated[fieldNumber] = adalService
        }
        
        return Promise.resolve(undefined)    
    }

    async pushData(adalService: ADALTableService): Promise<any> {
        // initializing adal schema with data, first property is number of fields
        // second propety is number of characters in each field
        
        let objectForDimx: any
        await this.syncFileService.createPFSSchema()
        for (let recordNumber = this.MIN_RECORDS_TO_UPLOAD; recordNumber <= this.MAX_RECORDS_TO_UPLOAD; recordNumber *= 10) {
            await this.syncDimxService.createRelation(this.resourceManager,this.schemesCreated[recordNumber].schemaName,this.papiClient)
            objectForDimx = this.syncAdalService.generateFieldsData(1, 1, recordNumber)
            await this.syncFileService.uploadFilesAndImport(objectForDimx,this.schemesCreated[recordNumber].schemaName)
        }
        
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

        let schemesCreated = this.syncAdalService.getSchemeNamesFromObject(this.schemesCreated)
        expect(schemes).to.include.members(schemesCreated)

        for (let recordNumber = this.MIN_RECORDS_TO_UPLOAD; recordNumber <= this.MAX_RECORDS_TO_UPLOAD; recordNumber *= 10) {
            const recordsObjects = this.syncDataResult.getObjects(this.schemesCreated![recordNumber].schemaName)
            expect(recordsObjects.length).to.equal(recordNumber)
        }
    }
    
  }