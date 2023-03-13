import { PapiClient, User } from "@pepperi-addons/papi-sdk";
import jwt from 'jwt-decode'; 

export class UsersService {
    constructor(protected papiClient: PapiClient) {}

    async getUsers() {
        const users = await this.papiClient.users.iter({ fields: ['UUID'] }).toArray();
        return users;
    }
    
    getCurrentUserUUID(): string {
        const decodedToken: any = jwt(this.papiClient['options'].token);
        const currentUser = decodedToken["pepperi.useruuid"];
        return currentUser;
    }

    async getNotCurrentUserUUID(): Promise<string> {
        const notCurrentUsers = await this.getNotCurrentUsers();
        return notCurrentUsers[0].UUID;
    }
    
    async getNotCurrentUsers(): Promise<any[]> {
        const users = await this.getUsers();
        const currentUserUUID = this.getCurrentUserUUID();
        const notCurrentUsers = users.filter(user => user.UUID !== currentUserUUID);
        if(notCurrentUsers.length == 0 ){
            let user = {
                Email: "sync_automation_user@pepperitest.com"
            }
            let notCurrentUser = await this.papiClient.post('/createUser',user)
            return [notCurrentUser]
        }
        return notCurrentUsers;       
    }
}
