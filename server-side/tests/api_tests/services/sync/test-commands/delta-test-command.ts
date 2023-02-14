import { ADALTableService } from "../../resource_management/adal_table.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { BaseCommand } from "./base-command";

export class DeltaTestCommand extends BaseCommand {
    firstSchemeADALTable: ADALTableService | undefined;
    secondSchemeADALTable: ADALTableService | undefined;
    timeOfNewScheme: Date | undefined;
   
    OPTIMAL_DELTA_SYNC_TIME: number = 5000;
  
    async setupSchemes(): Promise<ADALTableService> {
        // generate schema with fields - first and second schemes, and saving the time befor creating second scheme 
        // and after creating first scheme for delta tests
        const firstSchema = this.syncAdalService.generateSchemeWithFields(1)
        const firstAdalService = await this.syncAdalService.getAdalService(firstSchema)
        this.firstSchemeADALTable = firstAdalService

        this.timeOfNewScheme = new Date()

        const secondSchema = this.syncAdalService.generateSchemeWithFields(1)
        const secondAdalService = await this.syncAdalService.getAdalService(secondSchema)
        this.secondSchemeADALTable = secondAdalService
        
        return secondAdalService  
    }

    async pushData(adalService: ADALTableService): Promise<any> {
        // initializing adal schema with data, first property is number of fields
        // second propety is number of characters in each field
        const data = this.syncAdalService.generateFieldsData(1, 1)
        
        // upserting the same data for both schemes and saving again the time between second and first
        await this.firstSchemeADALTable!.upsertRecord(data)
        this.timeOfNewScheme = new Date()
        await this.secondSchemeADALTable!.upsertRecord(data)
        
        // sleeping for allowing nebula to synchronize its data from adal
        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
    }

    async sync(): Promise<any> {
        // start sync
        const t1 = performance.now()
        
        let auditLog = await this.syncService.pull({
            ModificationDateTime: this.timeOfNewScheme!.toISOString(),
        }, false, false)
        const t2 = performance.now()
        
        return {syncResult: auditLog, syncTime: t2-t1}
    }

    async processSyncResponse(syncRes: any): Promise<any> {
        this.syncDataResult.data =  await this.syncService.handleSyncData(syncRes.syncResult)
        return this.syncDataResult.data;
    }
    
    async  test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        let oldSchemaName = this.firstSchemeADALTable!.schemaName
        let newSchemaName = this.secondSchemeADALTable!.schemaName

        expect(syncRes.syncResult).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(syncRes.syncResult).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined

        // getting schemes from sync response and validating that both second and first schemes is in the rsponse,
        // because sync returns all of the schemas even if they are not for sync
        let schemes = await this.syncDataResult.getSchemes()
        expect(schemes).to.contain(oldSchemaName)
        expect(schemes).to.contain(newSchemaName)

        // getting from the sync response the fields from each scheme,
        // validating that the first scheme will not have any field to update and the second will have a field
        let oldField = this.syncDataResult.getObjects(oldSchemaName)
        let newField = this.syncDataResult.getObjects(newSchemaName)
        expect(oldField).to.be.an('Array').of.length(0)
        expect(newField).to.be.an('Array').of.lengthOf.least(1)

        // validating that the answer from sync will return quickly
        expect(syncRes.syncTime).to.be.a('Number').and.to.be.lessThanOrEqual(this.OPTIMAL_DELTA_SYNC_TIME)
    }
  }