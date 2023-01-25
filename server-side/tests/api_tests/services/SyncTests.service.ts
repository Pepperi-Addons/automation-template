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
    auditLogRes: object | any;

    constructor(client: Client){
        this.client = client
        this.systemService= new GeneralService(this.client)
        this.papiClient = this.systemService.papiClient;
        this.addonUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4";
        this.schemaName="integration_test_schema_of_sync_" + uuid().split('-').join('_');
        this.auditLogRes = {};
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
        this.auditLogRes = JSON.parse(res.AuditInfo.ResultObject)
    }

    async getSchemesFromAudit(syncRes:object) {
        await this.getAuditLogData(syncRes)
        let resultObject = this.auditLogRes
        let schemesArray: string[] = []
        resultObject.ResourcesData.map(resource =>{
            if(resource.Schema.AddonUUID == this.addonUUID){
                schemesArray.push(resource.Schema.Name)
            }
        })
        return schemesArray
    }
    getSchemeWithOneField() {
        const syncSchema:AddonDataScheme = {
            Name: this.schemaName,
            Type: "data",
            SyncData: {
                Sync: true
            },
            Fields:{
                Field1:{Type:"String"}
            }
        }
        return syncSchema
    }
    getSchemeWithMultipleFields(fieldNumber:number) {
        let fieldNames: {[key:string]:SchemeField} = {}
        for(let i=0;i<fieldNumber;i++) {
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

    async getAdalServiceOneField() {
        const adalService = new ADALTableService(this.papiClient,this.addonUUID,this.getSchemeWithOneField())
        await adalService.initResource()
        return adalService
    }

    async getAdalSeviceMultipleFields(numberOfFields:number) {
        const adalSchemaMultipleFields = this.getSchemeWithMultipleFields(numberOfFields)
        const adalService = new ADALTableService(this.papiClient,this.addonUUID,adalSchemaMultipleFields)
        await adalService.initResource()
        return adalService
    }

    getAddonDataOneField(numberOfCharacters: number){
        let fieldData=''
        for( let i=0; i<numberOfCharacters; i++){
            fieldData+='.'
        }
        const data: AddonData = {Key: "1", Field1:fieldData}
        return data
    }

    getScehmaName(){
        return this.schemaName
    }

}



