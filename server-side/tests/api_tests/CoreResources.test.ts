//fc5a5974-3b30-4430-8feb-7d5b9699bc9f
import { CoreResourcesService } from "./services/CoreResources.service";
import GeneralService, { TesterFunctions } from "test_infra";


export async function CoreResources(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions) {
    const dataObj = request.body.Data; // the 'Data' object passsed inside the http request sent to start the test -- put all the data you need here
    //setting 'mocha verbs' to use
    const describe = tester.describe;
    const expect = tester.expect;
    const it = tester.it;
	const afterEach = tester.afterEach;

    describe('Build ADAL tables tests', () => {
            const coreResourcesService = new CoreResourcesService(generalService, addonService.papiClient, dataObj);
    
            it('Build users adal table', async () => {
                const papiUsersList = await coreResourcesService.getPapiResourceObjects('users');
				const papiContactsList = await coreResourcesService.getPapiResourceObjects('contacts');
				await coreResourcesService.cleanTable('users'); // clean the table before build
                const buildTableResponse = await coreResourcesService.buildTable('users');
				await coreResourcesService.waitForAsyncJob(30);
				const adalUsersList = await coreResourcesService.getGenericResourceObjects('users');
				expect(buildTableResponse).to.have.property('res');
                expect(buildTableResponse.res).to.have.property('success').that.is.true;
				expect(adalUsersList).to.be.an('array').with.lengthOf(papiUsersList.length + papiContactsList.length);
				expect(adalUsersList[0]).to.have.property('Key').that.is.a('string').and.is.not.empty;
				expect(adalUsersList[0]).to.have.property('Email').that.is.a('string').and.is.not.empty;
				expect(adalUsersList[0]).to.have.property('FirstName').that.is.a('string').and.is.not.empty;
				expect(adalUsersList[0]).to.have.property('LastName').that.is.a('string').and.is.not.empty;
				expect(adalUsersList[0]).to.have.property('Name').that.is.a('string').and.is.not.empty;
				expect(adalUsersList[0]).to.have.property('ExternalID').that.is.a('string').and.is.not.empty;
				expect(adalUsersList[0]).to.have.property('Mobile').that.is.a('string');
				expect(adalUsersList[0]).to.have.property('Phone').that.is.a('string');
				expect(adalUsersList[0]).to.have.property('Profile').that.is.a('string').and.is.not.empty;
				expect(adalUsersList[0]).to.have.property('UserType').that.is.a('string').and.is.not.empty;
            });
            
			it('Build account_users adal table', async () => {
                const papiAccountUsersList = await coreResourcesService.getPapiResourceObjects('account_users');
				const papiAccountBuyersList = await coreResourcesService.getPapiResourceObjects('account_buyers');
				await coreResourcesService.cleanTable('account_users'); // clean the table before build
                const buildTableResponse = await coreResourcesService.buildTable('account_users');
				await coreResourcesService.waitForAsyncJob(30);
				const adalAccountUsersList = await coreResourcesService.getGenericResourceObjects('account_users');
				expect(buildTableResponse).to.have.property('res');
                expect(buildTableResponse.res).to.have.property('success').that.is.true;
				expect(adalAccountUsersList).to.be.an('array').with.lengthOf(papiAccountUsersList.length + papiAccountBuyersList.length);
				expect(adalAccountUsersList[0]).to.have.property('Key').that.is.a('string').and.is.not.empty;
				expect(adalAccountUsersList[0]).to.have.property('Account').that.is.a('string').and.is.not.empty;
				expect(adalAccountUsersList[0]).to.have.property('User').that.is.a('string').and.is.not.empty;
            });

            it('Clean tables', async () => {
                await coreResourcesService.cleanTable('users');
				await coreResourcesService.cleanTable('account_users');
            });

			describe('Build role_roles ADAL table', () => {

				const coreResourcesService = new CoreResourcesService(generalService, addonService.papiClient, dataObj);

				afterEach(async () => {
					await coreResourcesService.cleanTable('role_roles');
				});
		
				it('Build table using only roots', async () => {
					
				});
		});
    });

	describe('users, contacts, account_users PNS tests', () => {
		const coreResourcesService = new CoreResourcesService(generalService, addonService.papiClient, dataObj);
		const testAccount = coreResourcesService.createTestAccount();
		it('Create papi contacts, PNS should upsert buyers only to adal users table', async () => {
			const initialAdalUsersList = await coreResourcesService.getGenericResourceObjects('users');
			const createdContacts = await coreResourcesService.createContactsForTest(100, testAccount);
			// wait for PNS to finish
			await coreResourcesService.waitForAsyncJob(20);
			let currentAdalUsersList = await coreResourcesService.getGenericResourceObjects('users');
			// contacts should not be upserted to adal users table
			expect(currentAdalUsersList.length).to.equal(initialAdalUsersList.length);
			await coreResourcesService.setContactsAsBuyersState(createdContacts.slice(0, 50), true);
			// wait for PNS to finish
			await coreResourcesService.waitForAsyncJob(20);
			currentAdalUsersList = await coreResourcesService.getGenericResourceObjects('users');
			expect(currentAdalUsersList.length).to.equal(initialAdalUsersList.length + 50);
			await coreResourcesService.setContactsAsBuyersState(createdContacts.slice(0, 20), false);
			// wait for PNS to finish
			await coreResourcesService.waitForAsyncJob(20);
			currentAdalUsersList = await coreResourcesService.getGenericResourceObjects('users');
			expect(currentAdalUsersList.length).to.equal(initialAdalUsersList.length + 30); // 50 - 20 = 30
			//expected properties
			expect(currentAdalUsersList[0]).to.have.property('Key').that.is.a('string').and.is.not.empty;
			expect(currentAdalUsersList[0]).to.have.property('Email').that.is.a('string').and.is.not.empty;
			expect(currentAdalUsersList[0]).to.have.property('FirstName').that.is.a('string').and.is.not.empty;
			expect(currentAdalUsersList[0]).to.have.property('LastName').that.is.a('string').and.is.not.empty;
			expect(currentAdalUsersList[0]).to.have.property('Name').that.is.a('string').and.is.not.empty;
			expect(currentAdalUsersList[0]).to.have.property('ExternalID').that.is.a('string').and.is.not.empty;
			expect(currentAdalUsersList[0]).to.have.property('Mobile').that.is.a('string');
			expect(currentAdalUsersList[0]).to.have.property('Phone').that.is.a('string');
			expect(currentAdalUsersList[0]).to.have.property('Profile').that.is.a('string').and.is.not.empty;
			expect(currentAdalUsersList[0]).to.have.property('UserType').that.is.equal('Buyer');

			await coreResourcesService.hideCreatedPapiObjects('contacts', createdContacts);
		});

		it('Create papi users, then account_users. PNS should upsert them to adal tables', async () => {
			const initialAdalUsersList = await coreResourcesService.getGenericResourceObjects('users');
			const createdUsers = await coreResourcesService.createPapiUsers(100);
			// wait for PNS to finish
			await coreResourcesService.waitForAsyncJob(20);
			const currentAdalUsersList = await coreResourcesService.getGenericResourceObjects('users');
			expect(currentAdalUsersList.length).to.equal(initialAdalUsersList.length + 100);
			//expected properties
			expect(currentAdalUsersList[0]).to.have.property('Key').that.is.a('string').and.is.not.empty;
			expect(currentAdalUsersList[0]).to.have.property('Email').that.is.a('string').and.is.not.empty;
			expect(currentAdalUsersList[0]).to.have.property('FirstName').that.is.a('string').and.is.not.empty;
			expect(currentAdalUsersList[0]).to.have.property('LastName').that.is.a('string').and.is.not.empty;
			expect(currentAdalUsersList[0]).to.have.property('UserType').that.is.equal('Employee');

			const initialAdalAccountUsersList = await coreResourcesService.getGenericResourceObjects('account_users');
			const createdAccountUsers = await coreResourcesService.createPapiAccountUsers(createdUsers, testAccount);
			// wait for PNS to finish
			await coreResourcesService.waitForAsyncJob(20);
			const currentAdalAccountUsersList = await coreResourcesService.getGenericResourceObjects('account_users');
			expect(currentAdalAccountUsersList.length).to.equal(initialAdalAccountUsersList.length + 100);
			//expected properties
			expect(currentAdalUsersList[0]).to.have.property('Key').that.is.a('string').and.is.not.empty;
			expect(currentAdalUsersList[0]).to.have.property('Account').that.is.a('string').and.is.not.empty;
			expect(currentAdalUsersList[0]).to.have.property('User').that.is.a('string').and.is.not.empty;

			await coreResourcesService.hideCreatedPapiObjects('users', createdUsers);
			await coreResourcesService.hideCreatedPapiObjects('account_users', createdAccountUsers);
		});
	});
}
