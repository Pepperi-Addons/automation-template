import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonData, PapiClient } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { SyncAdalService } from "../services/sync-adal-service";
import { SyncDimxService } from "../services/sync-dimx-service";
import { BaseCommand as BaseCommand } from "./base-command";


export class NumberOfRecordsCommand extends BaseCommand {
    papiClient: PapiClient;    
    syncDimxService: SyncDimxService
    constructor(syncAdalService:SyncAdalService, client:Client, papiClient:PapiClient){
        super(syncAdalService, client)
        this.papiClient = papiClient
        this.syncDimxService = new SyncDimxService()
    }

    async setupSchemes(): Promise<ADALTableService> {
        // generate schema with fields
        const schema = this.syncAdalService.generateSchemeWithFields(1)
        const adalService = await this.syncAdalService.getAdalService(schema)
        return adalService;    
    }

    async pushData(adalService: ADALTableService): Promise<any> {
        // initializing adal schema with data, first property is number of fields
        // second propety is number of characters in each field
        await this.syncDimxService.createRelation(adalService.schemaName,this.papiClient)
        let objectForDimx: AddonData[] = []
        for (let fieldNumber = 1; fieldNumber <= 100000; fieldNumber*=10) {
            objectForDimx.push(this.syncAdalService.generateFieldsData(fieldNumber,1))
        }
        await this.syncDimxService.uploadDataToDIMX({Objects:objectForDimx},adalService.schemaName,this.papiClient)
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
        this.syncDataResult.data =  await this.syncService.handleSyncData(syncRes)
        return this.syncDataResult.data;
    }
    
    async  test(syncRes: any, syncData:any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(syncRes).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(syncRes).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined
        let schemes = await this.syncDataResult.getSchemes()
        expect(schemes).to.contain(this.syncAdalService.schemeName)
    }
    
  }