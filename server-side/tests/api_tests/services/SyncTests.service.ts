import { AddonDataScheme, SchemeField, PapiClient,AddonData } from "@pepperi-addons/papi-sdk"
import  GeneralService from "../../../potentialQA_SDK/server_side/general.service";
import { Client } from  '@pepperi-addons/debug-server'
import { v4 as uuid } from 'uuid';
import { ADALTableService } from "./resource_management/adal_table.service";
import { AddonEndpoint } from "@pepperi-addons/papi-sdk/dist/endpoints";
import { get } from "https"; 

export class SyncTestService {
    client : Client
    papiClient: PapiClient;
    systemService: GeneralService;
    addonUUID: string;
    schemaName: string;
    activeResources?:ADALTableService[]=[];

    constructor(client: Client){
        this.client = client
        this.systemService= new GeneralService(this.client)
        this.papiClient = this.systemService.papiClient;
        this.addonUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4";
        this.schemaName="integration_test_schema_of_sync_" + uuid().split('-').join('_');
    }

    async callReturnUrlAPI(modificationDateTime:string){
        const baseUrl = `/addons/data/pull?return_url=true`
        let res = await this.papiClient.post(baseUrl, {ModificationDateTime:modificationDateTime})
        return res
    }    

    async initAdalTable(numberOfFields:number,numberOfCharacters:number) {
        let adalService = await this.getAdalService(numberOfFields)
        await adalService.upsertRecord(this.getAddonDataFields(numberOfFields,numberOfCharacters))
        this.activeResources.push(adalService)
        return adalService
    }

    async cleanup() {
        await Promise.all(this.activeResources.map(resource=>{
            resource.removeResource()
        }))
    }
    
    async callSyncPullAPI(modificationDateTime:string) {
        const baseUrl = `/addons/data/pull`
        let res = await this.papiClient.post(baseUrl, {ModificationDateTime:modificationDateTime})
        return res
    }

    async getAuditLogData(syncRes:any){
        let res = await this.papiClient.get(syncRes['ExecutionURI'])
        while(res.Status.Name =='InProgress'){
            this.systemService.sleep(500)
            res = await this.papiClient.get(syncRes['ExecutionURI'])
        }
        if(res.AuditInfo.Error){
            throw new Error(res.AuditInfo.Error)
        }
        return JSON.parse(res.AuditInfo.ResultObject)
    }

    async getSchemesFromAudit(auditLogRes:any) {
        let schemesArray = auditLogRes.ResourcesData.map(resource =>{
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
      

    async getSchemesFromUrl(syncRes:object) {
        let auditLogRes = await this.getAuditLogData(syncRes)
        let ResourcesURL = auditLogRes.ResourcesURL
        let res = await this.getJSON(ResourcesURL);
        return await this.getSchemesFromAudit(res)
    }

    getSchemeWithFields(fieldNumber:number) {
        let fieldNames: {[key:string]:SchemeField} = {}
        for(let i=1;i<fieldNumber+1;i++) {
            let fieldName = "Field"+i
            fieldNames[fieldName]= {"Type": "String"}
        }

        const syncSchema:AddonDataScheme = {
            Name: this.schemaName,
            Type: "data",
            SyncData: {
                Sync: true
            },
            Fields: fieldNames
        }
        return syncSchema
    }

    async getAdalService(numberOfFields:number):Promise<ADALTableService> {
        const adalSchemaFields = this.getSchemeWithFields(numberOfFields)
        const adalService = new ADALTableService(this.papiClient,this.addonUUID,adalSchemaFields)
        await adalService.initResource()
        return adalService
    }

    getAddonDataFields(numberOfFields:number ,numberOfCharacters: number){
        let fieldData=''
        for( let i=0; i<numberOfCharacters; i++){
            fieldData+='.'
        }
        let data: AddonData = {Key: "1", Fields:[]}
        for(let i=1;i<numberOfFields+1;i++){
            data.Fields["Field"+i] = fieldData
        }
        return data
    }

    get scehmaName(){
        return this.schemaName
    }

}



