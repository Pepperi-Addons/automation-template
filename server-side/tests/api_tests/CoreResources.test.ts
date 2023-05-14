//fc5a5974-3b30-4430-8feb-7d5b9699bc9f
import { CoreResourcesService } from "./services/CoreResources.service";
import GeneralService, { TesterFunctions } from "test_infra";


export async function CoreResources(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions) {
    const dataObj = request.body.Data; // the 'Data' object passsed inside the http request sent to start the test -- put all the data you need here
    //setting 'mocha verbs' to use
    const describe = tester.describe;
    const expect = tester.expect;
    const it = tester.it;

    describe('Build users Table Test', () => { //the string inside the describe will effect the title of this suite in the report
            const coreResourcesService = new CoreResourcesService(generalService, addonService.papiClient, dataObj);
    
            it('Build users adal table', async () => {
                const papiUsersList = await coreResourcesService.getPapiResourceObjects('users');
				const papiContactsList = await coreResourcesService.getPapiResourceObjects('contacts');
				await coreResourcesService.cleanTable('users'); // clean the table before build
                const buildTableResponse = await coreResourcesService.buildTable('users');
				await coreResourcesService.waitForAsyncJob(20);
				const adalUsersList = await coreResourcesService.getAdalResourceObjects('users');
				expect(buildTableResponse).to.have.property('res');
                expect(buildTableResponse.res).to.have.property('success').that.is.true;
				expect(adalUsersList).to.be.an('array').with.lengthOf(papiUsersList.length + papiContactsList.length);
            });

            // it('Basic Test Example #2: Using Objects Service To Validate Users API Options Functionality', async () => {
            //     /**
            //     * your code should replace this
            //     */
            //     generalService.sleep(5000);// sleep and other util functions can be found inside 'generalServie'
            //     const usersList = await coreResourcesService.getUsers();
            //     expect(usersList).to.be.an('array').with.lengthOf.above(0);
            //     expect(usersList[0], 'InternalID')
            //         .to.have.property('InternalID')
            //         .that.is.a('number')
            //         .and.is.above(0);
            //     expect(usersList[0], 'UUID').to.have.property('UUID').that.is.a('string').and.is.not.empty;
            //     expect(usersList[0], 'ExternalID').to.have.property('ExternalID').that.is.a('string');
            //     expect(usersList[0], 'Email').to.have.property('Email').that.is.a('string').and.is.not.empty;
            //     expect(usersList[0], 'FirstName').to.have.property('FirstName').that.is.a('string');
            //     expect(usersList[0], 'LastName').to.have.property('LastName').that.is.a('string');
            //     expect(usersList[0], 'Hidden').to.have.property('Hidden').that.is.a('boolean').and.is.false;
            //     expect(usersList[0], 'IsInTradeShowMode').to.have.property('IsInTradeShowMode').that.is.a('boolean');
            //     expect(usersList[0], 'Mobile').to.have.property('Mobile').that.is.a('string');
            //     expect(usersList[0], 'CreationDateTime').to.have.property('CreationDateTime').that.contains('Z');
            //     expect(usersList[0], 'ModificationDateTime')
            //         .to.have.property('ModificationDateTime')
            //         .that.contains('Z');
            //     expect(usersList[0], 'Phone').to.have.property('Phone').that.is.a('string');
            //     expect(usersList[0], 'Profile').to.have.property('Profile').that.is.an('object');
            //     expect(usersList[0], 'Role').to.have.property('Role');
            //    // debugger; // you can use either breakpoints or this kind of debugging
            //    let isUserFound = false;
            //    for (let index = 0; index < usersList.length; index++) {
            //         if (usersList[index].Email === createdUser.Email) {
            //         isUserFound = true;
            //         }
            //     }
            //    expect(isUserFound).to.be.true;
            //    currentUserQuantity = usersList.length
            // });
            
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
