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
    activeResources: ADALTableService[] = [];
    accountUUID: string;

    constructor(client: Client){
        this.client = client
        this.systemService= new GeneralService(this.client)
        this.papiClient = this.systemService.papiClient;
        this.addonUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4";
        this.schemaName="integration_test_schema_of_sync_" + uuid().split('-').join('_');
        this.accountUUID ="0bc8882e-b33b-45ac-8240-5b4fc7d92592"
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

    async initAdalAccountRefTable() {
        let adalService = await this.getAdalServiceAccountRef()
        await adalService.upsertBatch(this.accountRefData)
        this.activeResources.push(adalService)
        return adalService
    }

    async initAdalUserTable() {
        let adalService = await this.getAdalServiceUsers()
        await adalService.upsertBatch(this.userData)
        this.activeResources.push(adalService)
        return adalService
    }

    async cleanup() {
        await Promise.all(this.activeResources?.map(resource => resource.removeResource()))
    }
    
    async callSyncPullAPI(modificationDateTime:string,systemFilter?:any) {
        const baseUrl = `/addons/data/pull`
        let res = await this.papiClient.post(baseUrl, {ModificationDateTime:modificationDateTime,SystemFilter:systemFilter})
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

    get accountRefScheme(){
        const syncSchema:AddonDataScheme = {
            Name: this.schemaName+'_accounts',
            GenericResource:true,
            Type: "data",
            SyncData: {
                Sync: true
            },
            Fields: {
                AccountUUID: {
                    Type: "Resource",
                    Resource: "accounts",
                    ApplySystemFilter: true
                },
                Name:{
                    Type: "String"
                }
            }
        }
        return syncSchema
    }

    get userScheme(){
        const syncSchema:AddonDataScheme = {
            Name: this.schemaName+'_users',
            GenericResource:true,
            Type: "data",
            SyncData: {
                Sync: true
            },
            Fields: {
                UserUUID: {
                    Type: "Resource",
                    Resource: "users",
                    ApplySystemFilter: true
                },
                Name:{
                    Type: "String"
                }
            }
        }
        return syncSchema
    }

    async getAdalService(numberOfFields:number):Promise<ADALTableService> {
        const adalSchemaFields = this.getSchemeWithFields(numberOfFields)
        const adalService = new ADALTableService(this.papiClient,this.addonUUID,adalSchemaFields)
        await adalService.initResource()
        return adalService
    }

    async getAdalServiceAccountRef():Promise<ADALTableService>{

        const adalSchemaFields = this.accountRefScheme
        const adalService = new ADALTableService(this.papiClient,this.addonUUID,adalSchemaFields)
        await adalService.initResource()
        return adalService
    }

    async getAdalServiceUsers():Promise<ADALTableService>{
        const adalSchemaFields = this.userScheme
        const adalService = new ADALTableService(this.papiClient,this.addonUUID,adalSchemaFields)
        await adalService.initResource()
        return adalService
    }

    get accountRefData(){
        let data:AddonData[]=[
            {   Key:"1",
                AccountUUID: "0bc8882e-b33b-45ac-8240-5b4fc7d92592",
                Name : "1"
            },
            {
                Key:"2",
                AccountUUID: "0bc8882e-b33b-45ac-8240-5b4fc7d92592",
                Name : "2"
            },{
                Key:"3",
                AccountUUID: "56dcc8e7-a951-4b35-8d28-54c2cb2dacdf",
                Name : "3"
            }]
        return data
    }

    get userData(){
        let data:AddonData[]=[
            {   Key:"1",
                UserUUID: "3f122e90-239d-46c3-b3c7-57940b2363ae",
                Name : "1"
            },
            {
                Key:"2",
                UserUUID: "5ea6471a-0324-4f5e-90ff-df03fb7cd6f6",
                Name : "2"
            },{
                Key:"3",
                UserUUID: "3aaa3fd5-808f-4dfb-9431-f545de26d0d3",
                Name : "3"
            }]
        return data
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
    getSystemFilter(account:boolean,webapp:boolean){
        let Type = account ? 'Account' : webapp? 'User' : 'None'
        let SystemFilter = {Type: Type }
        account ? SystemFilter["AccountUUID"] = this.accountUUID : undefined
        return SystemFilter
    }

    get scehmaName(){
        return this.schemaName
    }

}



