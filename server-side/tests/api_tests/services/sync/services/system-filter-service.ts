import { AddonDataScheme,AddonData, Account } from "@pepperi-addons/papi-sdk"
import { AccountsService, CORE_RESOURCES_ADDON_UUID } from "./accounts-service";
import { SyncAdalService } from "./sync-adal-service";
import { UsersService } from "./users-service";

export class SystemFilterService extends SyncAdalService {  
    usersService: UsersService;
    accountsService: AccountsService;

    constructor(client) {
        super(client);
        this.usersService = new UsersService(this.papiClient);
        this.accountsService = new AccountsService(this.papiClient);
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
    async generateAccountsData(accountsUUID?: Account[]): Promise<AddonData[]> {
        const connectedAccounts = await this.accountsService.getConnectedAccounts();
        const notConnectedAccounts = await this.accountsService.getNotConnectedAccounts();
        
        const connectedAccount = connectedAccounts[0];
        const notConnectedAccount =  notConnectedAccounts[0];

        if(accountsUUID && accountsUUID.length<2){
            throw new Error('need to receive at least 2 accounts!')
        }
        
        return this.accountsService.generateAccountData([connectedAccount.UUID,notConnectedAccount.UUID])
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
        const resourceField: AddonDataScheme['Fields'] = {
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