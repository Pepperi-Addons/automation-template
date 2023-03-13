import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { ResourceManagerService } from "../../resource_management/resource_manager.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { SyncAdalService } from "../services/sync-adal-service";
import { SyncDimxService } from "../services/sync-dimx-service";
import { SyncFileService } from "../services/sync-file-service";
import { BaseCommand as BaseCommand } from "./base-command";

// this class should not be executed, only inherited
export class UploadDataToSync extends BaseCommand {
    papiClient: PapiClient;
    client: Client    
    syncDimxService: SyncDimxService
    syncFileService: SyncFileService
    protected resourceManager: ResourceManagerService

    constructor(syncAdalService: SyncAdalService, client: Client){
        super(syncAdalService, client)
        this.client = client
        this.syncDimxService = new SyncDimxService()
        this.papiClient = syncAdalService.papiClient
        this.syncFileService = new SyncFileService(this.client, this.papiClient)
        this.resourceManager = new ResourceManagerService(this.papiClient, this.automationUUID) 
        
    }
    protected MAX_RECORDS_TO_UPLOAD = 20
    protected schemeCreated: any = undefined
    private automationUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4"

    async setupSchemes(): Promise<any> {
        // generate schema with fields
        // const schema = this.syncAdalService.generateSchemeWithFields(1, `test_sync_data_capacity`)
        // const adalService = await this.syncAdalService.getAdalService(schema)
        // this.schemeCreated = adalService
        // return adalService  
        return Promise.resolve(undefined);
    }

    async pushData(adalService1: ADALTableService): Promise<any> {  
        const promises: Promise<any>[] = []
        for (let index = 0; index < 1; index++) {
            const p = new Promise<any>(async (resolve, reject) =>{
                console.log(`in loop index: ${index} `)
                const schema = this.syncAdalService.generateSchemeWithFields(1, `test_sync_data_capacity`)
                console.log(`index: ${index}, after created schema: ${schema.Name}`)
                const adalService = await this.syncAdalService.getAdalService(schema)
                // create relation between DIMX and the created shchema
                await this.syncDimxService.createRelation(this.resourceManager, adalService.schemaName)    
                // generate data    
                const objectForDimx = this.syncAdalService.generateFieldsData(1, 50000, this.MAX_RECORDS_TO_UPLOAD)
                // upload data
                console.log(`index: ${index}, about to upload data`)
                await this.syncFileService.uploadFilesAndImport(objectForDimx, adalService.schemaName)
                console.log(`index: ${index}, after uploding data`)
        
                let size = JSON.stringify(objectForDimx).length
                console.log(`index: ${index}, Uploaded ${size/1024/1024} MB to sync`) 
                resolve(undefined)
            })
            promises.push(p)
            
        }
        
        await Promise.all(promises)
       
        
        // await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
    }

    async sync(): Promise<any> {
        return Promise.resolve(undefined)
    }

    async processSyncResponse(syncRes: any): Promise<any> {
        return Promise.resolve(undefined)
    }
    
    async  test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        return Promise.resolve(undefined)
    }
    
    async cleanup(): Promise<any> {
        return Promise.resolve(undefined)
    }
    
  }