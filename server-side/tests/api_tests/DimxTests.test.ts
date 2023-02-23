//44c97115-6d14-4626-91dc-83f176e9a0fc
import { DimxTestsService } from "./services/DimxTests.service";
// import GeneralService, { TesterFunctions } from "../../potentialQA_SDK/server_side/general.service";
import { Relation, AddonDataScheme, DataImportInput, DIMXObject, AddonData, RecursiveImportInput, PapiClient } from "@pepperi-addons/papi-sdk";
import Promise from 'bluebird';
import { DIMX_ADDON_UUID, HOST_SCHEMA_NAME, REFERENCE_SCHEMA_NAME, CONTAINED_SCHEMA_NAME, BASE_SCHEMA_NAME, SECOND_BASE_SCHEMA_NAME, baseSchema, hostSchema, referenceSchema, containedSchema, MAX_CONCURRENCY, FileExportOutput, FileImportOutput, RecursiveExportOutput, RecursiveImportOutput, BaseTableObject, HostTableObject, ReferenceTableObject } from "./services/DIMXTests_types_and_schemes";
import { ADALTableService } from "./services/resource_management/adal_table.service";
import { ResourceManagerService } from "./services/resource_management/resource_manager.service";
import { Client } from "@pepperi-addons/debug-server/dist";
import { GeneralService, TesterFunctions } from "test_infra";

async function convertSchemasToAdalTableService(resourceManagerService: ResourceManagerService, schemasObjectDict: {
    [schema_name: string]: AddonDataScheme;
}): Promise<{ [schema_name: string]: ADALTableService }> {
    const concurrency = 5;
    let adalTableServicesDict: { [schema_name: string]: ADALTableService } = {};

    const keyArray: string[] = Object.keys(schemasObjectDict);
    const schemasArray: AddonDataScheme[] = keyArray.map(key => schemasObjectDict[key]);
    const adalTableServicesArray: ADALTableService[] = await Promise.map(schemasArray, async (addonDataScheme: AddonDataScheme) => {
        return await resourceManagerService.createAdalTable(addonDataScheme);
    }, { concurrency: concurrency });

    for (let index = 0; index < keyArray.length; index++) {
        const key = keyArray[index];
        const adalTableService: ADALTableService = adalTableServicesArray[index];
        adalTableServicesDict[key] = adalTableService;
    }

    return adalTableServicesDict;
}

function generateBaseTableObjects(amountToGenerate: number, mapKeys = false, fixStrings = false, postMapAndFix = false): BaseTableObject[] {
    const baseTableObjectArr: BaseTableObject[] = [];
    for (let index = 0; index < amountToGenerate; index++) {
        baseTableObjectArr.push({
            Key: `${postMapAndFix && mapKeys ? "Replaced " : ""}${mapKeys ? "ToReplace_" : ""}BaseTableKey${index}`,
            StringProperty: `${postMapAndFix && fixStrings ? "Fixed " : ""}${fixStrings ? "ToFix_" : ""}BaseTableString${index}`,
            NumberProperty: index,
            BoolProperty: false,
            ObjectProperty: {
                InnerProperty: `BaseTableInner${index}`
            },
            ArrayProperty: [`BaseTableArray${index}`, `BaseTableArray${index + 1}`],
            IsCurrentlyImporting: false
        })
    }
    return baseTableObjectArr
}

function generateHostTableObjects(amountToGenerate: number, mapKeys = false, postMapAndFix = false): HostTableObject[] {
    const HostTableObjectArr: HostTableObject[] = [];
    for (let index = 0; index < amountToGenerate; index++) {
        HostTableObjectArr.push({
            Key: `${postMapAndFix && mapKeys ? "Replaced " : ""}${mapKeys ? "ToReplace_" : ""}HostTableKey${index}`,
            StaticReference: `${postMapAndFix && mapKeys ? "Replaced " : ""}${mapKeys ? "ToReplace_" : ""}ReferenceTableKey${index}`,
            IsCurrentlyImporting: false
        })
    }
    return HostTableObjectArr
}

function generateReferenceTableObjects(amountToGenerate: number, mapKeys = false, fixStrings = false, postMapAndFix = false): ReferenceTableObject[] {
    const ReferenceTableObjectArr: ReferenceTableObject[] = [];
    for (let index = 0; index < amountToGenerate; index++) {
        ReferenceTableObjectArr.push({
            Key: `${postMapAndFix && mapKeys ? "Replaced " : ""}${mapKeys ? "ToReplace_" : ""}ReferenceTableKey${index}`,
            DynamicContainedArray: [{
                AddonUUID: DIMX_ADDON_UUID,
                Resource: CONTAINED_SCHEMA_NAME,
                Data: {
                    DynamicReference: {
                        Key: `${postMapAndFix && mapKeys ? "Replaced " : ""}${mapKeys ? "ToReplace_" : ""}BaseTableKey${(index * 2) + 0}`,
                        AddonUUID: DIMX_ADDON_UUID,
                        Resource: BASE_SCHEMA_NAME
                    },
                    StringProperty: `${postMapAndFix && fixStrings ? "Fixed " : ""}${fixStrings ? "ToFix_" : ""}ContainedTableString${(index * 2) + 0}`,
                }
            }, {
                AddonUUID: DIMX_ADDON_UUID,
                Resource: CONTAINED_SCHEMA_NAME,
                Data: {
                    DynamicReference: {
                        Key: `${postMapAndFix && mapKeys ? "Replaced " : ""}${mapKeys ? "ToReplace_" : ""}BaseTableKey${(index * 2) + 1}`,
                        AddonUUID: DIMX_ADDON_UUID,
                        Resource: BASE_SCHEMA_NAME
                    },
                    StringProperty: `${postMapAndFix && fixStrings ? "Fixed " : ""}${fixStrings ? "ToFix_" : ""}ContainedTableString${(index * 2) + 1}`,
                }
            }],
            IsCurrentlyImporting: false
        })
    }
    return ReferenceTableObjectArr
}

