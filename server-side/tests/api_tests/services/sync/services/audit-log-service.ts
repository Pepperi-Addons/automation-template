import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import GeneralService from "../../../../../potentialQA_SDK/server_side/general.service";
import { GlobalService } from "./global-service";
import { SyncService } from "./sync-tests-service";

export class AuditLogService {
    client : Client
    papiClient: PapiClient;
    systemService: GeneralService;
    addonUUID: string;
    syncService: SyncService
    TIME_TO_SLEEP_FOR_AUDIT: number

    constructor(client: Client){
        this.client = client
        this.systemService= new GeneralService(this.client)
        this.papiClient = this.systemService.papiClient;
        this.addonUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4";
        this.syncService = new SyncService(this.client)
        this.TIME_TO_SLEEP_FOR_AUDIT = 500
    }
    async getAuditLogData(syncRes:any){
        let res = await this.papiClient.get(syncRes['ExecutionURI'])
        while(res.Status.Name =='InProgress'){
            await GlobalService.sleep(this.TIME_TO_SLEEP_FOR_AUDIT)
            res = await this.papiClient.get(syncRes['ExecutionURI'])
        }
        if(res.AuditInfo.Error){
            throw new Error(res.AuditInfo.Error)
        }
        return JSON.parse(res.AuditInfo.ResultObject)
    }

    async getSchemesFromAudit(syncRes:object) {
        let auditLogRes = await this.getAuditLogData(syncRes)
        let resultObject = auditLogRes
        let schemesArray = resultObject.ResourcesData.map(resource =>{
            if(resource.Schema.AddonUUID == this.addonUUID){
                return resource.Schema.Name
            }
        })
        return schemesArray
    }
}