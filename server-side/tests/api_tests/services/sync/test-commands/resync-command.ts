import { ADALTableService } from "../../resource_management/adal_table.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { BaseCommand } from "./base-command";

export class ResyncCommand extends BaseCommand {
    private adalSchemes:DeltaAdalSchemes = {
        hiddenScheme: undefined,
        noDataScheme:undefined,
        newScheme: undefined
    }
    OPTIMAL_DELTA_SYNC_TIME: number = 5000;
  
    async setupSchemes(): Promise<ADALTableService> {
        // generate three scehmes
        
        // generate hidden scheme, which should not returned in resync
        const hiddenSchema = this.syncAdalService.generateSchemeWithFields(1, `_${this.constructor.name}_hiddenSchema`)
        const hiddenAdalService = await this.syncAdalService.getAdalService(hiddenSchema)
        this.adalSchemes.hiddenScheme = hiddenAdalService
        await this.syncAdalService.changeSchemaToHidden(hiddenAdalService)

        // generate new scheme with data
        const newSchema = this.syncAdalService.generateSchemeWithFields(1, `_${this.constructor.name}_newSchema`)
        const newAdalService = await this.syncAdalService.getAdalService(newSchema)
        this.adalSchemes.newScheme = newAdalService

        // generate new scheme without data, which shoukd be returned in resync
        const noDataSchema = this.syncAdalService.generateSchemeWithFields(1, `_${this.constructor.name}_noDataSchema`)
        const noDataAdalService = await this.syncAdalService.getAdalService(noDataSchema)
        this.adalSchemes.noDataScheme = noDataAdalService
        
        return newAdalService  
    }

    async pushData(adalService: ADALTableService): Promise<any> {
        // initializing adal schema with data, first property is number of fields
        // second propety is number of characters in each field
        // generating data only for the new scheme
        const data = this.syncAdalService.generateFieldsData(1,1)

        await this.adalSchemes.newScheme.upsertBatch(data)

        // sleeping for allowing nebula to synchronize its data from adal
        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
    }

    async sync(): Promise<any> {
        // start resync
        // setting year of modification date to be <2000 for resync 
        let resyncDate = new Date(1999,1).toISOString()
        let auditLog = await this.syncService.pull({
            ModificationDateTime: resyncDate,
        }, false, false)
        return auditLog
    }

    async processSyncResponse(syncRes: any): Promise<any> {
        this.syncDataResult.data =  await this.syncService.handleSyncData(syncRes, false)
        return this.syncDataResult.data;
    }
    
    async  test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        let hiddenSchemaName = this.adalSchemes.hiddenScheme.schemaName
        let newSchemaName = this.adalSchemes.newScheme.schemaName
        let noDataSchemaName = this.adalSchemes.noDataScheme.schemaName

        expect(syncRes).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(syncRes).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined


        let schemes = await this.syncDataResult.getSchemes()

        // validating that hidden scheme will not be in the sync schemes
        expect(schemes).to.not.contain(hiddenSchemaName)

        // getting schemes from sync response and validating that both new and old schemes is in the rsponse,
        // because sync returns all of the schemas even if they are not for sync
        expect(schemes).to.contain(newSchemaName)
        expect(schemes).to.contain(noDataSchemaName)

        // getting from the sync response the fields from each scheme,
        // validating that the no data scheme will not have any field to update and the new will have a field
        let newField = this.syncDataResult.getObjects(newSchemaName)
        expect(newField).to.be.an('Array').of.lengthOf.least(1)
        let noDataField = this.syncDataResult.getObjects(noDataSchemaName)
        expect(noDataField).to.be.an('Array').of.length(0)
    }
    
  }

  export interface DeltaAdalSchemes{
    hiddenScheme: any;
    noDataScheme:any;
    newScheme: any;
  }