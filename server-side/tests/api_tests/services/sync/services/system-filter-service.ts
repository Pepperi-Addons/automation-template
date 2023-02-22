import { AddonDataScheme,AddonData, Account } from "@pepperi-addons/papi-sdk"
import { AccountsService, CORE_RESOURCES_ADDON_UUID } from "./accounts-service";
import { SyncAdalService } from "./sync-adal-service";
import { UsersService } from "./users-service";
import { v4 as uuid } from 'uuid';

export class SystemFilterService extends SyncAdalService {  
    accountsService: AccountsService;
    usersService: UsersService;

    constructor(client) {
        super(client);
        this.accountsService = new AccountsService(this.papiClient);
        this.usersService = new UsersService(this.papiClient);
    }
    private accountsCreated:Account[] =[]
  
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
        
        let fieldsData:AddonData[] = [
            {   Key:"1",
                Name : "1",
                Account_Field: accountsUUID? accountsUUID[0] : connectedAccount.UUID
            },
            {
                Key:"2",
                Name : "2",
                Account_Field: accountsUUID? accountsUUID[1] : notConnectedAccount.UUID
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

    async createAccount(){
        let account = await this.papiClient.accounts.upsert({
            Key: 'account_for_sync_tests'+uuid().split('-').join('_'), 
            ExternalID: Math.round(Math.random() * 10000 + 1).toString(),
            Hidden: false,
        })
        this.accountsCreated.push(account)
        return account
    }

    async connectAccountToCurrentUser(accountToConnect: Account){
        const accountUsersUrl = `/addons/data/${CORE_RESOURCES_ADDON_UUID}/account_users`;
        const body = {
            Account: accountToConnect.UUID,
            User: this.usersService.getCurrentUserUUID(),
            Hidden: false
        };
        try {
            return await this.papiClient.post(accountUsersUrl, body);
        }
        catch (error) {
            throw new Error(`Failed connecting accounts users, error: ${(error as Error).message}`);
        }
    }

    async hideAccountFromCurrentUser(accountToConnect: Account){
        const accountUsersUrl = `/addons/data/${CORE_RESOURCES_ADDON_UUID}/account_users`;
        const body = {
            Account: accountToConnect.UUID,
            User: this.usersService.getCurrentUserUUID(),
            Hidden: true
        };
        try {
            return await this.papiClient.post(accountUsersUrl, body);
        }
        catch (error) {
            throw new Error(`Failed hiding accounts users, error: ${(error as Error).message}`);
        }
    }

    async cleanupAccounts(){
        this.accountsCreated.map(account => {
            this.papiClient.accounts.delete(account.InternalID!)
        })
    }
}