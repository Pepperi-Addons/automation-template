// import GeneralService, { TesterFunctions } from '../../potentialQA_SDK/server_side/general.service';
import { GeneralService, TesterFunctions } from 'test_infra';
import { ObjectsService } from './services/Objects.example.service';


export async function UsersTests(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions) {
    const dataObj = request.body.Data; // the 'Data' object passsed inside the http request sent to start the test -- put all the data you need here
    const service = new ObjectsService(addonService, dataObj);
    const describe = tester.describe;
    const expect = tester.expect;
    const it = tester.it;

    describe('Users Test: Example Test Suite', () => {
        let currentUserQuantity;
        let initialUsersList;
        let createdUser;
        let updatedUser;
        let userExternalID;
        let userEmail;
        // const schemaName = 'PNS Objects Test';
        // const _MAX_LOOPS = 12;

        it('Example Test: Get initial user quantity and verify user object', async () => {
            initialUsersList = await service.getUsers();
            expect(initialUsersList).to.be.an('array').with.lengthOf.above(0);
            expect(initialUsersList[0], 'InternalID')
                .to.have.property('InternalID')
                .that.is.a('number')
                .and.is.above(0);
            expect(initialUsersList[0], 'UUID').to.have.property('UUID').that.is.a('string').and.is.not.empty;
            expect(initialUsersList[0], 'ExternalID').to.have.property('ExternalID').that.is.a('string');
            expect(initialUsersList[0], 'Email').to.have.property('Email').that.is.a('string').and.is.not.empty;
            expect(initialUsersList[0], 'FirstName').to.have.property('FirstName').that.is.a('string');
            expect(initialUsersList[0], 'LastName').to.have.property('LastName').that.is.a('string');
            expect(initialUsersList[0], 'Hidden').to.have.property('Hidden').that.is.a('boolean').and.is.false;
            expect(initialUsersList[0], 'IsInTradeShowMode').to.have.property('IsInTradeShowMode').that.is.a('boolean');
            expect(initialUsersList[0], 'Mobile').to.have.property('Mobile').that.is.a('string');
            expect(initialUsersList[0], 'CreationDateTime').to.have.property('CreationDateTime').that.contains('Z');
            expect(initialUsersList[0], 'ModificationDateTime')
                .to.have.property('ModificationDateTime')
                .that.contains('Z');
            expect(initialUsersList[0], 'Phone').to.have.property('Phone').that.is.a('string');
            expect(initialUsersList[0], 'Profile').to.have.property('Profile').that.is.an('object');
            expect(initialUsersList[0], 'Role').to.have.property('Role');
            expect(initialUsersList[0].Name, 'Name').to.not.exist,
                expect(initialUsersList[0].EmployeeType, 'EmployeeType').to.not.exist,
                expect(initialUsersList[0].IsSupportAdminUser, 'IsSupportAdminUser').to.not.exist,
                expect(initialUsersList[0].IsUnderMyRole, 'IsUnderMyRole').to.not.exist,
                expect(initialUsersList[0].SecurityGroup, 'SecurityGroup').to.not.exist,
                (currentUserQuantity = initialUsersList.length);
        });

        it('Example Test: Verify GET optional fields', async () => {
            const optionalUsersFields = await service.getUsers({
                fields: [
                    'Name',
                    'EmployeeType',
                    'IsSupportAdminUser',
                    'IsUnderMyRole',
                    'SecurityGroupUUID',
                    'SecurityGroupName',
                ],
            });
            expect(optionalUsersFields).to.be.an('array').with.lengthOf.above(0);
            expect(optionalUsersFields[0], 'Name')
                .to.have.property('Name')
                .that.is.a('string')
                .and.equals(initialUsersList[0].FirstName + ' ' + initialUsersList[0].LastName);
            expect(optionalUsersFields[0], 'EmployeeType')
                .to.have.property('EmployeeType')
                .that.is.a('number')
                .and.is.above(0);
            expect(optionalUsersFields[0], 'IsSupportAdminUser')
                .to.have.property('IsSupportAdminUser')
                .that.is.a('boolean');
            expect(optionalUsersFields[0], 'IsUnderMyRole').to.have.property('IsUnderMyRole').that.is.a('boolean');
            expect(optionalUsersFields[0], 'SecurityGroupUUID')
                .to.have.property('SecurityGroupUUID')
                .that.is.a('string').and.is.not.empty;
            expect(optionalUsersFields[0], 'SecurityGroupName')
                .to.have.property('SecurityGroupName')
                .that.is.a('string').and.is.not.empty;
        });
        it('Example Test: Create User', async () => {
            userExternalID = 'Automated API User ' + Math.floor(Math.random() * 1000000).toString();
            userEmail =
                'Email' +
                Math.floor(Math.random() * 1000000).toString() +
                '@' +
                Math.floor(Math.random() * 1000000).toString() +
                '.com';
            createdUser = await service.createUser({
                ExternalID: userExternalID,
                Email: userEmail,
                FirstName: Math.random().toString(36).substring(7),
                LastName: Math.random().toString(36).substring(7),
                Mobile: Math.floor(Math.random() * 1000000).toString(),
                Phone: Math.floor(Math.random() * 1000000).toString(),
                IsInTradeShowMode: true,
            });

            const repProfile = await service.getRepProfile();
            const securityGroups = await service.getSecurityGroup(generalService.getClientData('IdpURL'));

            expect(createdUser, 'InternalID').to.have.property('InternalID').that.is.a('number').and.is.above(0);
            expect(createdUser, 'UUID').to.have.property('UUID').that.is.a('string').and.is.not.empty;
            expect(createdUser, 'ExternalID')
                .to.have.property('ExternalID')
                .that.is.a('string')
                .and.equals(userExternalID);
            expect(createdUser, 'Email').to.have.property('Email').that.is.a('string').and.equals(userEmail);
            expect(createdUser, 'FirstName').to.have.property('FirstName').that.is.a('string').and.is.not.empty;
            expect(createdUser, 'LastName').to.have.property('LastName').that.is.a('string').and.is.not.empty;
            expect(createdUser, 'Hidden').to.have.property('Hidden').that.is.a('boolean').and.is.false;
            expect(createdUser, 'IsInTradeShowMode').to.have.property('IsInTradeShowMode').that.is.a('boolean').and.is
                .true;
            expect(createdUser, 'Mobile').to.have.property('Mobile').that.is.a('string').and.is.not.empty;
            expect(createdUser, 'CreationDateTime')
                .to.have.property('CreationDateTime')
                .that.contains(new Date().toISOString().split('T')[0]);
            expect(createdUser, 'CreationDateTime').to.have.property('CreationDateTime').that.contains('Z');
            expect(createdUser, 'ModificationDateTime')
                .to.have.property('ModificationDateTime')
                .that.contains(new Date().toISOString().split('T')[0]);
            expect(createdUser, 'ModificationDateTime').to.have.property('ModificationDateTime').that.contains('Z');
            expect(createdUser, 'Phone').to.have.property('Phone').that.is.a('string').and.is.not.empty;
            expect(createdUser, 'Profile').to.have.property('Profile').that.is.an('object');
            expect(createdUser.Profile, 'Profile data').to.deep.equal({
                Data: {
                    InternalID: repProfile.InternalID,
                    Name: 'Rep',
                },
                URI: '/profiles/' + repProfile.InternalID,
            });
            expect(createdUser, 'Role').to.have.property('Role');
            expect(createdUser, 'SecurityGroup').to.have.property('SecurityGroup').that.is.an('object');
            let isSecGroupFound = false;
            securityGroups.forEach(securityGroup => {
                if (securityGroup.securityGroupID === createdUser.SecurityGroup.Data.UUID && securityGroup.name === createdUser.SecurityGroup.Data.Name) {
                    isSecGroupFound = true;
                }
            });
            expect(isSecGroupFound).to.be.true;

            const getCreatedUserOptional = await service.getUsers({
                where: `InternalID='${createdUser.InternalID}'`,
                fields: [
                    'Name',
                    'EmployeeType',
                    'IsSupportAdminUser',
                    'IsUnderMyRole',
                    'SecurityGroupUUID',
                    'SecurityGroupName',
                ],
            });

            expect(getCreatedUserOptional[0], 'Name')
                .to.have.property('Name')
                .that.is.a('string')
                .and.equals(createdUser.FirstName + ' ' + createdUser.LastName);
            expect(getCreatedUserOptional[0], 'EmployeeType')
                .to.have.property('EmployeeType')
                .that.is.a('number')
                .and.is.above(0);
            expect(getCreatedUserOptional[0], 'IsSupportAdminUser')
                .to.have.property('IsSupportAdminUser')
                .that.is.a('boolean');
            expect(getCreatedUserOptional[0], 'IsUnderMyRole').to.have.property('IsUnderMyRole').that.is.a('boolean');
            isSecGroupFound = false;
            securityGroups.forEach(securityGroup => {
                if (securityGroup.securityGroupID === (getCreatedUserOptional[0] as any).SecurityGroupUUID && securityGroup.name === (getCreatedUserOptional[0] as any).SecurityGroupName) {
                    isSecGroupFound = true;
                }
            });
            const getCreatedUser = await service.getUsers({ where: `InternalID='${createdUser.InternalID}'` });
            expect(getCreatedUser[0], 'InternalID')
                .to.have.property('InternalID')
                .that.is.a('number')
                .and.equals(createdUser.InternalID);
            expect(getCreatedUser[0], 'UUID').to.have.property('UUID').that.is.a('string').and.equals(createdUser.UUID);
            expect(getCreatedUser[0], 'ExternalID')
                .to.have.property('ExternalID')
                .that.is.a('string')
                .and.equals(userExternalID);
            expect(getCreatedUser[0], 'Email').to.have.property('Email').that.is.a('string').and.equals(userEmail);
            expect(getCreatedUser[0], 'FirstName')
                .to.have.property('FirstName')
                .that.is.a('string')
                .and.equals(createdUser.FirstName);
            expect(getCreatedUser[0], 'LastName')
                .to.have.property('LastName')
                .that.is.a('string')
                .and.equals(createdUser.LastName);
            expect(getCreatedUser[0], 'Hidden').to.have.property('Hidden').that.is.a('boolean').and.is.false;
            expect(getCreatedUser[0], 'IsInTradeShowMode').to.have.property('IsInTradeShowMode').that.is.a('boolean')
                .and.is.true;
            expect(getCreatedUser[0], 'Mobile')
                .to.have.property('Mobile')
                .that.is.a('string')
                .and.equals(createdUser.Mobile);
            expect(getCreatedUser[0], 'CreationDateTime')
                .to.have.property('CreationDateTime')
                .that.contains(new Date().toISOString().split('T')[0]);
            expect(getCreatedUser[0], 'CreationDateTime').to.have.property('CreationDateTime').that.contains('Z');
            expect(getCreatedUser[0], 'ModificationDateTime')
                .to.have.property('ModificationDateTime')
                .that.contains(new Date().toISOString().split('T')[0]);
            expect(getCreatedUser[0], 'ModificationDateTime')
                .to.have.property('ModificationDateTime')
                .that.contains('Z');
            expect(getCreatedUser[0], 'Phone')
                .to.have.property('Phone')
                .that.is.a('string')
                .and.equals(createdUser.Phone);
            expect(getCreatedUser[0], 'Profile').to.have.property('Profile').that.is.an('object');
            expect(getCreatedUser[0].Profile, 'Profile data').to.deep.equal({
                Data: {
                    InternalID: repProfile.InternalID,
                    Name: 'Rep',
                },
                URI: '/profiles/' + repProfile.InternalID,
            });
            expect(getCreatedUser[0], 'Role').to.have.property('Role');

            const newQuantity = (await service.getUsers()).length;
            expect(newQuantity == currentUserQuantity + 1);
        });
        it('Example Test: Update User', async () => {
            updatedUser = await service.updateUser({
                ExternalID: userExternalID,
                Email: userEmail,
                FirstName: Math.random().toString(36).substring(7),
                LastName: Math.random().toString(36).substring(7),
                Mobile: Math.floor(Math.random() * 1000000).toString(),
                Phone: Math.floor(Math.random() * 1000000).toString(),
            });

            const getUpdatedUser = await service.getUsers({ where: `InternalID='${updatedUser.InternalID}'` });
            expect(getUpdatedUser[0], 'InternalID')
                .to.have.property('InternalID')
                .that.is.a('number')
                .and.equals(updatedUser.InternalID);
            expect(getUpdatedUser[0], 'UUID').to.have.property('UUID').that.is.a('string').and.equals(updatedUser.UUID);
            expect(getUpdatedUser[0], 'ExternalID')
                .to.have.property('ExternalID')
                .that.is.a('string')
                .and.equals(userExternalID);
            expect(getUpdatedUser[0], 'Email').to.have.property('Email').that.is.a('string').and.equals(userEmail);
            expect(getUpdatedUser[0], 'FirstName')
                .to.have.property('FirstName')
                .that.is.a('string')
                .and.equals(updatedUser.FirstName);
            expect(getUpdatedUser[0], 'LastName')
                .to.have.property('LastName')
                .that.is.a('string')
                .and.equals(updatedUser.LastName);
            expect(getUpdatedUser[0], 'Hidden').to.have.property('Hidden').that.is.a('boolean').and.is.false;
            expect(getUpdatedUser[0], 'IsInTradeShowMode').to.have.property('IsInTradeShowMode').that.is.a('boolean')
                .and.is.true;
            expect(getUpdatedUser[0], 'Mobile')
                .to.have.property('Mobile')
                .that.is.a('string')
                .and.equals(updatedUser.Mobile);
            expect(getUpdatedUser[0], 'CreationDateTime')
                .to.have.property('CreationDateTime')
                .that.contains(new Date().toISOString().split('T')[0]);
            expect(getUpdatedUser[0], 'CreationDateTime').to.have.property('CreationDateTime').that.contains('Z');
            expect(getUpdatedUser[0], 'ModificationDateTime')
                .to.have.property('ModificationDateTime')
                .that.contains(new Date().toISOString().split('T')[0]);
            expect(getUpdatedUser[0], 'ModificationDateTime')
                .to.have.property('ModificationDateTime')
                .that.contains('Z');
            expect(getUpdatedUser[0], 'Phone')
                .to.have.property('Phone')
                .that.is.a('string')
                .and.equals(updatedUser.Phone);
            expect(getUpdatedUser[0], 'Profile').to.have.property('Profile').that.is.an('object');
        });

        it('Example Test: Deleting New Created User', async () => {
            expect(await service.deleteUser('InternalID', createdUser.InternalID)).to.be.true;
            expect(await service.deleteUser('InternalID', createdUser.InternalID)).to.be.false;
            expect(await service.getUsers())
                .to.be.an('array')
                .with.lengthOf(currentUserQuantity);
        });
    });
}
