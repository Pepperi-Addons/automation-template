import { Account, PapiClient } from "@pepperi-addons/papi-sdk";
import { UsersService } from "./users.service";
import { AccountsService } from "./accounts.service";

const automationAddonUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4";
const CORE_RESOURCES_UUID = 'fc5a5974-3b30-4430-8feb-7d5b9699bc9f';

export interface AccountUser {
    InternalID: number;
    CreationDateTime: string;
    Hidden: boolean;
    ModificationDateTime: string;
    Account: string;
    User: string;
    Key: string;
}

export class AccountUsersService {

    private usersService: UsersService;
    private accountsService: AccountsService;

    constructor(private papiClient: PapiClient) {
        this.usersService = new UsersService(papiClient);
        this.accountsService = new AccountsService(papiClient);
    }

    public async getAccountUsers(): Promise<any[]> {
        const accountUsersUrl = `/addons/data/${CORE_RESOURCES_UUID}/account_users?where=Hidden=0`;
        try {
            const accountsUsers = await this.papiClient.get(accountUsersUrl);
            return accountsUsers;
        }
        catch (error) {
            throw new Error(`Failed fetching accounts users, error: ${(error as Error).message}`);
        }
    }

    public async getAccountPointingToCurrentUser(): Promise<Account> {
        // Get data
        const accounts = await this.accountsService.getAccounts();
        const currentUserUUID: string = this.usersService.getCurrentUserUUID();
        const accountsUsers = await this.getAccountUsers();

        const pointingAccountUsers = accountsUsers.filter(accountUser => accountUser.User === currentUserUUID);

        if (pointingAccountUsers.length === 0) {
            throw new Error('Could not find an account that points to current user, create one and try again.');
        }

        // Search for an account that points to current user
        const accountThatPoints = accounts.find(account => account.UUID === pointingAccountUsers[0].Account);
        return accountThatPoints!;
    }

    public async getAccountNotPointingToCurrentUser(): Promise<Account> {
        // Get data
        const accounts = await this.accountsService.getAccounts();
        const currentUserUUID: string = this.usersService.getCurrentUserUUID();
        const accountsUsers = await this.getAccountUsers();

        const otherAccounts = accountsUsers.filter(accountUser => accountUser.User !== currentUserUUID);
        if (otherAccounts.length === 0) {
            throw new Error('Could not find an account that does not point to current user, create one and try again.');
        }

        // Search for an account that does not point to current user
        const accountThatDoesNotPoint = accounts.find(account => account.UUID === otherAccounts[0].Account);
        return accountThatDoesNotPoint!;
    }
    
    public async hideAccountUser(accountUUID: string, userUUID: string): Promise<AccountUser> {
        const accountUsersUrl = `/addons/data/${CORE_RESOURCES_UUID}/account_users`;
        const body = {
            Account: accountUUID,
            User: userUUID,
            Hidden: true
        };

        try {
            return await this.papiClient.post(accountUsersUrl, body);
        }
        catch (error) {
            throw new Error(`Failed upserting accounts users, error: ${(error as Error).message}`);
        }
    }

    public async unhideAccountUser(accountUUID: string, userUUID: string): Promise<AccountUser> {
        const accountUsersUrl = `/addons/data/${CORE_RESOURCES_UUID}/account_users`;
        const body = {
            Account: accountUUID,
            User: userUUID,
            Hidden: false
        };

        try {
            return await this.papiClient.post(accountUsersUrl, body);
        }
        catch (error) {
            throw new Error(`Failed upserting accounts users, error: ${(error as Error).message}`);
        }
    }
}
