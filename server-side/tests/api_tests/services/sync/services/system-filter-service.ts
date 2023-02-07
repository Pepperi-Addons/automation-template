import { AddonDataScheme, SchemeField, PapiClient,AddonData, Account } from "@pepperi-addons/papi-sdk"
import { Client } from  '@pepperi-addons/debug-server'
import GeneralService from "../../../../../potentialQA_SDK/server_side/general.service";
import { SyncAdalService } from "./sync-adal-service";

export class SystemFilterService extends SyncAdalService {    
    private accountUUIDS: string[] =["3b5e29fb-ba1a-44ae-a84f-532028a9a28a","2d639aed-3a42-49b8-aaec-cdecc1fd2a37","f6521e90-7edc-49da-b9ed-28e7b252cfbc"]
    private userUUIDS: string[] =["31cfbcba-08f0-4af8-900f-fcccde066af4","27f21174-29c7-4b70-bb72-b2d8f77b4bf6","cbfc3250-acab-46c6-a51b-67ed6442531d"]
    private CORE_RESOURCES_ADDON_UUID ='fc5a5974-3b30-4430-8feb-7d5b9699bc9f'

    generateSystemFilterScheme(type: 'User'|'Account'|'None'){
        const syncSchema:AddonDataScheme = {
            Name: this.generateScehmaName(`_${type.toLowerCase()}`),
            Type: "data",
            SyncData: {
                Sync: true
            }
        }
        syncSchema.Fields= this.generateSchemaField(type)
        return syncSchema
    }

    generateSystemFilterData(account: boolean, user:boolean){
        let baseData:AddonData[]=[
            {   Key:"1",
                Name : "1",
            },
            {
                Key:"2",
                Name : "2"
            },{
                Key:"3",
                Name : "3"
            }]
        baseData.map((field,index) =>{
            field.User_Field = user ?  this.userUUIDS[index] : undefined
            field.Account_Field = account ?  this.accountUUIDS[index] : undefined
        })
        return baseData
    }

    getSystemFilter(account:boolean,webapp:boolean,accountUUID?:string){
        let Type = account ? 'Account' : webapp? 'User' : 'None'
        let SystemFilter = {SystemFilter:{Type: Type }}
        if(account && !accountUUID){
            throw new Error('Account must have Account UUID')
        }
        account ? SystemFilter.SystemFilter["AccountUUID"] = accountUUID : undefined
        return SystemFilter
    }

    generateSchemaField(type: 'User'|'Account'|'None'){
        const resource = type=='User' ? 'users': 'accounts';
        const nameField: AddonDataScheme['Fields']={
            Name:{
                Type: "String"
            }
        }
        const resourceField:AddonDataScheme['Fields'] = {
            [`${type}_Field`]:{
                Type: "Resource", 
                Resource: resource, 
                ApplySystemFilter: true,
                AddonUUID: this.CORE_RESOURCES_ADDON_UUID
            }
        }
        return type!='None' ? resourceField : nameField
    }
}