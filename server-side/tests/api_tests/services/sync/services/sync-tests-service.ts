import { PapiClient } from "@pepperi-addons/papi-sdk"
import  GeneralService from "../../../../../potentialQA_SDK/server_side/general.service";
import { Client } from  '@pepperi-addons/debug-server'
import { GlobalSyncService } from "./global-sync-service";
import { AuditLogService } from "./audit-log-service";

export const TIME_TO_SLEEP_FOR_NEBULA: number = 8000
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
        let data = await this.auditLogService.getSyncDataFromAudit(syncRes)
        let res = data
        if(return_url){
            res = await this.getSyncDataFromUrl(data.ResourcesURL)
        }
        return res
    }
    
    async nebulaCleanRebuild(){
        const baseUrl = `/addons/api/00000000-0000-0000-0000-000000006a91/api/clean_rebuild`
        let res = await this.papiClient.post(baseUrl)
        let ansFromAuditLog =  await this.auditLogService.pollExecution(res.ExecutionUUID!)
        if (ansFromAuditLog.success === true) {
            console.log('successfully did clean rebuild in nebula')
        }
        else {
            throw new Error(`Failed to clean rebuild nebula`);
        }
    }

    async pull(options: PullOptions, returnUrl: boolean, wacd: boolean) {
        const baseUrl = `/addons/data/pull?return_url=${!!returnUrl}&wacd=${!!wacd}`
        let res = await this.papiClient.post(baseUrl, options)
        return res
    }

    async pullConnectAccount(options: PullOptions, accountUUID: string) {
        const baseUrl = `/addons/data/pull?connect_account=true&account_uuid=${accountUUID}`
        let res = await this.papiClient.post(baseUrl, options)
        return res
    }

}

export interface PullOptions {
    ModificationDateTime: string;
    SystemFilter?: object;
}