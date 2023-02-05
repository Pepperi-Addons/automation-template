import { AddonDataScheme, SchemeField, PapiClient,AddonData, Account } from "@pepperi-addons/papi-sdk"
import { Client } from  '@pepperi-addons/debug-server'
import GeneralService from "../../../../../potentialQA_SDK/server_side/general.service";
import { SyncAdalService } from "./sync-adal-service";

export class SystemFilterService extends SyncAdalService {    
    private accountUUIDS: string[] =["3b5e29fb-ba1a-44ae-a84f-532028a9a28a","2d639aed-3a42-49b8-aaec-cdecc1fd2a37","f6521e90-7edc-49da-b9ed-28e7b252cfbc"]
    private usertUUIDS: string[] =["31cfbcba-08f0-4af8-900f-fcccde066af4","27f21174-29c7-4b70-bb72-b2d8f77b4bf6"]

    generateSystemFilterScheme(account: boolean, user:boolean){
        const userField:AddonDataScheme['Fields'] = {UserUUID:{Type: "Resource", Resource: "users", ApplySystemFilter: true },Name:{Type: "String"}}
        const accountField:AddonDataScheme['Fields'] = {AccountUUID: {Type: "Resource", Resource: "accounts", ApplySystemFilter: true }}
        const syncSchema:AddonDataScheme = {
            Name: this.generateScehmaName(account ? '_account' : user ? '_user' : '_none'),
            GenericResource:true,
            Type: "data",
            SyncData: {
                Sync: true
            }
        }
        syncSchema.Fields= user ? userField : account ? accountField : {Name:{Type: "String"}}
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
            field.UserUUID = user ?  this.usertUUIDS[index] : undefined
            field.AccountUUID = account ?  this.accountUUIDS[index] : undefined
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
}