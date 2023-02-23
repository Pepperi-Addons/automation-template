// 00000000-0000-0000-0000-00000000ada1
import { GeneralService, TesterFunctions } from "test_infra";
import { SchemaExtensionsService } from "./services/SchemaExtensions.service";

export async function SchemaExtensions(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions) {

    const describe = tester.describe;
    const expect = tester.expect;
    const it = tester.it;

    describe('SchemaExtensions Suites', async () => {
            
        const schemaExtensionsService = new SchemaExtensionsService(generalService, addonService.papiClient);
        
        it('Test extending schema is updated on base changes', async () => {
            const baseSchemaName = generateRandomSchemaName();
            const extendingSchemaName = generateRandomSchemaName();
            console.log(`Base schema name: ${baseSchemaName}`);
            console.log(`Extending schema name: ${extendingSchemaName}`);
            
            const schemaType = 'data';
            const fieldType = 'String';

            // Create a base schema
            await schemaExtensionsService.upsertSchema(baseSchemaName, schemaType, { field1: { Type: fieldType } });
            
            // Create an extending schema
            await schemaExtensionsService.createExtendingSchema(extendingSchemaName, schemaType,  { field2: { Type: fieldType } }, baseSchemaName);

            // Modify base schema
            await schemaExtensionsService.upsertSchema(baseSchemaName, schemaType, { field3: { Type: fieldType } });

            // sleep for a bit
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Check extending schema was updated
            const schema = await schemaExtensionsService.getSchema(extendingSchemaName);
            expect(schema).to.have.property('Fields');
            
            expect(schema.Fields).to.have.property('field2');
            expect(schema.Fields!.field2).to.have.property('Type', fieldType);
            expect(schema.Fields!.field2).to.have.property('ExtendedField', false);
            
            expect(schema.Fields).to.have.property('field3');
            expect(schema.Fields!.field3).to.have.property('Type', fieldType);
            expect(schema.Fields!.field3).to.have.property('ExtendedField', true);

            // Purge schemas and subscriptions
            try {
                await schemaExtensionsService.purgeSchema(baseSchemaName);
                await schemaExtensionsService.purgeSchema(extendingSchemaName);
                await schemaExtensionsService.hideSubscription(baseSchemaName, extendingSchemaName);
            } catch {}
        });

        it('Test extending schema fails upsert when base is not specified', async () => {
            const baseSchemaName = undefined;
            const extendingSchemaName = generateRandomSchemaName();
            console.log(`Extending schema name: ${extendingSchemaName}`);
            
            const schemaType = 'data';
            const fieldType = 'String';
            
            // Create an extending schema
            const errorMessage = "Extend field mush have 'AddonUUID' and 'Name' fields"
            try {
                expect(
                    schemaExtensionsService.createExtendingSchema(extendingSchemaName, schemaType,  { field1: { Type: fieldType } }, baseSchemaName as any))
                    .to.eventually.be.rejectedWith(errorMessage);
            } catch (error) {
                try {
                    // In case of test failure purge schema
                    await schemaExtensionsService.purgeSchema(extendingSchemaName);
                } catch {}
                throw error;
            }
        });

        it('Test extending schema fails upsert when base does not exist', async () => {
            const baseSchemaName = generateRandomSchemaName();
            const extendingSchemaName = generateRandomSchemaName();
            console.log(`Base schema name: ${baseSchemaName}`);
            console.log(`Extending schema name: ${extendingSchemaName}`);

            const schemaType = 'data';
            const fieldType = 'String';

            // Create an extending schema
            const errorMessage = 'Base schema does not exist'
            try {
                expect(
                    schemaExtensionsService.createExtendingSchema(extendingSchemaName, schemaType, { field1: { Type: fieldType } }, baseSchemaName))
                    .to.eventually.be.rejectedWith(errorMessage);
            }
            catch (error) {
                try {
                    // In case of test failure purge schema
                    await schemaExtensionsService.purgeSchema(extendingSchemaName);
                } catch { }
                throw error;
            }
        });

        it('Test extending schema fails to upsert - fields conflict', async () => {
            const baseSchemaName = generateRandomSchemaName();
            const extendingSchemaName = generateRandomSchemaName();
            console.log(`Base schema name: ${baseSchemaName}`);
            console.log(`Extending schema name: ${extendingSchemaName}`);

            const schemaType = 'data';
            const fieldsNames = ['field1'];
            const fieldType = 'String';

            // Create a base schema
            await schemaExtensionsService.upsertSchema(baseSchemaName, schemaType, { field1: { Type: fieldType } });
            
            // Create an extending schema
            const errorMessage = `Cannot extend schema, fields ${fieldsNames.toString()} exist in both schemas`
            try {
                expect(
                    schemaExtensionsService.createExtendingSchema(extendingSchemaName, schemaType,  { field1: { Type: fieldType } }, baseSchemaName))
                    .to.eventually.be.rejectedWith(errorMessage);
            } catch (error) {
                try {
                     // In case of test failure purge schema
                    await schemaExtensionsService.purgeSchema(extendingSchemaName);
                } catch {}
                throw error;
            }

            // Purge
            await schemaExtensionsService.purgeSchema(baseSchemaName);
        });
    });
}

function generateRandomSchemaName(): string {
    const randomNumber = Math.floor(Math.random() * 1000000);
    return `testSchema${randomNumber}`;
}