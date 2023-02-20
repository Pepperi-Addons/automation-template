import { Client } from "@pepperi-addons/debug-server/dist";
import { ADALTableService } from "../../../resource_management/adal_table.service";
import { ResourceManagerService } from "../../../resource_management/resource_manager.service";
import { GlobalSyncService } from "../../services/global-sync-service";
import { SyncAdalService } from "../../services/sync-adal-service";
import { SyncDimxService } from "../../services/sync-dimx-service";
import { SchemaExistsCommand } from "../schema-exists-command";

export class PushDataCommand extends SchemaExistsCommand{
    syncDimxService: SyncDimxService
    resourceManagerService: ResourceManagerService
    constructor(syncAdalService: SyncAdalService, client: Client) {
        super(syncAdalService, client)
        this.syncDimxService = new SyncDimxService()
        this.resourceManagerService = new ResourceManagerService(this.syncAdalService.papiClient, this.syncAdalService.addonUUID) 

    }

    async pushData(adalService: ADALTableService): Promise<any> {
        // create relation between DIMX and the created shchema
        await this.syncDimxService.createRelation(this.resourceManagerService, adalService.schemaName)    
        // pushing data using sync push endpoint
        const data = this.syncAdalService.generateFieldsData(1, 1, 5)
        const schemaToPush = {
            ResourcesData: [
                {
                    Schema: {
                        Name: this.syncAdalService.schemaName,
                        AddonUUID: this.syncAdalService.addonUUID,
                    },
                    Objects: data
                }              
            ]
        }
        await this.syncService.push(schemaToPush, false)
        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
    }   
    
    async  test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(syncRes).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(syncRes).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined

        // getting schemes from sync response and validating that only new schema is in the schemes to sync
        let schemes = await this.syncDataResult.getSchemes()
        expect(schemes).to.contain(this.syncAdalService.schemeName);


        // getting from the sync response the fields from new scheme,
        // validating that the new scheme will have a field
        let objects = this.syncDataResult.getObjects(this.syncAdalService.schemaName)
        expect(objects).to.be.an('Array')
        expect(objects.length).to.be.equal(5)

    }

    async cleanup(): Promise<any> {
        // clean relations
        await this.resourceManagerService.cleanup();
    }
}
