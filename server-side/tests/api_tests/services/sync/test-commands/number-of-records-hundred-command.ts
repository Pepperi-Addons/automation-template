import { Client } from "@pepperi-addons/debug-server/dist";
import { AddonData, PapiClient } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "../../resource_management/adal_table.service";
import { ResourceManagerService } from "../../resource_management/resource_manager.service";
import { GlobalSyncService } from "../services/global-sync-service";
import { SyncAdalService } from "../services/sync-adal-service";
import { SyncDimxService } from "../services/sync-dimx-service";
import { SyncFileService } from "../services/sync-file-service";
import { BaseCommand as BaseCommand } from "./base-command";
import { TenThousandRecordsCommand } from "./number-of-records-ten-thousand-command";


export class HundredRecordsCommand extends TenThousandRecordsCommand {
    papiClient: PapiClient;  
    client: Client  
    syncDimxService: SyncDimxService
    syncFileService: SyncFileService
    constructor(syncAdalService: SyncAdalService, client: Client, papiClient:PapiClient, resourceManager: ResourceManagerService){
        super(syncAdalService, client, papiClient, resourceManager)
        this.papiClient = papiClient
        this.client = client
        this.syncDimxService = new SyncDimxService()
        this.syncFileService = new SyncFileService(this.client,this.papiClient)
    }
    protected override MAX_RECORDS_TO_UPLOAD: number = 400;

    async processSyncResponse(syncRes: any): Promise<any> {
        this.syncDataResult.data =  await this.syncService.handleSyncData(syncRes,false)
        return this.syncDataResult.data;
    }
  }