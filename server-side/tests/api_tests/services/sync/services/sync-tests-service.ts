import { PapiClient } from "@pepperi-addons/papi-sdk"
import  {GeneralService} from "../../../../../potentialQA_SDK/src/infra_services/general.service";
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
        this.client = client;
        this.systemService = new GeneralService(this.client);
        this.papiClient = this.systemService.papiClient;
        this.auditLogService = new AuditLogService(client)
    }

    async getSyncDataFromUrl(url: string){
        const data = await GlobalSyncService.httpGet(url)
        const parsedData = data.split('\r\n').map(resource => JSON.parse(resource));
        return parsedData
    }

    async setSyncSoftLimit(softLimitInMB: Number, softLimitInMinutes: Number){
        // set sync soft limit, limits are in MB
        const softLimit = {
            "SYNC_DATA_SIZE_LIMITATION": softLimitInMB,
            "SYNC_TIME_LIMITATION": softLimitInMinutes
        }
        const res = await this.papiClient.post('/addons/api/5122dc6d-745b-4f46-bb8e-bd25225d350a/api/sync_variables',softLimit)
        return res
    }

    async getSyncVariables(){
        const res = await this.papiClient.get('/addons/api/5122dc6d-745b-4f46-bb8e-bd25225d350a/api/sync_variables')
        return (({SYNC_DATA_SIZE_LIMITATION, SYNC_TIME_LIMITATION}) => ({SYNC_DATA_SIZE_LIMITATION, SYNC_TIME_LIMITATION}))(res)

    }

    async handleSyncData(syncRes: any, return_url: boolean){
        let data = await this.auditLogService.getSyncDataFromAudit(syncRes)
        let res = data
        if(return_url){
            res = {Resources: {Data:await this.getSyncDataFromUrl(data.Resources.URL)}}
        }
        return res
    }

    async extractSyncResData(syncRes: any){
        let data
        if(syncRes['ExecutionURI']){
            data = await this.auditLogService.getSyncDataFromAudit(syncRes)
        }
        else{
            data = syncRes
        }
        return data
    }

    async getSyncData(syncRes: any){
        let res = await this.extractSyncResData(syncRes)
        if(res?.Resources?.URL){
            res = {Resources:{Data: await this.getSyncDataFromUrl(res.Resources.URL)}}
        }
        return res
    }

    async getSyncFilesData(syncRes: any){
        let res = await this.extractSyncResData(syncRes)
        if(res?.Files?.URL){
            res = {Files:{Data: await this.getSyncDataFromUrl(res.Files.URL)}}
        }
        return res
    }
    
    async nebulaCleanRebuild(){
        const baseUrl = `/addons/api/00000000-0000-0000-0000-000000006a91/api/clean_rebuild`
        let res = await this.papiClient.post(baseUrl,{})
        let ansFromAuditLog =  await this.auditLogService.pollExecution(res.ExecutionUUID!)
        if (ansFromAuditLog.success === true) {
            console.log('successfully did clean rebuild in nebula')
        }
        else {
            throw new Error(`Failed to clean rebuild nebula`);
        }
    }

    async pull(options: PullOptions, returnUrl: boolean, wacd: boolean, is_rep_in_webapp: boolean) {
        const baseUrl = `/addons/data/pull?return_url=${!!returnUrl}&wacd=${!!wacd}&is_rep_in_webapp=${!!is_rep_in_webapp}`
        let res = await this.papiClient.post(baseUrl, options)
        return res
    }

    async push(data: any, wacd: boolean) {
        const baseUrl = `/addons/api/5122dc6d-745b-4f46-bb8e-bd25225d350a/api/${wacd ? 'push_wacd' : 'push'}`
        let res = await this.papiClient.post(baseUrl, data)
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
    PathData?: object;
}