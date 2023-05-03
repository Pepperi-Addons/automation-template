import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import {GeneralService} from "test_infra";

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

    async pollExecution(ExecutionUUID: string, interval = 5000, maxAttempts = 60, validate = (res) => {
        return res != null && (res.Status.Name === 'Failure' || res.Status.Name === 'Success');
    }) {
        let attempts = 0;
        const executePoll = async (resolve, reject) => {
            const result = await this.papiClient.get(`/audit_logs/${ExecutionUUID}`);
            attempts++;
            if (validate(result)) {
                return resolve({ "success": result.Status.Name === 'Success', "errorCode": 0, 'resultObject': result.AuditInfo.ResultObject });
            }
            else if (maxAttempts && attempts === maxAttempts) {
                return resolve({ "success": false, "errorCode": 1 });
            }
            else {
                setTimeout(executePoll, interval, resolve, reject);
            }
        };
        return new Promise<any>(executePoll);
    }
}