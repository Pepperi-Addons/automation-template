//fc5a5974-3b30-4430-8feb-7d5b9699bc9f
import {
    FindOptions,
    User,
    PapiClient,
} from '@pepperi-addons/papi-sdk';
import GeneralService from 'test_infra';
import { v4 as uuid } from 'uuid';

export class CoreResourcesService {
    papiClient: PapiClient;
    routerClient: PapiClient;
    generalService: GeneralService;
    dataObject: any; // the 'Data' object passsed inside the http request sent to start the test -- put all the data you need here
	addonUUID: string = 'fc5a5974-3b30-4430-8feb-7d5b9699bc9f';

   constructor(public systemService: GeneralService, public addonService: PapiClient, dataObject:any) {
        this.papiClient = systemService.papiClient; // client which will ALWAYS go OUT
        this.generalService = systemService;
        this.routerClient = addonService; // will run according to passed 'isLocal' flag
        this.dataObject = dataObject;
    }

    async getAdalResourceObjects(resource: string, options?: FindOptions): Promise<any[]> {
        return this.papiClient.addons.data.uuid(this.addonUUID).table(resource).find(options);
    }

	async getPapiResourceObjects(resource: string): Promise<any[]> {
		return await this.papiClient.get(`/${resource}`);
	}

	async buildTable(resource: string) {
		return this.papiClient.post(`/addons/api/${this.addonUUID}/adal/build?resource=${resource}`);
	}

	async cleanTable(resource: string) {
		let objects = await this.getAdalResourceObjects(resource);
		objects.forEach(obj => obj.Hidden = true);
		await this.papiClient.post(`/addons/data/batch/${this.addonUUID}/${resource}`, {Objects: objects});
	}

	async createContact(contact) {
        contact.UUID = uuid();
        return await this.papiClient.post(`/contacts`, contact);
    }

	// should be used by PNS tests
    async createContactsForTest(body) {
        let contactsUUIDs: string[] = [];
        const unique = uuid();
        for(let i = 0; i < body.Count; i++) {
            const body = {
                FirstName: `test${i}-${unique}`,
                Email: `test${i}-${unique}@test.com`,
                IsBuyer: false,
                Account: {
                    "Data": {
                        "InternalID": 14346030,
                        "UUID": "b888b24c-3022-4ca9-8322-63ada2780f9e",
                        "ExternalID": "12345"
                    },
                    "URI": "/accounts/14346030"
                }
            }
            const created = await this.createContact(body);
        }
        return {UUIDs: contactsUUIDs};
    }

    async waitForAsyncJob(seconds: number = 30) {
        console.log(`Waiting for ${seconds} seconds for opeation to catch up...`);
        await this.generalService.sleep(seconds * 1000);
        console.log(`Done waiting for operation`);
    }

}
