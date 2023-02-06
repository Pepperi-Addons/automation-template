import { PapiClient } from "@pepperi-addons/papi-sdk"
import  GeneralService from "../../../../../potentialQA_SDK/server_side/general.service";
import { Client } from  '@pepperi-addons/debug-server'
import { GlobalSyncService } from "./global-service";
import { AuditLogService } from "./audit-log-service";

export const TIME_TO_SLEEP_FOR_NEBULA: number = 8000
export class SyncService {
    client : Client
    papiClient: PapiClient;
    systemService: GeneralService;
    addonUUID: string;
    auditLogService: AuditLogService
    syncData: any;
    

    constructor(client: Client){
        this.client = client
        this.systemService= new GeneralService(this.client)
        this.papiClient = this.systemService.papiClient;
        this.addonUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4";
        this.auditLogService = new AuditLogService(client)
    }

    async getSyncDataFromUrl(url: string){
        return await GlobalSyncService.httpGet(url)
    }

    async handleSyncData(syncRes:any,return_url: boolean = false){
        let resultObject = return_url ? await this.getSyncDataFromUrl(syncRes.ResourcesURL) : await this.auditLogService.getSyncDataFromAudit(syncRes)
        this.syncData = resultObject
    }

    async getSchemes() {
        let schemesArray = this.syncData.ResourcesData.map(resource =>{
            if(resource.Schema.AddonUUID == this.addonUUID){
                return resource.Schema.Name
            }
        })
        return schemesArray
    }

    async getFields(schemaNames:any){
        let fields ={account:{},user:{},none:{}}
        let schemesArray = this.syncData.ResourcesData.map(resource =>{
            Object.entries(schemaNames).find(([key, value]) => {if(value == resource.Schema.Name){
                fields[key] = resource.Objects
            }})
        })
        return fields
    }
    
    async nebulaCleanRebuild(){
        const baseUrl = `/addons/api/00000000-0000-0000-0000-000000006a91/api/clean_rebuild`
        let res = await this.papiClient.post(baseUrl)
        return res
    }

    async pull(options: PullOptions,return_url: boolean = false) {
        const baseUrl = return_url ? `/addons/api/5122dc6d-745b-4f46-bb8e-bd25225d350a/api/sync_adal_data?return_url=true` : `/addons/data/pull`
        let res = await this.papiClient.post(baseUrl, options)
        return res
    }

}

export interface PullOptions {
    ModificationDateTime: string;
    SystemFilter?: object;
}


