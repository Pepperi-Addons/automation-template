import { GlobalSyncService } from "../../services/global-sync-service";
import { PushDataCommand } from "./push-data-command";

export class PushDataTimeCommand extends PushDataCommand {
    numberOfRecords = 50;
    private pushTime: number = 0;

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

        this.pushTime = t2-t1

        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
    }

    async test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(syncRes).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(syncRes).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined

        // average time of pushing 50 records is 3300 ms, validataing that push time is not more than 3500 ms
        expect(this.pushTime).to.be.a('Number').and.to.be.lessThanOrEqual(3500)

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

}