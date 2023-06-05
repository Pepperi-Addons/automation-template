//00000000-0000-0000-0000-000000006a91
import { AddonDataScheme, AddonData, PapiClient } from "@pepperi-addons/papi-sdk";
import { GeneralService, TesterFunctions } from "../../potentialQA_SDK/src/infra_services/general.service";
import { SystemFilter, GetResourcesRequiringSyncParameters, SystemFilterType } from "../entities/nebula/types";
import { BasicRecord } from "./services/NebulaPNSEmulator.service";
import { NebulaServiceFactory } from "./services/NebulaServiceFactory";
import { AccountUsersService } from "./services/account-users.service";
import { PerformanceManager } from "./services/performance_management/performance_manager";
import { ADALTableService } from "./services/resource_management/adal_table.service";
import { ResourceManagerService } from "./services/resource_management/resource_manager.service";
import { UsersService } from "./services/users.service";
import { AddonUUID as testingAddonUUID } from "../../../addon.config.json";
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jwt-decode';

export async function SchemasRequiringSyncTests(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions) {
    const dataObj = request.body.Data; // the 'Data' object passsed inside the http request sent to start the test -- put all the data you need here
    const isLocal = request.body.isLocal;
    //setting 'mocha verbs' to use
    const describe = tester.describe;
    const expect = tester.expect;
    const it = tester.it;

    const automationAddonUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4";
    const CORE_RESOURCES_UUID = 'fc5a5974-3b30-4430-8feb-7d5b9699bc9f';
    const usersService = new UsersService(generalService.papiClient);
    const accountUsersService = new AccountUsersService(generalService.papiClient);

    async function cleanUp(resourceManager: ResourceManagerService, performanceManager: PerformanceManager) {
        //TODO: add PNS cleanup here
        await resourceManager.cleanup();
        console.log(JSON.stringify(performanceManager.getStatistics()));
    }

    function buildGetResourcesRequiringSyncParameters(modificationDateTime: string, includeDeleted: boolean = false, filter: SystemFilter | undefined = undefined): GetResourcesRequiringSyncParameters {
        return {
            ModificationDateTime: modificationDateTime,
            IncludeDeleted: includeDeleted,
            SystemFilter: filter
        };
    }

    function getShortUUID(): string {
        return uuidv4().split('-')[0];
    }
    
    function getCurrentUserUUID(papiClient: PapiClient): string {
        const decodedToken: any = jwt(papiClient['options'].token);
        const currentUser = decodedToken["pepperi.useruuid"];
        return currentUser;
    }

    describe('GetSchemasRequiringSync Suites', () => {
        const nebulatestService = NebulaServiceFactory.getNebulaService(generalService, addonService.papiClient, dataObj, isLocal);
        const performanceManager: PerformanceManager = new PerformanceManager();
        const resourceManager: ResourceManagerService = new ResourceManagerService(generalService.papiClient, automationAddonUUID);
        const ACCOUNTS_TABLE = 'accounts';
        const USERS_TABLE = 'users';

        function buildSystemFilter(type: SystemFilterType, accountUUID?: string): SystemFilter {
            return {
                Type: type,
                AccountUUID: accountUUID
            };
        }

        function getSchemaPointingToAccounts(): AddonDataScheme {
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

        function getSchemaPointingToUsers(): AddonDataScheme {
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

        describe('Tables without documents - system filter', () => {

            // Preparations parameters
            const timeStampBeforeCreation = new Date().toISOString();
            let usersSchemaService: ADALTableService | undefined = undefined;
            let accountsSchemaService: ADALTableService | undefined = undefined;

            it('Preparations - create a table pointing to accounts.', async () => {
                accountsSchemaService = await resourceManager.createAdalTable(getSchemaPointingToAccounts());
                await nebulatestService.pnsInsertSchema(testingAddonUUID, accountsSchemaService!.schemaName!);
                console.debug(`Accounts Schema: ${accountsSchemaService?.schemaName}`);
            });

            it('Preparations - create a table pointing to users.', async () => {
                usersSchemaService = await resourceManager.createAdalTable(getSchemaPointingToUsers());
                await nebulatestService.pnsInsertSchema(testingAddonUUID, usersSchemaService!.schemaName!);
                console.debug(`Users Schema: ${usersSchemaService?.schemaName}`);
            });

            it('Preparations - wait for PNS after table creation.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('System filter type "Account", expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('Account');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check we got a valid response
                expect(resourcesRequiringSync).to.not.be.undefined;

                // Check table pointing to accounts is not in response
                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToAccounts).to.be.undefined;

                // Check table pointing to users is not in response
                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.be.undefined;
            });

            it('System filter type "User", expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('User');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schema is in response
                expect(resourcesRequiringSync).to.not.be.undefined;

                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.be.undefined;

                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToAccounts).to.be.undefined;
            });

            it('System filter type "None", expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('None');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;

                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.be.undefined;
                expect(schemaPointingToAccounts).to.be.undefined;
            });

            it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
                await cleanUp(resourceManager, performanceManager);
            });
        });

        describe('Tables with documents - system filter with current and futuristic modification date', () => {

            // Preparations parameters
            const timeStampBeforeCreation = new Date().toISOString();
            const futuristicTimeStamp = new Date(Date.now() + 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 10).toISOString();
            let usersSchemaService: ADALTableService | undefined = undefined;
            let accountsSchemaService: ADALTableService | undefined = undefined;

            async function getAnAccountUUID(): Promise<string> {
                const accounts = await generalService.papiClient.accounts.find();
                const validAccount = accounts.find(account => account.UUID !== undefined);

                if (validAccount === undefined) {
                    throw new Error('Distributor does not have an account with a UUID, create an account and try again.');
                }

                return validAccount.UUID!;
            }

            it('Preparations - create a table pointing to accounts.', async () => {
                accountsSchemaService = await resourceManager.createAdalTable(getSchemaPointingToAccounts());
                await nebulatestService.pnsInsertSchema(testingAddonUUID, accountsSchemaService!.schemaName!);
                console.debug(`Accounts Schema: ${accountsSchemaService?.schemaName}`);
            });

            it('Preparations - create a table pointing to users.', async () => {
                usersSchemaService = await resourceManager.createAdalTable(getSchemaPointingToUsers());
                await nebulatestService.pnsInsertSchema(testingAddonUUID, usersSchemaService!.schemaName!);
                console.debug(`Users Schema: ${usersSchemaService?.schemaName}`);
            });

            it('Preparations - wait for PNS after table creation.', async () => {
                await nebulatestService.waitForPNS();
            });

            let accountUUID = '';
            it('Preparations - upsert documents into table pointing to accounts.', async () => {
                accountUUID = (await accountUsersService.getAccountPointingToCurrentUser()).UUID!;//await getAnAccountUUID();
                const accountDocuments: AddonData[] = [{
                    Key: '1',
                    field1: accountUUID
                }];
                await accountsSchemaService!.upsertBatch(accountDocuments);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, accountsSchemaService!.schemaName!, (accountDocuments as BasicRecord[]));
            });

            it('Preparations - upsert documents into table pointing to users.', async () => {
                const userDocuments: AddonData[] = [{
                    Key: '1',
                    field1: getCurrentUserUUID(addonService.papiClient)
                }];
                await usersSchemaService!.upsertBatch(userDocuments);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, usersSchemaService!.schemaName!, (userDocuments as BasicRecord[]));
            });

            it('Preparations - wait for PNS after documents upsertion.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('System filter type "Account", expect to get table pointing to accounts and not users', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('Account', accountUUID);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check we got a valid response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.length).to.be.at.least(1);

                // Check table pointing to accounts is in response
                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToAccounts).to.not.be.undefined;

                // Check table pointing to users is not in response
                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.be.undefined;
            });

            it('System filter type "User", expect to get table pointing to users and not accounts', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('User');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schema is in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.length).to.be.at.least(1);

                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.not.be.undefined;

                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToAccounts).to.be.undefined;
            });

            it('System filter type "None", expect to get both tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('None');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.length).to.be.at.least(2);

                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.not.be.undefined;
                expect(schemaPointingToAccounts).to.not.be.undefined;
            });

            it('System filter type "Account", using futuristicTimeStamp, expect to get zero tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('Account');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(futuristicTimeStamp, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check we got a valid response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.length).to.be.equal(0);
            });

            it('System filter type "User", using futuristicTimeStamp, expect to get zero tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('User');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(futuristicTimeStamp, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schema is in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.length).to.be.equal(0);
            });

            it('System filter type "None", using futuristicTimeStamp, expect to get zero tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('None');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(futuristicTimeStamp, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.length).to.be.equal(0);
            });

            it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
                await cleanUp(resourceManager, performanceManager);
            });
        });

        describe('Tables with documents that does not point to current user/account', () => {

            // Preparations parameters
            const timeStampBeforeCreation = new Date().toISOString();
            let usersSchemaService: ADALTableService | undefined = undefined;
            let accountsSchemaService: ADALTableService | undefined = undefined;

            it('Preparations - create a table pointing to accounts.', async () => {
                accountsSchemaService = await resourceManager.createAdalTable(getSchemaPointingToAccounts());
                await nebulatestService.pnsInsertSchema(testingAddonUUID, accountsSchemaService!.schemaName!);
                console.debug(`Accounts Schema: ${accountsSchemaService?.schemaName}`);
            });

            it('Preparations - create a table pointing to users.', async () => {
                usersSchemaService = await resourceManager.createAdalTable(getSchemaPointingToUsers());
                await nebulatestService.pnsInsertSchema(testingAddonUUID, usersSchemaService!.schemaName!);
                console.debug(`Users Schema: ${usersSchemaService?.schemaName}`);
            });

            it('Preparations - wait for PNS after table creation.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('Preparations - upsert a document that points to an account which does not point to current user.', async () => {
                const accountDocuments: AddonData[] = [{
                    Key: '1',
                    field1: (await accountUsersService.getAccountNotPointingToCurrentUser()).UUID
                }];
                await accountsSchemaService!.upsertBatch(accountDocuments);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, accountsSchemaService!.schemaName!, (accountDocuments as BasicRecord[]));
            });

            it('Preparations - upsert a document that points to a user which is not current user.', async () => {

                const userDocuments: AddonData[] = [{
                    Key: '1',
                    field1: (await usersService.getNotCurrentUser()).UUID
                }];
                await usersSchemaService!.upsertBatch(userDocuments);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, usersSchemaService!.schemaName!, (userDocuments as BasicRecord[]));
            });

            it('Preparations - wait for PNS after documents upsertion.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('System filter type "Account", expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('Account', (await accountUsersService.getAccountPointingToCurrentUser()).UUID);
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check we got a valid response
                expect(resourcesRequiringSync).to.not.be.undefined;

                // Check table pointing to accounts is not in response
                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToAccounts).to.be.undefined;

                // Check table pointing to users is not in response
                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.be.undefined;
            });

            it('System filter type "User", expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('User');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schema is in response
                expect(resourcesRequiringSync).to.not.be.undefined;

                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.be.undefined;

                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToAccounts).to.be.undefined;
            });

            it('System filter type "None", expect to not get tables', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('None');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, false, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;

                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                const schemaPointingToAccounts = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === accountsSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.be.undefined;
                expect(schemaPointingToAccounts).to.be.undefined;
            });

            it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
                await cleanUp(resourceManager, performanceManager);
            });
        });

        describe('Hidden table with documents', () => {

            // Preparations parameters
            const timeStampBeforeCreation = new Date().toISOString();
            const futuristicTimeStamp = new Date(Date.now() + 1000 /*sec*/ * 60 /*min*/ * 60 /*hour*/ * 24 /*day*/ * 10).toISOString();
            let usersSchemaService: ADALTableService | undefined = undefined;

            it('Preparations - create a table pointing to users.', async () => {
                usersSchemaService = await resourceManager.createAdalTable(getSchemaPointingToUsers());
                await nebulatestService.pnsInsertSchema(testingAddonUUID, usersSchemaService!.schemaName!);
                console.debug(`Users Schema: ${usersSchemaService?.schemaName}`);
            });

            it('Preparations - wait for PNS after table creation.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('Preparations - upsert documents into table pointing to users.', async () => {
                const userDocuments: AddonData[] = [{
                    Key: '1',
                    field1: getCurrentUserUUID(addonService.papiClient)
                }];
                await usersSchemaService!.upsertBatch(userDocuments);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, usersSchemaService!.schemaName!, (userDocuments as BasicRecord[]));
            });

            it('Preparations - wait for PNS after documents upsertion.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('Preparations - hide table.', async () => {
                const schema = usersSchemaService!.getSchema();
                schema.Hidden = true;
                await usersSchemaService!.updateSchema(schema);
                await nebulatestService.pnsUpdateSchemaHiddenStatus(testingAddonUUID, usersSchemaService!.schemaName!, true);
            });

            it('Preparations - wait for PNS after hiding table.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('System filter type "None", expect to not get hidden table', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('None');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, true, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas are in response
                expect(resourcesRequiringSync).to.not.be.undefined;

                const schemaPointingToUsers = resourcesRequiringSync.find(resource => {
                    return (resource.Resource === usersSchemaService!.schemaName && resource.AddonUUID === automationAddonUUID);
                });
                expect(schemaPointingToUsers).to.be.undefined;
            });

            it('Cleanup - unhide table for purging.', async () => {
                const schema = usersSchemaService!.getSchema();
                schema.Hidden = false;
                await usersSchemaService!.updateSchema(schema);
                await nebulatestService.pnsUpdateSchemaHiddenStatus(testingAddonUUID, usersSchemaService!.schemaName!, true);
            });

            it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
                await cleanUp(resourceManager, performanceManager);
            });
        });

        describe('Table with documents - verify we get type & sync data', () => {

            // Preparations parameters
            const timeStampBeforeCreation = new Date().toISOString();
            let usersSchemaService: ADALTableService | undefined = undefined;

            it('Preparations - create a table pointing to users.', async () => {
                usersSchemaService = await resourceManager.createAdalTable(getSchemaPointingToUsers());
                await nebulatestService.pnsInsertSchema(testingAddonUUID, usersSchemaService!.schemaName!);
                console.debug(`Users Schema: ${usersSchemaService?.schemaName}`);
            });

            it('Preparations - wait for PNS after table creation.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('Preparations - upsert documents into table pointing to users.', async () => {
                const userDocuments: AddonData[] = [{
                    Key: '1',
                    field1: getCurrentUserUUID(addonService.papiClient)
                }];
                await usersSchemaService!.upsertBatch(userDocuments);
                await nebulatestService.pnsInsertRecords(testingAddonUUID, usersSchemaService!.schemaName!, (userDocuments as BasicRecord[]));
            });

            it('Preparations - wait for PNS after documents upsertion.', async () => {
                await nebulatestService.waitForPNS();
            });

            it('System filter type "None", expect to get table with type and sync data fields', async () => {
                // Get schemas that have the account in their path
                const filter = buildSystemFilter('None');
                const getResourcesRequiringSyncParameters = buildGetResourcesRequiringSyncParameters(timeStampBeforeCreation, true, filter);
                const resourcesRequiringSync = await nebulatestService.getResourcesRequiringSync(getResourcesRequiringSyncParameters);

                // Check that expected schemas & fields are in response
                expect(resourcesRequiringSync).to.not.be.undefined;
                expect(resourcesRequiringSync.length).to.be.at.least(1);
                expect(resourcesRequiringSync[0].Type).to.not.be.undefined;
                expect(resourcesRequiringSync[0].SyncData).to.not.be.undefined;
            });

            it(`Cleanup Of All Inserted Data and print performance statistics`, async () => {
                await cleanUp(resourceManager, performanceManager);
            });
        });

    });
}
