//00000000-0000-0000-0000-000000006a91
import { GetRecordsRequiringSyncResponse } from "./services/NebulaTest.service";
import { PerformanceManager } from "./services/performance_management/performance_manager";
import { ResourceManagerService } from "./services/resource_management/resource_manager.service";
import { Account, AddonData, AddonDataScheme, PapiClient, User } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "./services/resource_management/adal_table.service";
import { v4 as uuidv4 } from 'uuid';
import { AddonUUID as testingAddonUUID } from "../../../addon.config.json";
import { BasicRecord } from "./services/NebulaPNSEmulator.service";
import jwt from 'jwt-decode';
import { SystemFilter, GetRecordsRequiringSyncParameters } from "../entities/nebula/types";
import { NebulaServiceFactory } from "./services/NebulaServiceFactory";
import { AccountUser, AccountUsersService } from "./services/account-users.service";
import { UsersService } from "./services/users.service";
import { GeneralService, TesterFunctions } from "../../potentialQA_SDK/src/infra_services/general.service";

export async function NebulaTestPart2(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions) {

    // the 'Data' object passed inside the http request sent to start the test -- put all the data you need here
    const dataObj = request.body.Data;
    const isLocal = request.body.isLocal;
    //setting 'mocha verbs' to use
    const describe = tester.describe;
    const expect = tester.expect;
    const it = tester.it;

    const automationAddonUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4";
    const CORE_RESOURCES_UUID = 'fc5a5974-3b30-4430-8feb-7d5b9699bc9f';
    const CORE_UUID = '00000000-0000-0000-0000-00000000c07e';
    const usersService = new UsersService(generalService.papiClient);
    const accountUsersService = new AccountUsersService(generalService.papiClient);

    function getShortUUID(): string {
        return uuidv4().split('-')[0];
    }
    
    function getCurrentUserUUID(papiClient: PapiClient): string {
        const decodedToken: any = jwt(papiClient['options'].token);
        const currentUser = decodedToken["pepperi.useruuid"];
        return currentUser;
    }

    async function cleanUp(resourceManager: ResourceManagerService, performanceManager: PerformanceManager) {
        //TODO: add PNS cleanup here
        await resourceManager.cleanup();
        console.log(JSON.stringify(performanceManager.getStatistics()));
    }

    function buildGetRecordsRequiringSyncParameters(tableName: string, modificationDateTime?: string, includeDeleted: boolean = false, filter: SystemFilter | undefined = undefined): GetRecordsRequiringSyncParameters {
        return {
            AddonUUID: automationAddonUUID,
            Resource: tableName,
            ModificationDateTime: modificationDateTime,
            IncludeDeleted: includeDeleted,
            SystemFilter: filter
        };
    }

    describe('GetDocumentKeysRequiringSync - users reference fields without system filter (type=None)', async () => {
        // services
        const nebulatestService = NebulaServiceFactory.getNebulaService(generalService, addonService.papiClient, dataObj, isLocal);
        const performanceManager: PerformanceManager = new PerformanceManager();
        const resourceManager: ResourceManagerService = new ResourceManagerService(generalService.papiClient, automationAddonUUID);

        const USERS_TABLE = 'users';

        /**
         * @returns current user and one additional user.
         */
        async function getUsersToPointTo(): Promise<Users> {
            const users = await getUsers();

            const currentUserUUID: string = getCurrentUserUUID(addonService.papiClient)
            const currentUser = users.find(user => { return user.UUID === currentUserUUID });
            const otherUser = users.find(user => { return user.UUID !== currentUserUUID });

            if (currentUser === undefined || otherUser === undefined) {
                throw new Error('Could not find required users for test, make sure you have at least two users and try again.');
            }

            return {
                CurrentUser: currentUser,
                OtherUser: otherUser
            };
        }

        async function getUsers() {
            const users = await generalService.papiClient.users.find();

            if (users.length < 2) {
                throw new Error('Distributor does not have enough users to preform test, create a user and try again.');
            }

            return users;
        }

        function getSchema(): AddonDataScheme {
            return {
                Name: "nebulaTestPointToUserTable" + getShortUUID(),
                Type: "data",
                Fields:
                {
                    field1: {
                        Type: "Resource",
                        ApplySystemFilter: true,
                        AddonUUID: CORE_RESOURCES_UUID,
                        Resource: USERS_TABLE
                    },
                },
                SyncData: {
                    Sync: true
                }
            };
        }

        /**
         * Check if schema was created, if not throws.
         */
        function assertInitialPreparations(): void {
            if (pointingSchemaService === undefined) {
                throw new Error(`Schema was not created, cannot run test`);
            }

            if (users === undefined) {
                throw new Error(`Failed fetching users, cannot run test`);
            }
        }

        // Preparations parameters
        const timeStampBeforeCreation = new Date().toISOString();
        type Users = { CurrentUser: User, OtherUser: User };
        let users: Users | undefined = undefined;
        const documentsThatShouldRequireSync = ['4', '5', '6'];
        const documentsThatShouldNotRequireSync = ['1', '2', '3'];
        let pointingSchemaService: ADALTableService | undefined = undefined;

        it('Preparations - create table, upsert documents and wait for PNS', async () => {

            // get users
            users = await getUsersToPointTo();

            // Create a table with a reference field that point to users table.
            const pointingSchema: AddonDataScheme = getSchema();
            pointingSchemaService = await resourceManager.createAdalTable(pointingSchema);
            await nebulatestService.pnsInsertSchema(testingAddonUUID, pointingSchema.Name);

            await nebulatestService.waitForPNS();

            await nebulatestService.initPNS();

            // Upsert documents, half points to current user, and the others to a different one.
            const pointingSchemaDocuments: AddonData[] = [{
                Key: documentsThatShouldNotRequireSync[0],
                field1: users!.OtherUser.UUID
            }, {
                Key: documentsThatShouldNotRequireSync[1],
                field1: users!.OtherUser.UUID
            }, {
                Key: documentsThatShouldNotRequireSync[2],
                field1: users!.OtherUser.UUID
            }, {
                Key: documentsThatShouldRequireSync[0],
                field1: users!.CurrentUser.UUID
            }, {
                Key: documentsThatShouldRequireSync[1],
                field1: users!.CurrentUser.UUID
            }, {
                Key: documentsThatShouldRequireSync[2],
                field1: users!.CurrentUser.UUID
            }];
            await pointingSchemaService!.upsertBatch(pointingSchemaDocuments);

            await nebulatestService.pnsInsertRecords(testingAddonUUID, pointingSchema.Name, (pointingSchemaDocuments as BasicRecord[]));
            // wait for PNS callback to create nodes and edges in graph.
            await nebulatestService.waitForPNS();
        });

        it('Call getRecordsRequiringSync, expect only documents pointing to user in result', async () => {
            assertInitialPreparations();
            const pointingSchemaName: string = pointingSchemaService!.schemaName!;

            // Check only documents that points to current user are retrieved.
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName!, timeStampBeforeCreation);
            let recordsRequiringSync = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            expect(recordsRequiringSync).to.not.be.undefined;
            expect(recordsRequiringSync.Keys.length).to.be.equal(3);

            recordsRequiringSync.Keys.forEach(recordKeyRequiringSync => {
                expect(documentsThatShouldRequireSync.includes(recordKeyRequiringSync)).to.be.true;
            });
        });

        // Switch pointers between two documents in order to test PNS callback
        const documentThatShouldRequireSync = documentsThatShouldNotRequireSync[0];
        const documentThatShouldNotRequireSync = documentsThatShouldRequireSync[0];

        it('Preparations - edit documents and wait for PNS', async () => {
            assertInitialPreparations();

            // Upsert two documents.
            const pointingSchemaDocumentsUpdate: AddonData[] = [{
                Key: documentThatShouldRequireSync,
                field1: users!.CurrentUser.UUID
            }, {
                Key: documentThatShouldNotRequireSync,
                field1: users!.OtherUser.UUID
            }];
            await pointingSchemaService!.upsertBatch(pointingSchemaDocumentsUpdate);

            await nebulatestService.pnsInsertRecords(testingAddonUUID, pointingSchemaService!.schemaName!, (pointingSchemaDocumentsUpdate as BasicRecord[]));
            // wait for PNS callback to create nodes and edges in graph.
            await nebulatestService.waitForPNS();
        });

        it('Call getRecordsRequiringSync, expect only documents pointing to user in result', async () => {
            assertInitialPreparations();

            // Check only documents that points to current user are retrieved.
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName!, timeStampBeforeCreation);
            const recordsKeysRequiringSync = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            expect(recordsKeysRequiringSync).to.not.be.undefined;
            expect(recordsKeysRequiringSync.Keys.length).to.be.equal(3);

            // Check updated document's edges.
            expect(recordsKeysRequiringSync.Keys.find(recordKey => recordKey === documentThatShouldRequireSync)).to.not.be.undefined;
            expect(recordsKeysRequiringSync.Keys.find(recordKey => recordKey === documentThatShouldNotRequireSync)).to.be.undefined;
        });

        it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
            await cleanUp(resourceManager, performanceManager);
        });
    });

    describe('GetDocumentKeysRequiringSync - account reference fields without system filter (type=None)', async () => {
        // services
        const nebulatestService = NebulaServiceFactory.getNebulaService(generalService, addonService.papiClient, dataObj, isLocal);
        const performanceManager: PerformanceManager = new PerformanceManager();
        const resourceManager: ResourceManagerService = new ResourceManagerService(generalService.papiClient, automationAddonUUID);

        const ACCOUNTS_TABLE = 'accounts';

        async function getAccountsToPointTo(): Promise<Accounts> {
            // Get data
            const accounts = await getAccounts();
            const currentUserUUID: string = getCurrentUserUUID(addonService.papiClient);
            const accountsUsers = await getAccountUsers();

            // find an account that points to current user, and one that does not.
            let accountsThatPoint: string[] = [];
            accountsUsers.forEach(accountUser => {
                if (accountUser.User === currentUserUUID) {
                    accountsThatPoint.push(accountUser.Account);
                }
            });

            if (accountsThatPoint.length === accounts.length) {
                throw new Error('Could not find required accounts for test, make sure you have an account that points to your user and one that does not and try again.');
            }

            const accountThatPoint = accounts.find(account => { return account.UUID === accountsThatPoint[0] });
            const accountThatDoesNotPoint = accounts.find(account => { return (accountsThatPoint.includes(account.UUID!) === false) });

            if (accountThatPoint === undefined || accountThatDoesNotPoint === undefined) {
                throw new Error('Could not find required accounts for test, make sure you have an account that points to your user and one that does not and try again.');
            }

            return {
                pointingAccount: accountThatPoint,
                otherAccount: accountThatDoesNotPoint
            };
        }

        async function getAccounts(): Promise<Account[]> {
            const accounts = await generalService.papiClient.accounts.find();

            if (accounts.length < 2) {
                throw new Error('Distributor does not have enough accounts to preform test, create an account and try again.');
            }

            return accounts;
        }

        async function getAccountUsers(): Promise<any[]> {
            const accountUsersUrl = `/addons/data/${CORE_RESOURCES_UUID}/account_users?where=Hidden=0`;
            try {
                const accountsUsers = await generalService.papiClient.get(accountUsersUrl);
                return accountsUsers;
            }
            catch (err) {
                throw new Error(`Failed fetching accounts users, error: ${err}`);
            }
        }

        function getSchema(): AddonDataScheme {
            return {
                Name: "nebulaTestPointToAccountTable" + getShortUUID(),
                Type: "data",
                Fields:
                {
                    field1: {
                        Type: "Resource",
                        ApplySystemFilter: true,
                        AddonUUID: CORE_RESOURCES_UUID,
                        Resource: ACCOUNTS_TABLE
                    },
                },
                SyncData: {
                    Sync: true
                }
            };
        }

        /**
         * Check if schema was created, if not throws.
         */
        function assertInitialPreparations(): void {
            if (pointingSchemaService === undefined) {
                throw new Error(`Schema was not created, cannot run test`);
            }

            if (accounts === undefined) {
                throw new Error(`Failed fetching accounts, cannot run test`);
            }
        }

        // Preparations parameters
        const timeStampBeforeCreation = new Date().toISOString();
        type Accounts = { pointingAccount: Account; otherAccount: Account; };
        let accounts: Accounts | undefined = undefined;
        const documentsThatShouldRequireSync = ['1', '2', '3'];
        const documentsThatShouldNotRequireSync = ['4', '5', '6'];
        let pointingSchemaService: ADALTableService | undefined = undefined;

        it('Preparations - create table, upsert documents and wait for PNS', async () => {

            // Create a table that points to the accounts table.
            const pointingSchema: AddonDataScheme = getSchema();
            accounts = await getAccountsToPointTo();
            pointingSchemaService = await resourceManager.createAdalTable(pointingSchema);

            await nebulatestService.pnsInsertSchema(testingAddonUUID, pointingSchemaService!.schemaName!);
            await nebulatestService.waitForPNS();

            await nebulatestService.initPNS();

            // Upsert documents, half points to current account, and the others to a different one.
            const pointingSchemaDocuments: AddonData[] = [{
                Key: documentsThatShouldNotRequireSync[0],
                field1: accounts.otherAccount.UUID
            }, {
                Key: documentsThatShouldNotRequireSync[1],
                field1: accounts.otherAccount.UUID
            }, {
                Key: documentsThatShouldNotRequireSync[2],
                field1: accounts.otherAccount.UUID
            }, {
                Key: documentsThatShouldRequireSync[0],
                field1: accounts.pointingAccount.UUID
            }, {
                Key: documentsThatShouldRequireSync[1],
                field1: accounts.pointingAccount.UUID
            }, {
                Key: documentsThatShouldRequireSync[2],
                field1: accounts.pointingAccount.UUID
            }];
            await pointingSchemaService!.upsertBatch(pointingSchemaDocuments);

            await nebulatestService.pnsInsertRecords(testingAddonUUID, pointingSchemaService!.schemaName!, (pointingSchemaDocuments as BasicRecord[]));

            // wait for PNS callback to create nodes and edges in graph.
            await nebulatestService.waitForPNS();
        });

        it('Call getRecordsRequiringSync, expect only documents pointing to "current account" (account that point to current user) in result', async () => {
            assertInitialPreparations();

            // Check only documents that points to "current account" (account that point to current user) are retrieved.
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName, timeStampBeforeCreation);
            const recordsKeysRequiringSync = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            expect(recordsKeysRequiringSync).to.not.be.undefined;
            expect(recordsKeysRequiringSync.Keys.length).to.be.equal(3);

            recordsKeysRequiringSync.Keys.forEach(recordKeyRequiringSync => {
                expect(documentsThatShouldRequireSync.includes(recordKeyRequiringSync)).to.be.true;
            });
        });

        // Switch pointers between two documents in order to test PNS callback
        const documentThatShouldRequireSync = documentsThatShouldNotRequireSync[0];
        const documentThatShouldNotRequireSync = documentsThatShouldRequireSync[0];

        it('Preparations - edit documents and wait for PNS', async () => {
            assertInitialPreparations();

            // upsert two documents with switched pointers
            const pointingSchemaDocumentsUpdates: AddonData[] = [{
                Key: documentThatShouldRequireSync,
                field1: accounts!.pointingAccount.UUID
            }, {
                Key: documentThatShouldNotRequireSync,
                field1: accounts!.otherAccount.UUID
            }];
            await pointingSchemaService!.upsertBatch(pointingSchemaDocumentsUpdates);

            await nebulatestService.pnsInsertRecords(testingAddonUUID, pointingSchemaService!.schemaName!, (pointingSchemaDocumentsUpdates as BasicRecord[]));
            // wait for PNS callback to create nodes and edges in graph.
            await nebulatestService.waitForPNS();
        });

        it('Call getRecordsRequiringSync, expect only documents pointing to "current account" in result', async () => {
            assertInitialPreparations();
            const schemaName = pointingSchemaService!.schemaName;

            // Check only documents that points to "current account" are retrieved.
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName, timeStampBeforeCreation);
            const recordsKeysRequiringSync = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            expect(recordsKeysRequiringSync).to.not.be.undefined;
            expect(recordsKeysRequiringSync.Keys.length).to.be.equal(3);

            // Check updated document's edges.
            expect(recordsKeysRequiringSync.Keys.find(recordKey => recordKey === documentThatShouldRequireSync)).to.not.be.undefined;
            expect(recordsKeysRequiringSync.Keys.find(recordKey => recordKey === documentThatShouldNotRequireSync)).to.be.undefined;
        });

        it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
            await cleanUp(resourceManager, performanceManager);
        });
    });

    describe('GetDocumentKeysRequiringSync - account reference fields with system filter (type=Account)', async () => {
        // services
        const nebulatestService = NebulaServiceFactory.getNebulaService(generalService, addonService.papiClient, dataObj, isLocal);
        const performanceManager: PerformanceManager = new PerformanceManager();
        const resourceManager: ResourceManagerService = new ResourceManagerService(generalService.papiClient, automationAddonUUID);

        const ACCOUNTS_TABLE = 'accounts';

        async function getAccountsToPointTo(): Promise<Accounts> {
            // Get data
            const accounts = await getAccounts();
            const currentUserUUID: string = getCurrentUserUUID(addonService.papiClient);
            const accountsUsers = await getAccountUsers();

            // find an account that points to current user, and one that does not.
            let accountsThatPoint: string[] = [];
            accountsUsers.forEach(accountUser => {
                if (accountUser.User === currentUserUUID) {
                    accountsThatPoint.push(accountUser.Account);
                }
            });

            if (accountsThatPoint.length === accounts.length) {
                throw new Error('Could not find required accounts for test, make sure you have an account that points to your user and one that does not and try again.');
            }

            const accountThatPoint = accounts.find(account => { return account.UUID === accountsThatPoint[0] });
            const accountThatDoesNotPoint = accounts.find(account => { return (accountsThatPoint.includes(account.UUID!) === false) });

            if (accountThatPoint === undefined || accountThatDoesNotPoint === undefined) {
                throw new Error('Could not find required accounts for test, make sure you have an account that points to your user and one that does not and try again.');
            }

            return {
                pointingAccount: accountThatPoint,
                otherAccount: accountThatDoesNotPoint
            };
        }

        async function getAccounts(): Promise<Account[]> {
            const accounts = await generalService.papiClient.accounts.find();

            if (accounts.length < 2) {
                throw new Error('Distributor does not have enough accounts to preform test, create an account and try again.');
            }

            return accounts;
        }

        async function getAccountUsers(): Promise<any[]> {
            const accountUsersUrl = `/addons/data/${CORE_RESOURCES_UUID}/account_users?where=Hidden=0`;
            const accountsUsers = await generalService.papiClient.get(accountUsersUrl);
            return accountsUsers;
        }

        function getSchema(): AddonDataScheme {
            return {
                Name: "nebulaTestPointToAccountTable" + getShortUUID(),
                Type: "data",
                Fields:
                {
                    field1: {
                        Type: "Resource",
                        ApplySystemFilter: true,
                        AddonUUID: CORE_RESOURCES_UUID,
                        Resource: ACCOUNTS_TABLE
                    },
                },
                SyncData: {
                    Sync: true
                }
            };
        }

        /**
         * Check if schema was created, if not throws.
         */
        function assertInitialPreparations(): void {
            if (pointingSchemaService === undefined) {
                throw new Error(`Schema was not created, cannot run test`);
            }

            if (accounts === undefined) {
                throw new Error(`Failed fetching accounts, cannot run test`);
            }
        }

        // Preparations parameters
        const timeStampBeforeCreation = new Date().toISOString();
        type Accounts = { pointingAccount: Account; otherAccount: Account; };
        let accounts: Accounts | undefined = undefined;
        const documentsThatPointA = ['1', '2', '3'];
        const documentsThatPointB = ['4', '5', '6'];
        let pointingSchemaService: ADALTableService | undefined = undefined;

        function buildSystemFilter(accountUUID: string): SystemFilter {
            return {
                Type: "Account",
                AccountUUID: accountUUID
            };
        }

        it('Preparations - create table, upsert documents and wait for PNS', async () => {

            // Create a table that points to the accounts table.
            const pointingSchema: AddonDataScheme = getSchema();
            accounts = await getAccountsToPointTo();
            pointingSchemaService = await resourceManager.createAdalTable(pointingSchema);

            await nebulatestService.pnsInsertSchema(testingAddonUUID, pointingSchemaService!.schemaName!);
            await nebulatestService.waitForPNS();

            await nebulatestService.initPNS();
            // Upsert documents, half points to current account, and the others to a different one.
            const pointingSchemaDocuments: AddonData[] = [{
                Key: documentsThatPointB[0],
                field1: accounts.otherAccount.UUID
            }, {
                Key: documentsThatPointB[1],
                field1: accounts.otherAccount.UUID
            }, {
                Key: documentsThatPointB[2],
                field1: accounts.otherAccount.UUID
            }, {
                Key: documentsThatPointA[0],
                field1: accounts.pointingAccount.UUID
            }, {
                Key: documentsThatPointA[1],
                field1: accounts.pointingAccount.UUID
            }, {
                Key: documentsThatPointA[2],
                field1: accounts.pointingAccount.UUID
            }];
            await pointingSchemaService!.upsertBatch(pointingSchemaDocuments);
            await nebulatestService.pnsInsertRecords(testingAddonUUID, pointingSchemaService!.schemaName!, (pointingSchemaDocuments as BasicRecord[]));
            // wait for PNS callback to create nodes and edges in graph.
            await nebulatestService.waitForPNS();
        });

        it('Call getRecordsRequiringSync, expect only documents pointing to given account in result', async () => {
            assertInitialPreparations();

            // Check only documents that points to "current account" (account that point to current user) are retrieved.
            accounts = await getAccountsToPointTo();
            const filter = buildSystemFilter(accounts.pointingAccount.UUID!)
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName, timeStampBeforeCreation, false, filter);
            const recordsKeysRequiringSync = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            expect(recordsKeysRequiringSync).to.not.be.undefined;
            expect(recordsKeysRequiringSync.Keys.length).to.be.equal(3);

            recordsKeysRequiringSync.Keys.forEach(recordKeyRequiringSync => {
                expect(documentsThatPointA.includes(recordKeyRequiringSync)).to.be.true;
            });
        });

        it('Call getRecordsRequiringSync with a different account UUID in filter, expect only documents pointing to given account in result', async () => {
            assertInitialPreparations();

            // Check only documents that points to "current account" (account that point to current user) are retrieved.
            accounts = await getAccountsToPointTo();
            const filter = buildSystemFilter(accounts.otherAccount.UUID!)
            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName, timeStampBeforeCreation, false, filter);
            const recordsKeysRequiringSync = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            expect(recordsKeysRequiringSync).to.not.be.undefined;
            expect(recordsKeysRequiringSync.Keys.length).to.be.equal(3);

            recordsKeysRequiringSync.Keys.forEach(recordKeyRequiringSync => {
                expect(documentsThatPointB.includes(recordKeyRequiringSync)).to.be.true;
            });
        });

        it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
            await cleanUp(resourceManager, performanceManager);
        });
    });

    describe('GetDocumentKeysRequiringSync - hidden edge causes nodes to return hidden', async () => {
        // services
        const nebulatestService = NebulaServiceFactory.getNebulaService(generalService, addonService.papiClient, dataObj, isLocal);
        const performanceManager: PerformanceManager = new PerformanceManager();
        const resourceManager: ResourceManagerService = new ResourceManagerService(generalService.papiClient, automationAddonUUID);
        const ACCOUNTS_TABLE = 'accounts';
        const ACCOUNT_USERS_TABLE = 'account_users';

        function getSchema(): AddonDataScheme {
            return {
                Name: "nebulaTestPointToAccountTable" + getShortUUID(),
                Type: "data",
                Fields:
                {
                    field1: {
                        Type: "Resource",
                        ApplySystemFilter: true,
                        AddonUUID: CORE_RESOURCES_UUID,
                        Resource: ACCOUNTS_TABLE
                    },
                },
                SyncData: {
                    Sync: true
                }
            };
        }

        // Preparations parameters
        const timeStampBeforeCreation = new Date().toISOString();
        type Accounts = { pointingAccount: Account; otherAccount: Account; };
        let accountUUID: string;
        const documentKey = '1';
        let pointingSchemaService: ADALTableService | undefined = undefined;

        it('Preparations - create table', async () => {

            // Create a table that points to the accounts table.
            const schema: AddonDataScheme = getSchema();
            pointingSchemaService = await resourceManager.createAdalTable(schema);

            await nebulatestService.pnsInsertSchema(testingAddonUUID, pointingSchemaService!.schemaName!);
            await nebulatestService.initPNS();
        });

        it('Preparations - wait for PNS', async () => {
            await nebulatestService.waitForPNS();
        });

        it('Preparations - upsert documents', async () => {

            // Upsert documents, half points to current account, and the others to a different one.
            accountUUID = (await accountUsersService.getAccountPointingToCurrentUser()).UUID!;
            const pointingSchemaDocuments: AddonData[] = [{
                Key: documentKey,
                field1: accountUUID
            }];

            await pointingSchemaService!.upsertBatch(pointingSchemaDocuments);
            await nebulatestService.pnsInsertRecords(testingAddonUUID, pointingSchemaService!.schemaName!, (pointingSchemaDocuments as BasicRecord[]));
        });

        it('Preparations - wait for PNS', async () => {
            await nebulatestService.waitForPNS();
        });

        it('Preparations - hide edge', async () => {
            const currentUserUUID = usersService.getCurrentUserUUID();
            const accountUser: AccountUser = await accountUsersService.hideAccountUser(accountUUID, currentUserUUID);

            // emit offline PNS event
            const oldAccountUser = { ...accountUser, Hidden: false };
            await nebulatestService.pnsUpdateRecords(CORE_UUID, ACCOUNT_USERS_TABLE, [oldAccountUser], [accountUser]);
        });

        it('Preparations - wait for PNS', async () => {
            await nebulatestService.waitForPNS();
        });

        it('Call getRecordsRequiringSync, expect document to be returned as a hidden node', async () => {

            const getRecordsRequiringSyncParams = buildGetRecordsRequiringSyncParameters(pointingSchemaService!.schemaName, timeStampBeforeCreation, true, { Type: "None" });
            const recordsKeysRequiringSync: GetRecordsRequiringSyncResponse = await nebulatestService.getRecordsRequiringSync(getRecordsRequiringSyncParams);
            console.log(JSON.stringify(recordsKeysRequiringSync));
            expect(recordsKeysRequiringSync).to.not.be.undefined;
            expect(recordsKeysRequiringSync.HiddenKeys.length).to.be.at.least(1);
            expect(recordsKeysRequiringSync.HiddenKeys.includes(documentKey)).to.be.true;
        });

        it(`Cleanup - unhide edge`, async () => {
            const currentUserUUID = usersService.getCurrentUserUUID();
            const accountUser: AccountUser = await accountUsersService.unhideAccountUser(accountUUID, currentUserUUID);

            // emit offline PNS event
            const oldAccountUser = { ...accountUser, Hidden: true };
            await nebulatestService.pnsUpdateRecords(CORE_UUID, ACCOUNT_USERS_TABLE, [oldAccountUser], [accountUser]);
        });

        it(`Cleanup - Delete all inserted data and print performance statistics`, async () => {
            await cleanUp(resourceManager, performanceManager);
        });
    });    
}
