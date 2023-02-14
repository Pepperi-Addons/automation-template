import { AddonDataScheme,AddonData } from "@pepperi-addons/papi-sdk"
import { SyncAdalService } from "./sync-adal-service";

export class SystemFilterService extends SyncAdalService {    
    private accountUUIDS: any = this.papiClient.accounts.iter({
        fields: ['UUID']
    }).toArray().then(accounts => { 
        this.accountUUIDS = accounts.map(uuid => {
            return uuid.UUID
        })
    });
    private userUUIDS: any = this.papiClient.users.iter({
        fields: ['UUID']
    }).toArray().then(users => { 
        this.userUUIDS = users.map(uuid => {
            return uuid.UUID
        })
    });
    private CORE_RESOURCES_ADDON_UUID = 'fc5a5974-3b30-4430-8feb-7d5b9699bc9f'

    generateSystemFilterScheme(type: 'User' | 'Account' | 'None'){
        const syncSchema:AddonDataScheme = {
            Name: this.generateScehmaName(`_${type.toLowerCase()}`),
            Type: "data",
            Fields: this.generateSchemaField(type),
            SyncData: {
                Sync: true
            }
        }
        return syncSchema
    }

    generateSystemFilterData(account: boolean, user:boolean){
        if(this.userUUIDS.length < 3 || this.accountUUIDS.length < 3 ){
            throw new Error(`User uuid count is ${this.userUUIDS.length}, Account uuid count is ${this.accountUUIDS.length},
            both need to be at least 3`)
        }
        let baseData:AddonData[] = [
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

    getSystemFilter(account: boolean, webapp: boolean, accountUUID?: string){
        let Type = account ? 'Account' : webapp? 'User' : 'None'
        let SystemFilter = {
            SystemFilter: {
                Type: Type 
            }
        }
        if(account && !accountUUID){
            throw new Error('Account must have Account UUID')
        }
        account ? SystemFilter.SystemFilter["AccountUUID"] = accountUUID : undefined
        return SystemFilter
    }

    generateSchemaField(type: 'User' | 'Account' | 'None'){
        const resource = type == 'User' ? 'users' : 'accounts';
        const nameField: AddonDataScheme['Fields'] = {
            Name:{
                Type: "String"
            }
        }
        const resourceField:AddonDataScheme['Fields'] = {
            [`${type}_Field`]: {
                Type: "Resource", 
                Resource: resource, 
                ApplySystemFilter: true,
                AddonUUID: this.CORE_RESOURCES_ADDON_UUID
            }
        }
        return type != 'None' ? resourceField : nameField
    }
}