import { AddonDataScheme,AddonData } from "@pepperi-addons/papi-sdk"
import { SyncAdalService } from "./sync-adal-service";
import { GlobalSyncService } from "./global-sync-service";

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

    async getAccountUUIDOfCurrentUser(): Promise<string> {
        // Get data
        const accounts = await this.papiClient.accounts.iter().toArray();
        const currentUserUUID = GlobalSyncService.getCurrentUserUUID(this.papiClient);
        const accountsUsers = await this.papiClient.get(`/addons/data/${this.CORE_RESOURCES_ADDON_UUID}/account_users?where=Hidden=0`);

        const pointingAccountUsers = accountsUsers.filter(accountUser => accountUser.User === currentUserUUID);

        const accountThatPoints = accounts.find(account => pointingAccountUsers.find(pau => pau.Account === account.UUID));

        // const accountThatPoints = accounts.find(account => account.UUID === pointingAccountUsers[0].Account);
        if (pointingAccountUsers.length === 0) {
            throw new Error('Could not find an account that points to current user, create one and try again.');
        }

        // Search for an account that points to current user
        return accountThatPoints!.UUID!
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