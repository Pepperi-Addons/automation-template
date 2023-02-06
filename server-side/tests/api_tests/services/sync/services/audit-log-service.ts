import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import GeneralService from "../../../../../potentialQA_SDK/server_side/general.service";

import { GlobalSyncService as GlobalSyncService } from "./global-sync-service";

export class AuditLogService {
    client : Client
    papiClient: PapiClient;
    systemService: GeneralService;
    addonUUID: string;
    TIME_TO_SLEEP_FOR_AUDIT: number

    constructor(client: Client){
        this.client = client
        this.systemService= new GeneralService(this.client)
        this.papiClient = this.systemService.papiClient;
        this.addonUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4";
        this.TIME_TO_SLEEP_FOR_AUDIT = 500
    }
    async getSyncDataFromAudit(syncRes:any){
        let res = await this.papiClient.get(syncRes['ExecutionURI'])
        while(res.Status.Name =='InProgress' || res.Status.Name =='Started'){
            await GlobalSyncService.sleep(this.TIME_TO_SLEEP_FOR_AUDIT)
            res = await this.papiClient.get(syncRes['ExecutionURI'])
        }
        if(res.AuditInfo.Error || res.AuditInfo.ErrorMessage){
            throw new Error(res.AuditInfo.ErrorMessage)
        }
        return JSON.parse(res.AuditInfo.ResultObject)
    }
}