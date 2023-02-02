import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import GeneralService from "../../../../../potentialQA_SDK/server_side/general.service";
import { get } from "https"; 
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
        while(res.Status.Name =='InProgress' || res.Status.Name =='Started'){
            await this.syncService.sleep(this.TIME_TO_SLEEP_FOR_AUDIT)
            res = await this.papiClient.get(syncRes['ExecutionURI'])
        }
        if(res.AuditInfo.Error || res.AuditInfo.ErrorMessage){
            throw new Error(res.AuditInfo.ErrorMessage)
        }
        return JSON.parse(res.AuditInfo.ResultObject)
    }

    async getSchemesFromAudit(syncRes:any,return_url:boolean) {
        let resultObject = return_url ? await this.getJSON(syncRes.ResourcesURL) : await this.getAuditLogData(syncRes)
        let schemesArray = resultObject.ResourcesData.map(resource =>{
            if(resource.Schema.AddonUUID == this.addonUUID){
                return resource.Schema.Name
            }
        })
        return schemesArray
    }

    getJSON(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
          get(url, (res) => {
              let data = '';
              res.on('data', (chunk) => {
                  data += chunk;
              });
              res.on('end', () => {
                  try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                  } catch (err) {
                    reject(err);
                  }
              });
          }).on('error', (err) => {
              reject(err);
          });
        });
      }
}