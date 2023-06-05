import { Account, FindOptions, PapiClient } from "@pepperi-addons/papi-sdk";

export class AccountsService {

    constructor(private papiClient: PapiClient) {
    }

    public async getAccounts(options?: FindOptions): Promise<Account[]> {
        return await this.papiClient.accounts.find(options);
    }
}
