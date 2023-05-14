//fc5a5974-3b30-4430-8feb-7d5b9699bc9f
import { CoreResourcesService } from "./services/CoreResources.service";
import GeneralService, { TesterFunctions } from "test_infra";


export async function CoreResources(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions) {
    const dataObj = request.body.Data; // the 'Data' object passsed inside the http request sent to start the test -- put all the data you need here
    //setting 'mocha verbs' to use
    const describe = tester.describe;
    const expect = tester.expect;
    const it = tester.it;

    describe('Build ADAL tables tests', () => { //the string inside the describe will effect the title of this suite in the report
            const coreResourcesService = new CoreResourcesService(generalService, addonService.papiClient, dataObj);
    
            it('Build users adal table', async () => {
                const papiUsersList = await coreResourcesService.getPapiResourceObjects('users');
				const papiContactsList = await coreResourcesService.getPapiResourceObjects('contacts');
				await coreResourcesService.cleanTable('users'); // clean the table before build
                const buildTableResponse = await coreResourcesService.buildTable('users');
				await coreResourcesService.waitForAsyncJob(30);
				const adalUsersList = await coreResourcesService.getAdalResourceObjects('users');
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
				const adalAccountUsersList = await coreResourcesService.getAdalResourceObjects('account_users');
				expect(buildTableResponse).to.have.property('res');
                expect(buildTableResponse.res).to.have.property('success').that.is.true;
				expect(adalAccountUsersList).to.be.an('array').with.lengthOf(papiAccountUsersList.length + papiAccountBuyersList.length);
				expect(adalAccountUsersList[0]).to.have.property('Key').that.is.a('string').and.is.not.empty;
				expect(adalAccountUsersList[0]).to.have.property('Account').that.is.a('string').and.is.not.empty;
				expect(adalAccountUsersList[0]).to.have.property('User').that.is.a('string').and.is.not.empty;

            });
            // !!!IMPORTANT COMMENT: all the resource you set or create - MUST be deleted (!); in this case: we created a user so we delete it and validate that it is
            // in fact was deleted, if you set a code job - you MUST set it off, if you create a scheme you MUST delete it, etc...
            // it('Basic Test Example #3: Cleanup Of All Inserted Data', async () => {
            //     expect(await coreResourcesService.deleteUser('InternalID', createdUser.InternalID)).to.be.true;
            //     expect(await coreResourcesService.deleteUser('InternalID', createdUser.InternalID)).to.be.false;
            //     expect(await coreResourcesService.getUsers())
            //         .to.be.an('array')
            //         .with.lengthOf(currentUserQuantity - 1);
            // });

    });
}
