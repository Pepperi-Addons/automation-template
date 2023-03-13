import { Account, AddonData, PapiClient } from "@pepperi-addons/papi-sdk";
import { UsersService } from "./users-service";
export const CORE_RESOURCES_ADDON_UUID = 'fc5a5974-3b30-4430-8feb-7d5b9699bc9f'
import { v4 as uuid } from 'uuid';

export class AccountsService {

    private papiClient: PapiClient;
    private usersService: UsersService;
    constructor(papiClient: PapiClient) {        
        this.papiClient = papiClient;
        this.usersService = new UsersService(this.papiClient);
    }
    private accountsCreated:Account[] =[]
    
    async getAccounts() {
        return await this.papiClient.accounts.iter({}).toArray();
    }

    async getAccountsUUIDs() {
        const accountUUIDS = await this.papiClient.accounts.iter({fields: ['UUID']}).toArray();
        return accountUUIDS.map(account => {
            return account.UUID
        });
    }

    async getNotConnectedAccounts(): Promise<any[]> {
        const allAccounts = await this.getAccounts();
        const connectedAccounts = await this.getConnectedAccounts();
        const notConnectedAccounts = allAccounts.filter(account => {
            return !connectedAccounts.find(conn => conn.UUID === account.UUID)
        });
        if(notConnectedAccounts.length == 0){
            let acc = await this.createAccount()
            await this.hideAccountFromCurrentUser(acc)
            return [acc]
        }
        return notConnectedAccounts;
    }

    async getConnectedAccounts(): Promise<any[]> {
        // Get data
        const accounts = await this.papiClient.accounts.iter().toArray();
        const currentUserUUID = this.usersService.getCurrentUserUUID();
        const accountsUsers = await this.papiClient.get(`/addons/data/${CORE_RESOURCES_ADDON_UUID}/account_users?where=Hidden=0`);

        const connectedAccountUsers = accountsUsers.filter(accountUser => accountUser.User === currentUserUUID);

        const accountThatConnected = accounts.filter(account => connectedAccountUsers.find(accountUser => accountUser.Account === account.UUID));

        if (connectedAccountUsers.length === 0) {
            throw new Error('Could not find an account that points to current user, create one and try again.');
        }

        // Search for an account that points to current user
        return accountThatConnected
    }

    async getConnectedAccountUUID(): Promise<string> {
        const accountsConnected = await this.getConnectedAccounts()
        return accountsConnected[0].UUID
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

    generateAccountData(uuids: string[]){
        const fieldsData:AddonData[] = uuids.map(function (uuid,index){
            return {Key: index.toString(), Name: index.toString(),Account_Field:uuid}
        })      
        return fieldsData
    }

}