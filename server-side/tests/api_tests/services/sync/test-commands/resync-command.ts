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
        // generate schema with fields - old and new schemes, and saving the time befor creating new scheme 
        // and after creating old scheme for delta tests
        const hiddenSchema = this.syncAdalService.generateSchemeWithFields(1)
        const hiddenAdalService = await this.syncAdalService.getAdalService(hiddenSchema)
        this.adalSchemes.hiddenScheme = hiddenAdalService
        await this.syncAdalService.changeSchemaToHidden(hiddenAdalService)
        const newSchema = this.syncAdalService.generateSchemeWithFields(1)
        const newAdalService = await this.syncAdalService.getAdalService(newSchema)
        this.adalSchemes.newScheme = newAdalService
        const noDataSchema = this.syncAdalService.generateSchemeWithFields(1)
        const noDataAdalService = await this.syncAdalService.getAdalService(noDataSchema)
        this.adalSchemes.noDataScheme = noDataAdalService
        return newAdalService  
    }

    async pushData(adalService: ADALTableService): Promise<any> {
        // initializing adal schema with data, first property is number of fields
        // second propety is number of characters in each field
        const data = this.syncAdalService.generateFieldsData(1,1)
        // upserting the same data for both schemes and saving again the time between new and old
        await this.adalSchemes.newScheme.upsertRecord(data)
        // sleeping for allowing nebula to synchronize its data from adal
        await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_NEBULA)
    }

    async sync(): Promise<any> {
        // start sync
        let resyncDate = new Date(1999,1).toISOString()
        let auditLog = await this.syncService.pull({
            ModificationDateTime: resyncDate,
        }, false, false)
        return auditLog
    }

    async processSyncResponse(syncRes: any): Promise<any> {
        this.syncDataResult.data =  await this.syncService.handleSyncData(syncRes)
        return this.syncDataResult.data;
    }
    
    async  test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        let hiddenSchemaName = this.adalSchemes.hiddenScheme.schemaName
        let newSchemaName = this.adalSchemes.newScheme.schemaName
        let noDataSchemaName = this.adalSchemes.noDataScheme.schemaName

        expect(syncRes).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(syncRes).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined

        // getting schemes from sync response and validating that both new and old schemes is in the rsponse,
        // because sync returns all of the schemas even if they are not for sync
        let schemes = await this.syncDataResult.getSchemes()
        expect(schemes).to.not.contain(hiddenSchemaName)
        expect(schemes).to.contain(newSchemaName)
        expect(schemes).to.contain(noDataSchemaName)

        // getting from the sync response the fields from each scheme,
        // validating that the old scheme will not have any field to update and the new will have a field
        let newField = this.syncDataResult.getFieldBySchemaName(newSchemaName)
        expect(newField).to.be.an('Array').of.lengthOf.least(1)
        let noDataField = this.syncDataResult.getFieldBySchemaName(noDataSchemaName)
        expect(noDataField).to.be.an('Array').of.length(0)
    }
    
  }

  export interface DeltaAdalSchemes{
    hiddenScheme: any;
    noDataScheme:any;
    newScheme: any;
  }