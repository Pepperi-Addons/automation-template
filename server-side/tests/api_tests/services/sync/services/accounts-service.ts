import { Client } from "@pepperi-addons/debug-server/dist";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import { GlobalSyncService } from "./global-sync-service";
import { UsersService } from "./users-service";
export const CORE_RESOURCES_ADDON_UUID = 'fc5a5974-3b30-4430-8feb-7d5b9699bc9f'

export class AccountsService {
    private papiClient: PapiClient;
    private usersService: UsersService;
    constructor(papiClient: PapiClient) {        
        this.papiClient = papiClient;
        this.usersService = new UsersService(this.papiClient);
    }

    
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
        return notConnectedAccounts;
    }

    async getConnectedAccounts(): Promise<any[]> {
        // Get data
        const accounts = await this.papiClient.accounts.iter().toArray();
        const currentUserUUID = this.usersService.getCurrentUserUUID();
        const accountsUsers = await this.papiClient.get(`/addons/data/${CORE_RESOURCES_ADDON_UUID}/account_users?where=Hidden=0`);

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
}