import { PapiClient } from "@pepperi-addons/papi-sdk"
import  GeneralService from "../../../../../potentialQA_SDK/server_side/general.service";
import { Client } from  '@pepperi-addons/debug-server'
import { GlobalSyncService } from "./global-sync-service";
import { AuditLogService } from "./audit-log-service";

export class SyncService {
    client : Client
    papiClient: PapiClient;
    systemService: GeneralService;
    auditLogService: AuditLogService

    constructor(client: Client) {
        this.client = client
        this.systemService = new GeneralService(this.client)
        this.papiClient = this.systemService.papiClient;
        this.auditLogService = new AuditLogService(client)
    }

    async getSyncDataFromUrl(url: string){
        return await GlobalSyncService.httpGet(url)
    }

    async handleSyncData(syncRes:any,return_url: boolean = false){
        return  return_url ? await this.getSyncDataFromUrl(syncRes.ResourcesURL) : await this.auditLogService.getSyncDataFromAudit(syncRes)
    }
    
    async nebulaCleanRebuild(){
        const baseUrl = `/addons/api/00000000-0000-0000-0000-000000006a91/api/clean_rebuild`
        let res = await this.papiClient.post(baseUrl)
        return res
    }

    async pull(options: PullOptions, returnUrl: boolean, wacd: boolean, connectAccount: boolean) {
        const baseUrl = `/addons/data/pull?return_url=${!!returnUrl}&wacd=${!!wacd}&connect_account=${!!connectAccount}`
        let res = await this.papiClient.post(baseUrl, options)
        return res
    }

}

export interface PullOptions {
    ModificationDateTime: string;
    SystemFilter?: object;
}


