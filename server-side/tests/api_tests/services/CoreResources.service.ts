//fc5a5974-3b30-4430-8feb-7d5b9699bc9f
import {
    FindOptions,
    User,
    PapiClient,
	SearchData,
	AddonData,
	SearchBody,
} from '@pepperi-addons/papi-sdk';
import GeneralService from 'test_infra';
import { v4 as uuid } from 'uuid';

export class CoreResourcesService {
    papiClient: PapiClient;
    routerClient: PapiClient;
    generalService: GeneralService;
    dataObject: any; // the 'Data' object passed inside the http request sent to start the test -- put all the data you need here
	addonUUID: string = 'fc5a5974-3b30-4430-8feb-7d5b9699bc9f';

   constructor(public systemService: GeneralService, public addonService: PapiClient, dataObject:any) {
        this.papiClient = systemService.papiClient; // client which will ALWAYS go OUT
        this.generalService = systemService;
        this.routerClient = addonService; // will run according to passed 'isLocal' flag
        this.dataObject = dataObject;
    }

    async getGenericResourceObjects(resource: string): Promise<any[]> {
        return await this.papiClient.get(`/resources/${resource}`);
    }

	async searchGenericResourceObjects(resource: string, searchBody: SearchBody): Promise<SearchData<AddonData>> {
        return await this.papiClient.resources.resource(resource).search(searchBody);
    }

	async getPapiResourceObjects(resource: string): Promise<any[]> {
		return await this.papiClient.get(`/${resource}`);
	}

	async createTestAccount() {
		const account = await this.papiClient.post('/accounts', {
			UUID: uuid(),
			Email: "test@core-resources.com",
    		Name: "core-resources test account"
		});
		return account;
	}

	// async papiBatchUpsert(resource: string, objects: any[]): Promise<any> {
	// 	return await this.papiClient.post(`/batch/${resource}`, objects);
	// }

	async createPapiUsers(count: number): Promise<any[]> {
		let users: any[] = [];
		for(let i = 0; i < count; i++) {
			const user = await this.papiClient.post('/createUser',{
				Email: `test${i}@test.com`,
				FirstName: `test${i}`,
				LastName: `test${i}`
			});
			users.push(user);
		}
		return users;
	}

	async createPapiAccountUsers(users: any[], account): Promise<any[]> {
		let accountUsers: any[] = [];
		for(let i = 0; i < users.length; i++) {
			const user = await this.papiClient.post('/account_users',{
				Account: {
					"Data": {
						"InternalID": account.InternalID,
						"UUID": account.UUID,
						"ExternalID": null
					},
					"URI": `/accounts/${account.InternalID}}`
				},
				User: {
					"Data": {
						"InternalID": users[i].InternalID,
						"UUID": users[i].UUID,
						"ExternalID": null
					},
					"URI": `/users/${users[i].InternalID}}`
				}
			});
			accountUsers.push(user);
		}
		return accountUsers;
	}


	async buildTable(resource: string): Promise<any> {
		return await this.papiClient.post(`/addons/api/${this.addonUUID}/adal/build?resource=${resource}`);
	}

	async cleanTable(resource: string): Promise<void> {

		let searchResponse: SearchData<AddonData>;
		let NextPageKey: string | undefined = undefined;

		do
		{
			const searchOptions: SearchBody = {
				...(NextPageKey && {PageKey: NextPageKey}),
				Fields: ["Key"]
			};

			searchResponse = await this.searchGenericResourceObjects(resource, searchOptions);
			
			// For each object, set the Hidden field to true
			searchResponse.Objects.forEach(obj => obj.Hidden = true);

			// Batch upsert to adal
			this.papiClient.post(`/addons/data/batch/${this.addonUUID}/${resource}`, {Objects: searchResponse.Objects})
			NextPageKey = searchResponse.NextPageKey;
		}
		while (NextPageKey);
	}

	async createContact(contact) {
        contact.UUID = uuid();
        return await this.papiClient.post(`/contacts`, contact);
    }

	// should be used by PNS tests
    async createContactsForTest(count: number, account: any): Promise<string[]> {
        let contactsUUIDs: string[] = [];
        const unique = uuid();
        for(let i = 0; i < count; i++) {
            const body = {
                FirstName: `test${i}-${unique}`,
                Email: `test${i}-${unique}@test.com`,
                IsBuyer: false,
                Account: {
                    "Data": {
                        "InternalID": account.InternalID,
                        "UUID": account.UUID,
                        "ExternalID": null
                    },
                    "URI": `/accounts/${account.InternalID}}`
                }
            }
            await this.createContact(body);
        }
        return contactsUUIDs;
    }

	async setContactsAsBuyersState(contactsUUIDs: string[], isBuyer: boolean): Promise<any> {
		const contacts = contactsUUIDs.map(uuid => { return {UUID: uuid, IsBuyer: isBuyer} });
		return await this.papiClient.post(`/batch/contacts`, contacts);
	}

	async hideCreatedPapiObjects(resource: string, objects: any[]): Promise<void> {
		objects.forEach(obj => obj.Hidden = true);
		await this.papiClient.post(`/batch/${resource}`, {Objects: objects});
	}

    async waitForAsyncJob(seconds: number = 30): Promise<void> {
        console.log(`Waiting for ${seconds} seconds for opeation to catch up...`);
        await this.generalService.sleep(seconds * 1000);
        console.log(`Done waiting for operation`);
    }

}
