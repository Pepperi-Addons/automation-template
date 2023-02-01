import { PapiClient } from "@pepperi-addons/papi-sdk"
import  GeneralService from "../../../../../potentialQA_SDK/server_side/general.service";
import { Client } from  '@pepperi-addons/debug-server'
import { ADALTableService } from "../../resource_management/adal_table.service";

export class SyncTestService {
    client : Client
    papiClient: PapiClient;
    systemService: GeneralService;
    addonUUID: string;

    constructor(client: Client){
        this.client = client
        this.systemService= new GeneralService(this.client)
        this.papiClient = this.systemService.papiClient;
        this.addonUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4";
    }

    async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    } 
    
    async callSyncPullAPI(modificationDateTime:string,return_url: boolean) {
        const baseUrl = return_url ? `/addons/api/5122dc6d-745b-4f46-bb8e-bd25225d350a/api/sync_adal_data?return_url=true` : `/addons/data/pull`
        let res = await this.papiClient.post(baseUrl, {ModificationDateTime:modificationDateTime})
        return res
    }

}



