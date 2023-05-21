import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { ResourceManagerService } from "../../resource_management/resource_manager.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { SyncAdalService } from "../services/sync-adal-service";
import { SyncDimxService } from "../services/sync-dimx-service";
import { SyncFileService } from "../services/sync-file-service";
import { BaseCommand as BaseCommand } from "./base-command";

/**
 *  class to upload big data size to sync - not for testing, tool folr investigating sync
 */
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
        this.syncFileService = new SyncFileService(this.client, this.papiClient, false)
        this.resourceManager = new ResourceManagerService(this.papiClient, this.automationUUID) 
        
    }
    protected MAX_RECORDS_TO_UPLOAD = 10
    protected schemeCreated: any = undefined
    private automationUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4"

    async setupSchemes(): Promise<any> {
        return Promise.resolve(undefined);
    }

    // generation data with big record size and a lot of records,
    // inserting the data according to the index in the for loop
    async pushData(adalService1: ADALTableService): Promise<any> {  
        const promises: Promise<any>[] = []
        for (let index = 0; index < 10; index++) {
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
        
        return await Promise.all(promises)
    
    }

    async sync(): Promise<any> {
        return Promise.resolve(undefined)
    }

    async processSyncResponse(syncRes: any): Promise<any> {
        return Promise.resolve(undefined)
    }
    
    async  test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // it is not a test it is just a tool for bug investigation so we dont need tests
        return Promise.resolve(undefined)
    }
    
    async cleanup(): Promise<any> {
        await this.resourceManager.cleanup()
        return Promise.resolve(undefined)
    }
    
  }