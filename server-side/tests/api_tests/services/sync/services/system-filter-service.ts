import { AddonDataScheme,AddonData, Account } from "@pepperi-addons/papi-sdk"
import { AccountsService, CORE_RESOURCES_ADDON_UUID } from "./accounts-service";
import { SyncAdalService } from "./sync-adal-service";
import { UsersService } from "./users-service";

export class SystemFilterService extends SyncAdalService {  
    accountsService: AccountsService;
    usersService: UsersService;

    constructor(client) {
        super(client);
        this.accountsService = new AccountsService(this.papiClient);
        this.usersService = new UsersService(this.papiClient);
    }
  
    generateScheme(type: 'User' | 'Account' | 'None'){
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

    async generateUserData() {
        const currentUserUUID = this.usersService.getCurrentUserUUID();
        const notCurrentUserUUID = await this.usersService.getNotCurrentUserUUID();
        let fieldsData:AddonData[] = [
            {   Key:"1",
                Name : "1",
                User_Field: currentUserUUID
            },
            {
                Key:"2",
                Name : "2",
                User_Field: notCurrentUserUUID
            }
        ]        
        return fieldsData

    }
    async generateAccountsData(): Promise<AddonData[]> {
        const connectedAccounts = await this.accountsService.getConnectedAccounts();
        const notConnectedAccounts = await this.accountsService.getNotConnectedAccounts();
        
        const connectedAccount = connectedAccounts[0];
        const notConnectedAccount =  notConnectedAccounts[0];
        
        let fieldsData:AddonData[] = [
            {   Key:"1",
                Name : "1",
                Account_Field: connectedAccount.UUID
            },
            {
                Key:"2",
                Name : "2",
                Account_Field: notConnectedAccount.UUID
            }
        ]        
        return fieldsData
    }        

    generateSystemFilter(account:boolean,webapp:boolean,accountUUID?:string){
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
                AddonUUID: CORE_RESOURCES_ADDON_UUID
            }
        }
        return type != 'None' ? resourceField : nameField
    }
}