import { User } from "@pepperi-addons/papi-sdk";
import GeneralService, { TesterFunctions } from "../../../potentialQA_SDK/server_side/general.service";
import { ObjectsService } from "./services/example.objects.service";

export async function TemplateTests(generalService: GeneralService, request, tester: TesterFunctions) {
    //setting 'mocha verbs' to use
    const describe = tester.describe;
    const expect = tester.expect;
    const it = tester.it;

    describe('TemplateTests Suites', () => {//the string inside the desribes will effect the report - name should be changed
        describe('TemplateTests Example Suit', () => {
            const service = new ObjectsService(generalService);
            //templateToTeplaceWithCtor
            it('Basic Test Example #1: Using Objects Service To Validate All Users Data Entrys Are Valid', async () => {
                // This Is An Example Of How To Write Tests - Using Example Service From Automation Infra - Objects
                /**
                 * your code should replace this
                 */
                const initialUsersList: User[] = await service.getUsers();
                expect(initialUsersList).to.be.an('array').with.lengthOf.above(0);
                for (let index = 0; index < initialUsersList.length; index++) {
                    expect(initialUsersList[index], 'InternalID Testing').to.have.property('InternalID').that.is.a('number').and.is.above(0);
                    expect(initialUsersList[index], 'UUID Testing').to.have.property('UUID').that.is.a('string').and.is.not.empty;
                    expect(initialUsersList[index], 'ExternalID Testing').to.have.property('ExternalID').that.is.a('string');
                    expect(initialUsersList[index], 'Email Testing').to.have.property('Email').that.is.a('string').and.is.not.empty;
                    expect(initialUsersList[index], 'FirstName Testing').to.have.property('FirstName').that.is.a('string');
                    expect(initialUsersList[index], 'LastName Testing').to.have.property('LastName').that.is.a('string');
                    expect(initialUsersList[index], 'Hidden Testing').to.have.property('Hidden').that.is.a('boolean').and.is.false;
                    expect(initialUsersList[index], 'IsInTradeShowMode Testing').to.have.property('IsInTradeShowMode').that.is.a('boolean');
                    expect(initialUsersList[index], 'Mobile Testing').to.have.property('Mobile').that.is.a('string');
                    expect(initialUsersList[index], 'CreationDateTime Testing').to.have.property('CreationDateTime').that.contains('Z');
                    expect(initialUsersList[index], 'ModificationDateTime Testing').to.have.property('ModificationDateTime').that.contains('Z');
                    expect(initialUsersList[index], 'Phone Testing').to.have.property('Phone').that.is.a('string');
                    expect(initialUsersList[index], 'Profile Testing').to.have.property('Profile').that.is.an('object');
                    expect(initialUsersList[index], 'Role Testing').to.have.property('Role');
                }
            });
            it('Basic Test Example #2: Using Objects Service To Validate Users API Options Functionality', async () => {
                /**
                * your code should replace this
                */
                const optionalUsersFieldList: User[] = await service.getUsers({
                    fields: [
                        'Name',
                        'EmployeeType',
                        'IsSupportAdminUser',
                        'IsUnderMyRole',
                        'SecurityGroupUUID',
                        'SecurityGroupName',
                    ],
                });
                expect(optionalUsersFieldList).to.be.an('array').with.lengthOf.above(0);
                for (let index = 0; index < optionalUsersFieldList.length; index++) {
                    expect(optionalUsersFieldList[index], 'Name Property Testing').to.have.property('Name').that.is.a('string').and.is.not.empty;
                    expect(optionalUsersFieldList[index], 'EmployeeType Array Property Testing').to.have.property('EmployeeType').that.is.a('number').and.is.above(0);
                    expect(optionalUsersFieldList[index], 'IsSupportAdminUser Property Tessting').to.have.property('IsSupportAdminUser').that.is.a('boolean');
                    expect(optionalUsersFieldList[index], 'IsUnderMyRole Property Tessting').to.have.property('IsUnderMyRole').that.is.a('boolean');
                    expect(optionalUsersFieldList[index], 'SecurityGroupUUID Property Tessting').to.have.property('SecurityGroupUUID').that.is.a('string').and.is.not.empty;
                    expect(optionalUsersFieldList[index], 'SecurityGroupName Property Tessting').to.have.property('SecurityGroupName').that.is.a('string').and.is.not.empty;
                }
            });
        });
    });
}
