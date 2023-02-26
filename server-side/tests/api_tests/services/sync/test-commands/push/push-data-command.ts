import { Client } from "@pepperi-addons/debug-server/dist";
import { ResourceManagerService } from "../../../resource_management/resource_manager.service";
import { GlobalSyncService } from "../../services/global-sync-service";
import { SyncAdalService } from "../../services/sync-adal-service";
import { SyncDimxService } from "../../services/sync-dimx-service";
import { SchemaExistsCommand } from "../schema-exists-command";

export class PushDataCommand extends SchemaExistsCommand{
    syncDimxService: SyncDimxService
    resourceManagerService: ResourceManagerService
    numberOfRecords = 5
    pushTime: number = 0;

    firstSchemaName = `_${this.constructor.name}_first`
    secondSchemaName = `_${this.constructor.name}_second`
    constructor(syncAdalService: SyncAdalService, client: Client) {
        super(syncAdalService, client)
        this.syncDimxService = new SyncDimxService()
        this.resourceManagerService = new ResourceManagerService(this.syncAdalService.papiClient, this.syncAdalService.addonUUID) 

    }

    async setupSchemes(): Promise<any> {
        // generate schema with fields
        this.firstSchemaName = (await this.syncAdalService.getAdalService(this.syncAdalService.generateSchemeWithFields(1, this.firstSchemaName))).schemaName
        this.secondSchemaName = (await this.syncAdalService.getAdalService(this.syncAdalService.generateSchemeWithFields(1, this.secondSchemaName))).schemaName
        return Promise.resolve();    
    }

    async pushData(adalService: any): Promise<any> {
        // create relation between DIMX and the created shchema
        await this.syncDimxService.createRelation(this.resourceManagerService, this.firstSchemaName) 
        await this.syncDimxService.createRelation(this.resourceManagerService, this.secondSchemaName) 
        // pushing data using sync push endpoint
        const dataToPush = {
            ResourcesData: [
                {
                    Schema: {
                        Name: this.firstSchemaName,
                        AddonUUID: this.syncAdalService.addonUUID,
                    },
                    Objects: this.syncAdalService.generateFieldsData(1, 1, this.numberOfRecords)
                },
                {
                    Schema: {
                        Name: this.secondSchemaName,
                        AddonUUID: this.syncAdalService.addonUUID,
                    },
                    Objects: this.syncAdalService.generateFieldsData(1, 1, this.numberOfRecords)
                }            
            ]
        }
        const t1 = performance.now()
        await this.syncService.push(dataToPush, false)
        const t2 = performance.now()

        this.pushTime = t2 - t1
        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
    }

    async processSyncResponse(syncRes: any): Promise<any> {
        this.syncDataResult.data =  await this.syncService.getSyncData(syncRes)
        return this.syncDataResult.data;
    }
    
    async test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(syncRes).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(syncRes).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined

        // getting schemes from sync response and validating that only new schema is in the schemes to sync
        let schemes = await this.syncDataResult.getSchemes()
        expect(schemes).to.contain(this.firstSchemaName)
        expect(schemes).to.contain(this.secondSchemaName)


        // getting from the sync response the fields from new scheme,
        // validating that the new scheme will have a field
        let firstObjects = this.syncDataResult.getObjects(this.firstSchemaName)
        expect(firstObjects).to.be.an('Array')
        expect(firstObjects.length).to.be.equal(this.numberOfRecords)

        let secondObjects = this.syncDataResult.getObjects(this.secondSchemaName)
        expect(secondObjects).to.be.an('Array')
        expect(secondObjects.length).to.be.equal(this.numberOfRecords)

    }

    async cleanup(): Promise<any> {
        // clean relations
        await this.resourceManagerService.cleanup();
    }
}