export async function DimxTests(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions) {

    //setting 'mocha verbs' to use
    const describe = tester.describe;
    const expect = tester.expect;
    const it = tester.it;
    const dataObj = request.body.Data; // should have the DIMX secret key in dataObj["SK"]

    describe('DimxTests Suites', async () => {
        let dimxResources: { [schema_name: string]: ADALTableService };
        // TODO - make this prettier and not awful like this
        const dimxResourceRelationOptionsArray: Relation[] = [
            {
                AddonUUID: DIMX_ADDON_UUID,
                Name: HOST_SCHEMA_NAME,
                RelationName: "DataImportResource",
                Type: "AddonAPI",
                AddonRelativeURL: "/api/import_relation_function",
                MappingRelativeURL: "/api/mapping_relation_function",
                FixRelativeURL: "/api/fix_relation_function"
            },
            {
                AddonUUID: DIMX_ADDON_UUID,
                Name: REFERENCE_SCHEMA_NAME,
                RelationName: "DataImportResource",
                Type: "AddonAPI",
                AddonRelativeURL: "/api/import_relation_function",
                MappingRelativeURL: "/api/mapping_relation_function",
                FixRelativeURL: "/api/fix_relation_function"
            },
            {
                AddonUUID: DIMX_ADDON_UUID,
                Name: CONTAINED_SCHEMA_NAME,
                RelationName: "DataImportResource",
                Type: "AddonAPI",
                AddonRelativeURL: "/api/import_relation_function",
                MappingRelativeURL: "/api/mapping_relation_function",
                FixRelativeURL: "/api/fix_relation_function"
            },
            {
                AddonUUID: DIMX_ADDON_UUID,
                Name: BASE_SCHEMA_NAME,
                RelationName: "DataImportResource",
                Type: "AddonAPI",
                AddonRelativeURL: "/api/import_relation_function",
                MappingRelativeURL: "/api/mapping_relation_function",
                FixRelativeURL: "/api/fix_relation_function"
            },
            {
                AddonUUID: DIMX_ADDON_UUID,
                Name: SECOND_BASE_SCHEMA_NAME,
                RelationName: "DataImportResource",
                Type: "AddonAPI",
                AddonRelativeURL: "/api/import_relation_function",
                MappingRelativeURL: "/api/mapping_relation_function",
                FixRelativeURL: "/api/fix_relation_function"
            },
            {
                AddonUUID: DIMX_ADDON_UUID,
                Name: HOST_SCHEMA_NAME,
                RelationName: "DataExportResource",
                Type: "AddonAPI",
                AddonRelativeURL: "/api/export_relation_function"
            },
            {
                AddonUUID: DIMX_ADDON_UUID,
                Name: REFERENCE_SCHEMA_NAME,
                RelationName: "DataExportResource",
                Type: "AddonAPI",
                AddonRelativeURL: "/api/export_relation_function"
            },
            {
                AddonUUID: DIMX_ADDON_UUID,
                Name: CONTAINED_SCHEMA_NAME,
                RelationName: "DataExportResource",
                Type: "AddonAPI",
                AddonRelativeURL: "/api/export_relation_function"
            },
            {
                AddonUUID: DIMX_ADDON_UUID,
                Name: BASE_SCHEMA_NAME,
                RelationName: "DataExportResource",
                Type: "AddonAPI",
                AddonRelativeURL: "/api/export_relation_function"
            },
            {
                AddonUUID: DIMX_ADDON_UUID,
                Name: SECOND_BASE_SCHEMA_NAME,
                RelationName: "DataExportResource",
                Type: "AddonAPI",
                AddonRelativeURL: "/api/export_relation_function"
            }
        ]

        // base schema to have basic types, string integer bool object and array
        // the full recursive test will be: Host holds a static reference to Reference, which in turn holds a dynamic array of Contained, each holding a dynamic reference to a Base
        const dimxResourceSchemas: {
            [schema_name: string]: AddonDataScheme
        } = {
            base: {
                Name: BASE_SCHEMA_NAME,
                Type: "data",
                Fields: baseSchema
            },

            second_base: {
                Name: SECOND_BASE_SCHEMA_NAME,
                Type: "data",
                Fields: baseSchema
            },

            host: {
                Name: HOST_SCHEMA_NAME,
                Type: "data",
                Fields: hostSchema
            },

            reference: {
                Name: REFERENCE_SCHEMA_NAME,
                Type: "data",
                Fields: referenceSchema
            },

            contained: {
                Name: CONTAINED_SCHEMA_NAME,
                Type: "data",
                Fields: containedSchema
            }
        }

        // services
        const dimxService = new DimxTestsService(generalService, addonService.papiClient, dataObj);
        const client: any = generalService['client'];
        const dimxPapiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: DIMX_ADDON_UUID,
            addonSecretKey: dataObj["SK"],
        });
        const resourceManagerService = new ResourceManagerService(dimxPapiClient, DIMX_ADDON_UUID);

        console.log(`done creating services`);

        // create relations
        console.log(`creating relations now`);
        it('Create relations', async () => {
            try {
                for (let index = 0; index < dimxResourceRelationOptionsArray.length; index++) {
                    const relation: Relation = dimxResourceRelationOptionsArray[index];
                    await resourceManagerService.createRelation(relation);
                }
                // await Promise.map(dimxResourceRelationOptionsArray, async (relation: Relation) => {
                //     return await resourceManagerService.createRelation(relation); //I don't think I need the return values probably
                //}, { concurrency: MAX_CONCURRENCY });
            }
            catch (ex) {
                console.error(`dimxTest create relations: ${ex}`);
                throw new Error((ex as { message: string }).message);
            }
            console.log(`done creating relations`);
        });


        it('create resources', async () => {
            // create resources
            console.log(`creating resources now`);
            dimxResources = await convertSchemasToAdalTableService(resourceManagerService, dimxResourceSchemas)
            console.log(`done creating resources`);
        });

        it('dataImport insert: import data into the Base table, check dataImport output (all should be insert), check items exist', async () => {
            //create the dataImportInput
            const OBJECTS_AMOUNT = 5;
            const objectsToImport: BaseTableObject[] = generateBaseTableObjects(OBJECTS_AMOUNT);
            const dataImportInputForInsert: DataImportInput = {
                Objects: objectsToImport
            };

            const dataImportResults: DIMXObject[] = await dimxService.DIMXDataImport(DIMX_ADDON_UUID, BASE_SCHEMA_NAME, dataImportInputForInsert);

            expect(dataImportResults).to.be.an('array').with.lengthOf(dataImportInputForInsert.Objects.length);

            for (var i = 0; i < dataImportResults.length; i++) {
                expect(dataImportResults[i], 'Key')
                    .to.have.property('Key')
                    .that.is.a('String')
                    .and.is.equal(dataImportInputForInsert.Objects[i].Key);
                expect(dataImportResults[i], 'Status')
                    .to.have.property('Status')
                    .that.is.a('String')
                    .and.is.equal('Insert');
            }

            const recordsFromTable: AddonData[] = await dimxResources["base"].getRecords()

            expect(recordsFromTable).to.be.an('array').with.lengthOf(dataImportInputForInsert.Objects.length);

            for (var i = 0; i < recordsFromTable.length; i++) {
                const testedObject = recordsFromTable[i]
                const originalImportedObjectsWithSameKey: BaseTableObject[] = objectsToImport.filter((objectToImport: BaseTableObject) => {
                    return objectToImport.Key === testedObject.Key;
                });

                expect(originalImportedObjectsWithSameKey).to.be.an('array').with.lengthOf(1);

                const originalImportedObject = originalImportedObjectsWithSameKey[0];

                expect(testedObject, 'BoolProperty')
                    .to.have.property('BoolProperty')
                    .that.is.a('Boolean')
                    .and.is.equal(originalImportedObject.BoolProperty);
                expect(testedObject, 'StringProperty')
                    .to.have.property('StringProperty')
                    .that.is.a('String')
                    .and.is.equal(originalImportedObject.StringProperty);
                expect(testedObject, 'NumberProperty')
                    .to.have.property('NumberProperty')
                    .that.is.a('Number')
                    .and.is.equal(originalImportedObject.NumberProperty);
                expect(testedObject, 'ArrayProperty')
                    .to.have.property('ArrayProperty')
                    .that.is.an('Array')
                    .and.is.deep.equal(originalImportedObject.ArrayProperty);
                expect(testedObject, 'ObjectProperty')
                    .to.have.property('ObjectProperty')
                    .that.is.deep.equal(originalImportedObject.ObjectProperty);
                expect(testedObject, 'IsCurrentlyImporting')
                    .to.have.property('IsCurrentlyImporting')
                    .that.is.a('Boolean')
                    .and.is.equal(true);
            }

        });
        it('dataImport ignore: import data into Base table, check dataImport output (all should be ignore)', async () => {
            //create the dataImportInput
            const OBJECTS_AMOUNT = 5;
            const objectsToImport: BaseTableObject[] = generateBaseTableObjects(OBJECTS_AMOUNT);
            const dataImportInputForInsert: DataImportInput = {
                Objects: objectsToImport
            };

            const dataImportResults: DIMXObject[] = await dimxService.DIMXDataImport(DIMX_ADDON_UUID, BASE_SCHEMA_NAME, dataImportInputForInsert);

            expect(dataImportResults).to.be.an('array').with.lengthOf(dataImportInputForInsert.Objects.length);

            for (var i = 0; i < dataImportResults.length; i++) {
                expect(dataImportResults[i], 'Key')
                    .to.have.property('Key')
                    .that.is.a('String')
                    .and.is.equal(dataImportInputForInsert.Objects[i].Key);
                expect(dataImportResults[i], 'Status')
                    .to.have.property('Status')
                    .that.is.a('String')
                    .and.is.equal('Ignore');
            }

        });
        it('dataImport Update: import updated data into Base table, check dataImport output (all should be Update), check items exist', async () => {
            //create the dataImportInput
            const OBJECTS_AMOUNT = 5;
            const baseTableObjects: BaseTableObject[] = generateBaseTableObjects(OBJECTS_AMOUNT);
            const objectsToImport: BaseTableObject[] = baseTableObjects.map((baseTableObject: BaseTableObject) => {
                return { ...baseTableObject, BoolProperty: true }
            })
            const dataImportInputForUpdate: DataImportInput = {
                Objects: objectsToImport
            };

            const dataImportResults: DIMXObject[] = await dimxService.DIMXDataImport(DIMX_ADDON_UUID, BASE_SCHEMA_NAME, dataImportInputForUpdate);

            expect(dataImportResults).to.be.an('array').with.lengthOf(dataImportInputForUpdate.Objects.length);

            for (var i = 0; i < dataImportResults.length; i++) {
                expect(dataImportResults[i], 'Key')
                    .to.have.property('Key')
                    .that.is.a('String')
                    .and.is.equal(dataImportInputForUpdate.Objects[i].Key);
                expect(dataImportResults[i], 'Status')
                    .to.have.property('Status')
                    .that.is.a('String')
                    .and.is.equal('Update');
            }

            const recordsFromTable: AddonData[] = await dimxResources["base"].getRecords()

            expect(recordsFromTable).to.be.an('array').with.lengthOf(dataImportInputForUpdate.Objects.length);

            for (var i = 0; i < recordsFromTable.length; i++) {
                const testedObject = recordsFromTable[i]
                const originalImportedObjectsWithSameKey: BaseTableObject[] = objectsToImport.filter((objectToImport: BaseTableObject) => {
                    return objectToImport.Key === testedObject.Key;
                });

                expect(originalImportedObjectsWithSameKey).to.be.an('array').with.lengthOf(1);

                const originalImportedObject = originalImportedObjectsWithSameKey[0];

                expect(testedObject, 'BoolProperty')
                    .to.have.property('BoolProperty')
                    .that.is.a('Boolean')
                    .and.is.equal(originalImportedObject.BoolProperty);
                expect(testedObject, 'StringProperty')
                    .to.have.property('StringProperty')
                    .that.is.a('String')
                    .and.is.equal(originalImportedObject.StringProperty);
                expect(testedObject, 'NumberProperty')
                    .to.have.property('NumberProperty')
                    .that.is.a('Number')
                    .and.is.equal(originalImportedObject.NumberProperty);
                expect(testedObject, 'ArrayProperty')
                    .to.have.property('ArrayProperty')
                    .that.is.an('Array')
                    .and.is.deep.equal(originalImportedObject.ArrayProperty);
                expect(testedObject, 'ObjectProperty')
                    .to.have.property('ObjectProperty')
                    .that.is.deep.equal(originalImportedObject.ObjectProperty);
                expect(testedObject, 'IsCurrentlyImporting')
                    .to.have.property('IsCurrentlyImporting')
                    .that.is.a('Boolean')
                    .and.is.equal(true);
            }

        });
        it('fileExport: export data from Base table into a file with basic options, check result object, get the file and make sure the data corresponds with expected data', async () => {

            const fileExportOutput = await dimxService.SyncDIMXFileExport(DIMX_ADDON_UUID, BASE_SCHEMA_NAME, {})
            const fileExportJson: AddonData[] = await dimxService.DownloadJSONFromURL(fileExportOutput.URI);

            const recordsFromTable: AddonData[] = await dimxResources["base"].getRecords()

            expect(recordsFromTable).to.be.an('array').with.lengthOf(fileExportJson.length);

            for (var i = 0; i < recordsFromTable.length; i++) {
                const testedObject = recordsFromTable[i]
                const originalImportedObjectsWithSameKey: AddonData[] = fileExportJson.filter((addonData: AddonData) => {
                    return addonData.Key === testedObject.Key;
                });

                expect(originalImportedObjectsWithSameKey).to.be.an('array').with.lengthOf(1);

                const originalImportedObject = originalImportedObjectsWithSameKey[0];

                expect(testedObject, 'BoolProperty')
                    .to.have.property('BoolProperty')
                    .that.is.a('Boolean')
                    .and.is.equal(originalImportedObject.BoolProperty);
                expect(testedObject, 'StringProperty')
                    .to.have.property('StringProperty')
                    .that.is.a('String')
                    .and.is.equal(originalImportedObject.StringProperty);
                expect(testedObject, 'NumberProperty')
                    .to.have.property('NumberProperty')
                    .that.is.a('Number')
                    .and.is.equal(originalImportedObject.NumberProperty);
                expect(testedObject, 'ArrayProperty')
                    .to.have.property('ArrayProperty')
                    .that.is.an('Array')
                    .and.is.deep.equal(originalImportedObject.ArrayProperty);
                expect(testedObject, 'ObjectProperty')
                    .to.have.property('ObjectProperty')
                    .that.is.deep.equal(originalImportedObject.ObjectProperty);
                expect(testedObject, 'IsCurrentlyImporting')
                    .to.have.property('IsCurrentlyImporting')
                    .that.is.a('Boolean')
                    .and.is.equal(true);
            }


        });
        it('fileImport: export data from Base table into a file and import that file to Second base table. Get data from both tables and check that they are equal. ', async () => {

            const fileExportOutput: FileExportOutput = await dimxService.SyncDIMXFileExport(DIMX_ADDON_UUID, BASE_SCHEMA_NAME, {})
            const fileImportOutput: FileImportOutput = await dimxService.SyncDIMXFileImport(DIMX_ADDON_UUID, SECOND_BASE_SCHEMA_NAME, fileExportOutput)

            const recordsFromBaseTable: AddonData[] = await dimxResources["base"].getRecords();
            const recordsFromSecondBaseTable: AddonData[] = await dimxResources["second_base"].getRecords();

            expect(recordsFromSecondBaseTable).to.be.an('array').with.lengthOf(recordsFromBaseTable.length);

            for (var i = 0; i < recordsFromSecondBaseTable.length; i++) {
                const testedObject = recordsFromSecondBaseTable[i]
                const originalImportedObjectsWithSameKey: AddonData[] = recordsFromBaseTable.filter((addonData: AddonData) => {
                    return addonData.Key === testedObject.Key;
                });

                expect(originalImportedObjectsWithSameKey).to.be.an('array').with.lengthOf(1);

                const originalImportedObject = originalImportedObjectsWithSameKey[0];

                expect(testedObject, 'BoolProperty')
                    .to.have.property('BoolProperty')
                    .that.is.a('Boolean')
                    .and.is.equal(originalImportedObject.BoolProperty);
                expect(testedObject, 'StringProperty')
                    .to.have.property('StringProperty')
                    .that.is.a('String')
                    .and.is.equal(originalImportedObject.StringProperty);
                expect(testedObject, 'NumberProperty')
                    .to.have.property('NumberProperty')
                    .that.is.a('Number')
                    .and.is.equal(originalImportedObject.NumberProperty);
                expect(testedObject, 'ArrayProperty')
                    .to.have.property('ArrayProperty')
                    .that.is.an('Array')
                    .and.is.deep.equal(originalImportedObject.ArrayProperty);
                expect(testedObject, 'ObjectProperty')
                    .to.have.property('ObjectProperty')
                    .that.is.deep.equal(originalImportedObject.ObjectProperty);
                expect(testedObject, 'IsCurrentlyImporting')
                    .to.have.property('IsCurrentlyImporting')
                    .that.is.a('Boolean')
                    .and.is.equal(true);
            }
            await dimxResources["base"].resetSchema()
        });


        it('recursiveFileExport: recursively export data from Host table into a file with basic options, check result object, get the file and make sure the data corresponds with expected data', async () => {

            // add data to all resources
            const OBJECTS_AMOUNT = 5;
            const baseTableObjectsToImport: BaseTableObject[] = generateBaseTableObjects(OBJECTS_AMOUNT * 2) // there are amount*2 contained objects in the Reference table schema, each contained object holding a reference to Base table
            await dimxResources["base"].upsertBatch(baseTableObjectsToImport)

            const hostTableObjectsToImport: HostTableObject[] = generateHostTableObjects(OBJECTS_AMOUNT)
            await dimxResources["host"].upsertBatch(hostTableObjectsToImport)

            const referenceTableObjectsToImport: ReferenceTableObject[] = generateReferenceTableObjects(OBJECTS_AMOUNT)
            await dimxResources["reference"].upsertBatch(referenceTableObjectsToImport)

            // perform the export and get the data
            const recursiveFileExportOutput: RecursiveExportOutput = await dimxService.SyncDIMXRecursiveFileExport(DIMX_ADDON_UUID, HOST_SCHEMA_NAME, {})

            expect(recursiveFileExportOutput, "Resources").to.have.property("Resources").with.lengthOf(2, `Should have resource for ${REFERENCE_SCHEMA_NAME} and ${BASE_SCHEMA_NAME}`)

            const hostURI = recursiveFileExportOutput.URI;
            const referenceURI = recursiveFileExportOutput.Resources.filter((resource) => {
                return resource.Resource === REFERENCE_SCHEMA_NAME;
            })[0].URI;
            const baseURI = recursiveFileExportOutput.Resources.filter((resource) => {
                return resource.Resource === BASE_SCHEMA_NAME;
            })[0].URI;

            const resourcesJson: { [table_name: string]: AddonData[] } = {
                host: await dimxService.DownloadJSONFromURL(hostURI),
                reference: await dimxService.DownloadJSONFromURL(referenceURI),
                base: await dimxService.DownloadJSONFromURL(baseURI)
            }

            for (var i = 0; i < resourcesJson["host"].length; i++) {
                const testedObject = resourcesJson["host"][i]
                const originalImportedObjectsWithSameKey: AddonData[] = hostTableObjectsToImport.filter((addonData: AddonData) => {
                    return addonData.Key === testedObject.Key;
                });

                expect(originalImportedObjectsWithSameKey).to.be.an('array').with.lengthOf(1);

                const originalImportedObject = originalImportedObjectsWithSameKey[0];

                expect(testedObject, 'StaticReference')
                    .to.have.property('StaticReference')
                    .that.is.a('String')
                    .and.is.equal(originalImportedObject.StaticReference);
                expect(testedObject, 'IsCurrentlyImporting')
                    .to.have.property('IsCurrentlyImporting')
                    .that.is.a('Boolean')
                    .and.is.equal(false);
            }

            for (var i = 0; i < resourcesJson["reference"].length; i++) {
                const testedObject = resourcesJson["reference"][i]
                const originalImportedObjectsWithSameKey: AddonData[] = referenceTableObjectsToImport.filter((addonData: AddonData) => {
                    return addonData.Key === testedObject.Key;
                });

                expect(originalImportedObjectsWithSameKey).to.be.an('array').with.lengthOf(1);

                const originalImportedObject = originalImportedObjectsWithSameKey[0];

                expect(testedObject, 'DynamicContainedArray')
                    .to.have.property('DynamicContainedArray')
                    .that.is.an('Array')
                    .and.is.deep.equal(originalImportedObject.DynamicContainedArray);
                expect(testedObject, 'IsCurrentlyImporting')
                    .to.have.property('IsCurrentlyImporting')
                    .that.is.a('Boolean')
                    .and.is.equal(false);
            }

            for (var i = 0; i < resourcesJson["base"].length; i++) {
                const testedObject = resourcesJson["base"][i]
                const originalImportedObjectsWithSameKey: AddonData[] = baseTableObjectsToImport.filter((addonData: AddonData) => {
                    return addonData.Key === testedObject.Key;
                });

                expect(originalImportedObjectsWithSameKey).to.be.an('array').with.lengthOf(1);

                const originalImportedObject = originalImportedObjectsWithSameKey[0];

                expect(testedObject, 'BoolProperty')
                    .to.have.property('BoolProperty')
                    .that.is.a('Boolean')
                    .and.is.equal(originalImportedObject.BoolProperty);
                expect(testedObject, 'StringProperty')
                    .to.have.property('StringProperty')
                    .that.is.a('String')
                    .and.is.equal(originalImportedObject.StringProperty);
                expect(testedObject, 'NumberProperty')
                    .to.have.property('NumberProperty')
                    .that.is.a('Number')
                    .and.is.equal(originalImportedObject.NumberProperty);
                expect(testedObject, 'ArrayProperty')
                    .to.have.property('ArrayProperty')
                    .that.is.an('Array')
                    .and.is.deep.equal(originalImportedObject.ArrayProperty);
                expect(testedObject, 'ObjectProperty')
                    .to.have.property('ObjectProperty')
                    .that.is.deep.equal(originalImportedObject.ObjectProperty);
                expect(testedObject, 'IsCurrentlyImporting')
                    .to.have.property('IsCurrentlyImporting')
                    .that.is.a('Boolean')
                    .and.is.equal(false);
            }
        });

        it('recursiveFileImport: recursively export data from Host table into a file with basic options, reset the adal resources and recursive import back. check that all records that reached the tables are correct.', async () => {

            await dimxResources["base"].resetSchema();
            await dimxResources["host"].resetSchema();
            await dimxResources["reference"].resetSchema();

            // add data to all resources
            const OBJECTS_AMOUNT = 5;
            const baseTableObjectsToImport: BaseTableObject[] = generateBaseTableObjects(OBJECTS_AMOUNT * 2) // there are amount*2 contained objects in the Reference table schema, each contained object holding a reference to Base table
            await dimxResources["base"].upsertBatch(baseTableObjectsToImport)

            const hostTableObjectsToImport: HostTableObject[] = generateHostTableObjects(OBJECTS_AMOUNT)
            await dimxResources["host"].upsertBatch(hostTableObjectsToImport)

            const referenceTableObjectsToImport: ReferenceTableObject[] = generateReferenceTableObjects(OBJECTS_AMOUNT)
            await dimxResources["reference"].upsertBatch(referenceTableObjectsToImport)

            // perform the export and get the data
            const recursiveFileExportOutput: RecursiveExportOutput = await dimxService.SyncDIMXRecursiveFileExport(DIMX_ADDON_UUID, HOST_SCHEMA_NAME, {})

            const mapping = await dimxService.syncDIMXCreateMapping(DIMX_ADDON_UUID, HOST_SCHEMA_NAME, recursiveFileExportOutput);

            await dimxResources["base"].resetSchema()
            await dimxResources["host"].resetSchema()
            await dimxResources["reference"].resetSchema()

            const recursiveFileImportOutput: RecursiveImportOutput = await dimxService.SyncDIMXRecursiveFileImport(DIMX_ADDON_UUID, HOST_SCHEMA_NAME, { ...(recursiveFileExportOutput as RecursiveImportInput), Mapping: mapping.Mapping })

            expect(recursiveFileImportOutput, "Resources").to.have.property("Resources").with.lengthOf(2, `Should have resource for ${REFERENCE_SCHEMA_NAME} and ${BASE_SCHEMA_NAME}`)

            const hostURI = recursiveFileImportOutput.URI;
            const referenceURI = recursiveFileImportOutput.Resources.filter((resource) => {
                return resource.Resource === REFERENCE_SCHEMA_NAME;
            })[0].URI;
            const baseURI = recursiveFileImportOutput.Resources.filter((resource) => {
                return resource.Resource === BASE_SCHEMA_NAME;
            })[0].URI;

            const resourcesJson: { [table_name: string]: AddonData[] } = {
                host: await dimxService.DownloadJSONFromURL(hostURI),
                reference: await dimxService.DownloadJSONFromURL(referenceURI),
                base: await dimxService.DownloadJSONFromURL(baseURI)
            }

            // check statuses are inserts
            for (var i = 0; i < resourcesJson["host"].length; i++) {
                expect(resourcesJson["host"][i], 'Status')
                    .to.have.property('Status')
                    .that.is.a('String')
                    .and.is.equal('Insert');
            }
            for (var i = 0; i < resourcesJson["reference"].length; i++) {
                expect(resourcesJson["reference"][i], 'Status')
                    .to.have.property('Status')
                    .that.is.a('String')
                    .and.is.equal('Insert');
            }
            for (var i = 0; i < resourcesJson["base"].length; i++) {
                expect(resourcesJson["base"][i], 'Status')
                    .to.have.property('Status')
                    .that.is.a('String')
                    .and.is.equal('Insert');
            }

            const hostRecordsFromTable: AddonData[] = await dimxResources["host"].getRecords()
            expect(hostRecordsFromTable).to.be.an('array').with.lengthOf(hostTableObjectsToImport.length);

            const referenceRecordsFromTable: AddonData[] = await dimxResources["reference"].getRecords()
            expect(referenceRecordsFromTable).to.be.an('array').with.lengthOf(referenceTableObjectsToImport.length);

            const baseRecordsFromTable: AddonData[] = await dimxResources["base"].getRecords()
            expect(baseRecordsFromTable).to.be.an('array').with.lengthOf(baseTableObjectsToImport.length);

            // check that all was imported correctly
            for (var i = 0; i < hostRecordsFromTable.length; i++) {
                const testedObject = hostRecordsFromTable[i]
                const originalImportedObjectsWithSameKey: AddonData[] = hostTableObjectsToImport.filter((addonData: AddonData) => {
                    return addonData.Key === testedObject.Key;
                });

                expect(originalImportedObjectsWithSameKey).to.be.an('array').with.lengthOf(1);

                const originalImportedObject = originalImportedObjectsWithSameKey[0];

                expect(testedObject, 'StaticReference')
                    .to.have.property('StaticReference')
                    .that.is.a('String')
                    .and.is.equal(originalImportedObject.StaticReference);
                expect(testedObject, 'IsCurrentlyImporting')
                    .to.have.property('IsCurrentlyImporting')
                    .that.is.a('Boolean')
                    .and.is.equal(true);
            }

            for (var i = 0; i < referenceRecordsFromTable.length; i++) {
                const testedObject = referenceRecordsFromTable[i]
                const originalImportedObjectsWithSameKey: AddonData[] = referenceTableObjectsToImport.filter((addonData: AddonData) => {
                    return addonData.Key === testedObject.Key;
                });

                expect(originalImportedObjectsWithSameKey).to.be.an('array').with.lengthOf(1);

                const originalImportedObject = originalImportedObjectsWithSameKey[0];

                expect(testedObject, 'DynamicContainedArray')
                    .to.have.property('DynamicContainedArray')
                    .that.is.an('Array')
                    .and.is.deep.equal(originalImportedObject.DynamicContainedArray);
                expect(testedObject, 'IsCurrentlyImporting')
                    .to.have.property('IsCurrentlyImporting')
                    .that.is.a('Boolean')
                    .and.is.equal(true);
            }

            for (var i = 0; i < baseRecordsFromTable.length; i++) {
                const testedObject = baseRecordsFromTable[i]
                const originalImportedObjectsWithSameKey: AddonData[] = baseTableObjectsToImport.filter((addonData: AddonData) => {
                    return addonData.Key === testedObject.Key;
                });

                expect(originalImportedObjectsWithSameKey).to.be.an('array').with.lengthOf(1);

                const originalImportedObject = originalImportedObjectsWithSameKey[0];

                expect(testedObject, 'BoolProperty')
                    .to.have.property('BoolProperty')
                    .that.is.a('Boolean')
                    .and.is.equal(originalImportedObject.BoolProperty);
                expect(testedObject, 'StringProperty')
                    .to.have.property('StringProperty')
                    .that.is.a('String')
                    .and.is.equal(originalImportedObject.StringProperty);
                expect(testedObject, 'NumberProperty')
                    .to.have.property('NumberProperty')
                    .that.is.a('Number')
                    .and.is.equal(originalImportedObject.NumberProperty);
                expect(testedObject, 'ArrayProperty')
                    .to.have.property('ArrayProperty')
                    .that.is.an('Array')
                    .and.is.deep.equal(originalImportedObject.ArrayProperty);
                expect(testedObject, 'ObjectProperty')
                    .to.have.property('ObjectProperty')
                    .that.is.deep.equal(originalImportedObject.ObjectProperty);
                expect(testedObject, 'IsCurrentlyImporting')
                    .to.have.property('IsCurrentlyImporting')
                    .that.is.a('Boolean')
                    .and.is.equal(true);
            }
        });


        it('recursiveFileImport with mapping and fix: recursively export data from Host table into a file with basic options, reset the adal resources and recursive import back. check that all records that reached the tables are correct. this includes replacing mapped keys and fixing strings', async () => {

            await dimxResources["base"].resetSchema()
            await dimxResources["host"].resetSchema()
            await dimxResources["reference"].resetSchema()

            // add data to all resources
            const OBJECTS_AMOUNT = 5;
            const baseTableObjectsToImport: BaseTableObject[] = generateBaseTableObjects(OBJECTS_AMOUNT * 2, true, true) // there are amount*2 contained objects in the Reference table schema, each contained object holding a reference to Base table
            await dimxResources["base"].upsertBatch(baseTableObjectsToImport)
            const baseTableObjectsToTest: BaseTableObject[] = generateBaseTableObjects(OBJECTS_AMOUNT * 2, true, true, true)

            const hostTableObjectsToImport: HostTableObject[] = generateHostTableObjects(OBJECTS_AMOUNT, true)
            await dimxResources["host"].upsertBatch(hostTableObjectsToImport)
            const hostTableObjectsToTest: HostTableObject[] = generateHostTableObjects(OBJECTS_AMOUNT, true, true)

            const referenceTableObjectsToImport: ReferenceTableObject[] = generateReferenceTableObjects(OBJECTS_AMOUNT, true, true)
            await dimxResources["reference"].upsertBatch(referenceTableObjectsToImport)
            const referenceTableObjectsToTest: ReferenceTableObject[] = generateReferenceTableObjects(OBJECTS_AMOUNT, true, true, true)

            // perform the export and get the data
            const recursiveFileExportOutput: RecursiveExportOutput = await dimxService.SyncDIMXRecursiveFileExport(DIMX_ADDON_UUID, HOST_SCHEMA_NAME, {})

            const mapping = await dimxService.syncDIMXCreateMapping(DIMX_ADDON_UUID, HOST_SCHEMA_NAME, recursiveFileExportOutput);

            await dimxResources["base"].resetSchema()
            await dimxResources["host"].resetSchema()
            await dimxResources["reference"].resetSchema()

            const recursiveFileImportOutput: RecursiveImportOutput = await dimxService.SyncDIMXRecursiveFileImport(DIMX_ADDON_UUID, HOST_SCHEMA_NAME, { ...(recursiveFileExportOutput as RecursiveImportInput), Mapping: mapping.Mapping })

            expect(recursiveFileImportOutput, "Resources").to.have.property("Resources").with.lengthOf(2, `Should have resource for ${REFERENCE_SCHEMA_NAME} and ${BASE_SCHEMA_NAME}`)

            const hostURI = recursiveFileImportOutput.URI;
            const referenceURI = recursiveFileImportOutput.Resources.filter((resource) => {
                return resource.Resource === REFERENCE_SCHEMA_NAME;
            })[0].URI;
            const baseURI = recursiveFileImportOutput.Resources.filter((resource) => {
                return resource.Resource === BASE_SCHEMA_NAME;
            })[0].URI;

            const resourcesJson: { [table_name: string]: AddonData[] } = {
                host: await dimxService.DownloadJSONFromURL(hostURI),
                reference: await dimxService.DownloadJSONFromURL(referenceURI),
                base: await dimxService.DownloadJSONFromURL(baseURI)
            }

            // check statuses are inserts
            for (var i = 0; i < resourcesJson["host"].length; i++) {
                expect(resourcesJson["host"][i], 'Status')
                    .to.have.property('Status')
                    .that.is.a('String')
                    .and.is.equal('Insert');
            }
            for (var i = 0; i < resourcesJson["reference"].length; i++) {
                expect(resourcesJson["reference"][i], 'Status')
                    .to.have.property('Status')
                    .that.is.a('String')
                    .and.is.equal('Insert');
            }
            for (var i = 0; i < resourcesJson["base"].length; i++) {
                expect(resourcesJson["base"][i], 'Status')
                    .to.have.property('Status')
                    .that.is.a('String')
                    .and.is.equal('Insert');
            }

            const hostRecordsFromTable: AddonData[] = await dimxResources["host"].getRecords()
            expect(hostRecordsFromTable).to.be.an('array').with.lengthOf(hostTableObjectsToImport.length);

            const referenceRecordsFromTable: AddonData[] = await dimxResources["reference"].getRecords()
            expect(referenceRecordsFromTable).to.be.an('array').with.lengthOf(referenceTableObjectsToImport.length);

            const baseRecordsFromTable: AddonData[] = await dimxResources["base"].getRecords()
            expect(baseRecordsFromTable).to.be.an('array').with.lengthOf(baseTableObjectsToImport.length);

            // check that all was imported correctly
            for (var i = 0; i < hostRecordsFromTable.length; i++) {
                const testedObject = hostRecordsFromTable[i]
                const originalImportedObjectsWithSameKey: AddonData[] = hostTableObjectsToTest.filter((addonData: AddonData) => {
                    return addonData.Key === testedObject.Key;
                });

                expect(originalImportedObjectsWithSameKey).to.be.an('array').with.lengthOf(1);

                const originalImportedObject = originalImportedObjectsWithSameKey[0];

                expect(testedObject, 'StaticReference')
                    .to.have.property('StaticReference')
                    .that.is.a('String')
                    .and.is.equal(originalImportedObject.StaticReference);
                expect(testedObject, 'IsCurrentlyImporting')
                    .to.have.property('IsCurrentlyImporting')
                    .that.is.a('Boolean')
                    .and.is.equal(true);
            }

            for (var i = 0; i < referenceRecordsFromTable.length; i++) {
                const testedObject = referenceRecordsFromTable[i]
                const originalImportedObjectsWithSameKey: AddonData[] = referenceTableObjectsToTest.filter((addonData: AddonData) => {
                    return addonData.Key === testedObject.Key;
                });

                expect(originalImportedObjectsWithSameKey).to.be.an('array').with.lengthOf(1);

                const originalImportedObject = originalImportedObjectsWithSameKey[0];

                expect(testedObject, 'DynamicContainedArray')
                    .to.have.property('DynamicContainedArray')
                    .that.is.an('Array')
                    .and.is.deep.equal(originalImportedObject.DynamicContainedArray);
                expect(testedObject, 'IsCurrentlyImporting')
                    .to.have.property('IsCurrentlyImporting')
                    .that.is.a('Boolean')
                    .and.is.equal(true);
            }

            for (var i = 0; i < baseRecordsFromTable.length; i++) {
                const testedObject = baseRecordsFromTable[i]
                const originalImportedObjectsWithSameKey: AddonData[] = baseTableObjectsToTest.filter((addonData: AddonData) => {
                    return addonData.Key === testedObject.Key;
                });

                expect(originalImportedObjectsWithSameKey).to.be.an('array').with.lengthOf(1);

                const originalImportedObject = originalImportedObjectsWithSameKey[0];

                expect(testedObject, 'BoolProperty')
                    .to.have.property('BoolProperty')
                    .that.is.a('Boolean')
                    .and.is.equal(originalImportedObject.BoolProperty);
                expect(testedObject, 'StringProperty')
                    .to.have.property('StringProperty')
                    .that.is.a('String')
                    .and.is.equal(originalImportedObject.StringProperty);
                expect(testedObject, 'NumberProperty')
                    .to.have.property('NumberProperty')
                    .that.is.a('Number')
                    .and.is.equal(originalImportedObject.NumberProperty);
                expect(testedObject, 'ArrayProperty')
                    .to.have.property('ArrayProperty')
                    .that.is.an('Array')
                    .and.is.deep.equal(originalImportedObject.ArrayProperty);
                expect(testedObject, 'ObjectProperty')
                    .to.have.property('ObjectProperty')
                    .that.is.deep.equal(originalImportedObject.ObjectProperty);
                expect(testedObject, 'IsCurrentlyImporting')
                    .to.have.property('IsCurrentlyImporting')
                    .that.is.a('Boolean')
                    .and.is.equal(true);
            }
        });

        it('resources cleanup', async () => {
            try {
                await resourceManagerService.cleanup();
            }
            catch (ex) {
                console.error(`dimxTests resources cleanup: ${ex}`);
                throw new Error((ex as { message: string }).message);
            }
        });

    });
}
