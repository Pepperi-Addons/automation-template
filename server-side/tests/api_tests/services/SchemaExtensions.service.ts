// 00000000-0000-0000-0000-00000000ada1
import { FindOptions, User, PapiClient } from '@pepperi-addons/papi-sdk';
import GeneralService from '../../../../potentialQA_SDK/server_side/general.service';
import * as config from './addon_details.json';

export class SchemaExtensionsService {

    papiClient: PapiClient;
    routerClient: PapiClient;
    generalService: GeneralService;

   constructor(public systemService: GeneralService, public addonService: PapiClient) {
        this.papiClient = systemService.papiClient; // client which will ALWAYS go OUT
        this.generalService = systemService;
        this.routerClient = addonService; // will run according to passed 'isLocal' flag

        this.papiClient['options'].addonUUID = config.UUID;
        this.papiClient['options'].addonSecretKey = config.SecretKey;
    }

    //this function will ALWAYS call REAL AWS papi
    getUsers(options?: FindOptions): Promise<User[]> {
        return this.papiClient.users.find(options);
    }

    //this function will call the server by 'isLocal' flag passed to 'run' endpoint
    createUser(body: User): Promise<User> {
        return this.routerClient.post('/CreateUser', body);
    }

    async upsertSchema(name: string, type: string, fields: any) {
        return await this.papiClient.addons.data.schemes.post({
            Name: name,
            Type: type,
            Fields: fields
        } as any);
    }

    async createExtendingSchema(name: string, type: string, fields: any, baseSchemaName: string) {
        return await this.papiClient.addons.data.schemes.post({
            Name: name,
            Type: type,
            Fields: fields,
            Extends: {
                AddonUUID: config.UUID,
                Name: baseSchemaName
            }
        } as any);
    }

    async getSchema(name: string) {
        return await this.papiClient.addons.data.schemes.name(name).get();
    }

    async hideSchema(name: string) {
        return await this.papiClient.addons.data.schemes.post({
            Name: name,
            Hidden: true
        } as any);
    }

    async purgeSchema(name: string) {
        return await this.papiClient.post(`/addons/data/schemes/${name}/purge`, null);
    }
}
