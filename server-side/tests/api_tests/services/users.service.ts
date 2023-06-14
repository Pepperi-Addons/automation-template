import { FindOptions, PapiClient, User } from "@pepperi-addons/papi-sdk";
import jwt from 'jwt-decode';

export class UsersService {

    constructor(private papiClient: PapiClient) {
    }

    public getCurrentUserUUID(): string {
        const decodedToken: any = jwt(this.papiClient['options'].token);
        const currentUser = decodedToken["pepperi.useruuid"];
        return currentUser;
    }

    public async getUsers(options?: FindOptions): Promise<User[]> {
        return await this.papiClient.users.find(options);
    }

    /**
     * @returns a user which is not the current user.
     */
    public async getNotCurrentUser(): Promise<User> {
        const users = await this.getUsers();

        const currentUserUUID: string = this.getCurrentUserUUID()
        const otherUser = users.find(user => { return user.UUID !== currentUserUUID });

        if (otherUser === undefined) {
            throw new Error('Could not find enough users for test, make sure you have at least two users and try again.');
        }

        return otherUser;
    }
}
