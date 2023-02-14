import { AddonDataScheme,AddonData, Account } from "@pepperi-addons/papi-sdk"
import { GlobalSyncService } from "./global-sync-service";
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

    async getConnectedAccounts(): Promise<any[]> {
        // Get data
        const accounts = await this.papiClient.accounts.iter().toArray();
        const currentUserUUID = GlobalSyncService.getCurrentUserUUID(this.papiClient);
        const accountsUsers = await this.papiClient.get(`/addons/data/${this.CORE_RESOURCES_ADDON_UUID}/account_users?where=Hidden=0`);

        const connectedAccountUsers = accountsUsers.filter(accountUser => accountUser.User === currentUserUUID);

        const accountThatConnected = accounts.map(account => {
            connectedAccountUsers.find(conn => {
                if(conn.Account === account.UUID){
                    return account
                }
            })
        })

        // const accountThatPoints = accounts.find(account => account.UUID === pointingAccountUsers[0].Account);
        if (connectedAccountUsers.length === 0) {
            throw new Error('Could not find an account that points to current user, create one and try again.');
        }

        // Search for an account that points to current user
        return accountThatConnected
    }

    async getAccountUUIDOfCurrentUser(): Promise<string> {
        const accountsConnected = await this.getConnectedAccounts()
        return accountsConnected[0].UUID
    }

    async getNumberOfConnectAccount(): Promise<number> {
        const accountsConnected = await this.getConnectedAccounts()
        return accountsConnected.length
    }
        

    getSystemFilter(account:boolean,webapp:boolean,accountUUID?:string){
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