import { expect } from 'chai';
import { Connector, validateOrderOfResponseBySpecificField, validateOrderOfResponseByArrayOfKeys } from './services/DataIndex.service';
import { PapiClient, SearchBody } from '@pepperi-addons/papi-sdk';
//00000000-0000-0000-0000-00000e1a571c
import { DataIndexService } from "./services/DataIndex.service";
// import { GeneralService, TesterFunctions } from 'test_infra';
import { GeneralService, TesterFunctions } from "../../potentialQA_SDK/src/infra_services/general.service";
// import {GeneralSer} from 'tests';


export async function DataIndex(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions) {
    const dataObj = request.body.Data; // the 'Data' object passed inside the http request sent to start the test -- put all the data you need here
    const service = new DataIndexService(generalService, addonService.papiClient, dataObj);
    const describe = tester.describe;
    const expect = tester.expect;
    const it = tester.it;

    describe('Index Tests:', async () => {
        let connector = service.indexType("regular");
        baseTester(it, expect, connector, generalService);
    });

    describe('Shared-Index Tests:', async () => {
        let connector = service.indexType("shared");
        baseTester(it, expect, connector, generalService);
    });

    describe('Abstract Index Tests:', async () => {
        let connector1 = service.indexType("inherit1");
        let connector2 = service.indexType("inherit2");
        abstractTester(it, expect, connector1, connector2, generalService);
    });
}

function baseTester(it: any, expect, connector: Connector, generalService: GeneralService) {
    it(`Index Creation`, async () => {
        await connector.upsertSchema({
            "Fields": {
                "string_field": {
                    "Type": "String",
                    "Indexed": true
                },
                "bool_field": {
                    "Type": "Bool",
                    "Indexed": true
                },
                "int_field": {
                    "Type": "Integer",
                    "Indexed": true
                },
                "double_field": {
                    "Type": "Double",
                    "Indexed": true
                },
                "date_field": {
                    "Type": "DateTime",
                    "Indexed": true
                },
                "unindexed_field": {
                    "Type": "String",
                    "Indexed": false
                },
                "name.Key": {
                    "Type": "String",
                    "Indexed": true
                },
                "name.first": {
                    "Type": "String",
                    "Indexed": true
                },
                "name.last": {
                    "Type": "String",
                    "Indexed": true
                }
            }
        });
    });

    it("Batch upsert one document (writeMode = Insert)", async () => {
        let diResponse = await connector.batchUpsertDocuments(
            [{
                Key: "6",
                string_field: "Shani Kimbell",
                bool_field: false,
                int_field: 5,
                double_field: 10.0,
                date_field: "2022-11-24T12:42:32.166Z",
                unindexed_field: "shouldn't be indexed",
                "name.Key": "60",
                "name.first": "Shani",
                "name.last": "Kimbell"
            }],
            "Insert"
        );
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(1);
        expect(diResponse[0], "First response status").to.be.an('object').that.has.property('Status').that.equals('Insert');
    })

    it("Batch upsert a document thats already exist (writeMode = Insert)", async () => {
        let diResponse = await connector.batchUpsertDocuments(
            [{
                Key: "6",
                string_field: "Shani Kimbell",
                bool_field: false,
                int_field: 5,
                double_field: 10.0,
                date_field: "2022-11-24T12:42:32.166Z",
                unindexed_field: "shouldn't be indexed",
                "name.Key": "60",
                "name.first": "Shani",
                "name.last": "Kimbell"
            }],
            "Insert"
        );
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(1);
        expect(diResponse[0], "First response status").to.be.an('object').that.has.property('Status').that.equals('Error');
    })

    it("Batch upsert one document (writeMode = Merge)", async () => {
        let diResponse = await connector.batchUpsertDocuments(
            [{
                Key: "5",
                string_field: "Susann Kimbell",
                bool_field: true,
                int_field: 2,
                double_field: 8.4,
                date_field: "2022-11-24T12:44:32.166Z",
                unindexed_field: "shouldn't be indexed",
                "name.Key": "50",
                "name.first": "Susann",
                "name.last": "Kimbell"
            }],
            "Merge"
        );
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(1);
        expect(diResponse[0], "First response status").to.be.an('object').that.has.property('Status').that.equals('Insert');
    })

    it("Batch upsert a document thats already exist (writeMode = Merge)", async () => {
        let diResponse = await connector.batchUpsertDocuments(
            [{
                Key: "5",
                string_field: "Susann Kimbell",
                bool_field: true,
                int_field: 2,
                double_field: 8.4,
                date_field: "2022-11-24T12:44:32.166Z",
                unindexed_field: "shouldn't be indexed",
                "name.Key": "50",
                "name.first": "Susann",
                "name.last": "Kimbell"
            }],
            "Merge"
        );
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(1);
        expect(diResponse[0], "First response status").to.be.an('object').that.has.property('Status').that.equals('Ignore');
    })

    it("Batch upsert a document thats already exist with a change (writeMode = Merge)", async () => {
        let diResponse = await connector.batchUpsertDocuments(
            [{
                Key: "5",
                string_field: "Susann Kimbell",
                bool_field: true,
                int_field: 3,
                double_field: 8.4,
                date_field: "2022-11-24T12:44:32.166Z",
                unindexed_field: "shouldn't be indexed",
                "name.Key": "50",
                "name.first": "Susann",
                "name.last": "Kimbell"
            }],
            "Merge"
        );
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(1);
        expect(diResponse[0], "First response status").to.be.an('object').that.has.property('Status').that.equals('Update');
    })

    it("Batch upsert one document (writeMode = Overwrite)", async () => {
        let diResponse = await connector.batchUpsertDocuments(
            [{
                Key: "4",
                string_field: "Shani Silvano",
                bool_field: false,
                int_field: 1,
                double_field: 2.3,
                date_field: "2022-11-24T12:46:32.166Z",
                unindexed_field: "shouldn't be indexed",
                "name.Key": "40",
                "name.first": "Shani",
                "name.last": "Silvano"
            }],
            "Overwrite"
        );
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(1);
        expect(diResponse[0], "First response status").to.be.an('object').that.has.property('Status').that.equals('Insert');
    })

    it("Batch upsert a document thats already exist (writeMode = Overwrite)", async () => {
        let diResponse = await connector.batchUpsertDocuments(
            [{
                Key: "4",
                string_field: "Shani Silvano",
                bool_field: false,
                int_field: 1,
                double_field: 2.3,
                date_field: "2022-11-24T12:46:32.166Z",
                unindexed_field: "shouldn't be indexed",
                "name.Key": "40",
                "name.first": "Shani",
                "name.last": "Silvano"
            }],
            "Overwrite"
        );
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(1);
        expect(diResponse[0], "First response status").to.be.an('object').that.has.property('Status').that.equals('Update');
    })

    it(`Create Documents`, async () => {
        await connector.batchUpsertDocuments([
            {
                Key: "1",
                string_field: "Susann Renato",
                bool_field: true,
                int_field: 6,
                double_field: 9.5,
                date_field: "2022-11-24T12:43:32.166Z",
                unindexed_field: "shouldn't be indexed",
                "name.Key": "10",
                "name.first": "Susann",
                "name.last": "Renato"
            },
            {
                Key: "2",
                string_field: "Jessika Renato",
                bool_field: false,
                int_field: 4,
                double_field: 6.2,
                date_field: "2022-11-24T12:45:32.166Z",
                unindexed_field: "shouldn't be indexed",
                "name.Key": "20",
                "name.first": "Jessika",
                "name.last": "Renato"
            },
            {
                Key: "3",
                string_field: "Jessika Silvano",
                bool_field: true,
                int_field: 2,
                double_field: 1.5,
                date_field: "2022-11-24T12:47:32.166Z",
                unindexed_field: "shouldn't be indexed",
                "name.Key": "30",
                "name.first": "Jessika",
                "name.last": "Silvano"
            }
        ]);
    })

    it("Get all documents ordered by Key", async () => {
        let diResponse = await connector.getDocuments({
            order_by: "Key"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(6);
        validateOrderOfResponseBySpecificField(diResponse, "Key");
    })

    it("Get all documents ordered by string_field", async () => {
        let diResponse = await connector.getDocuments({
            order_by: "string_field"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(6);
        validateOrderOfResponseBySpecificField(diResponse, "string_field");
    })

    it("Get all documents ordered by string_field ASC", async () => {
        let diResponse = await connector.getDocuments({
            order_by: "string_field ASC"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(6);
        validateOrderOfResponseBySpecificField(diResponse, "string_field");
    })

    it("Get all documents ordered by string_field DESC", async () => {
        let diResponse = await connector.getDocuments({
            order_by: "string_field DESC"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(6);
        validateOrderOfResponseBySpecificField(diResponse.reverse(), "string_field");
    })

    it("Get all documents ordered by bool_field", async () => {
        let diResponse = await connector.getDocuments({
            order_by: "bool_field"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(6);
        validateOrderOfResponseBySpecificField(diResponse, "bool_field", true);
    })

    it("Get all documents ordered by int_field", async () => {
        let diResponse = await connector.getDocuments({
            order_by: "int_field"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(6);
        validateOrderOfResponseBySpecificField(diResponse, "int_field");
    })

    it("Get all documents ordered by double_field", async () => {
        let diResponse = await connector.getDocuments({
            order_by: "double_field"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(6);
        validateOrderOfResponseBySpecificField(diResponse, "double_field");
    })

    it("Get all documents ordered by date_field", async () => {
        let diResponse = await connector.getDocuments({
            order_by: "date_field"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(6);
        validateOrderOfResponseBySpecificField(diResponse, "date_field");
    })

    it("Get all documents that string_field starts with \"Susann\"", async () => {
        let diResponse = await connector.getDocuments({
            where: "string_field like 'Susann%'"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(2);
    })

    it("Get all documents that string_field end with \"Kimbell\"", async () => {
        let diResponse = await connector.getDocuments({
            where: "string_field like '%Kimbell'"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(2);
    })

    // DI-22093
    it("Get all documents that string_field doesn't end with \"Kimbell\" (using not)", async () => {
        let diResponse = await connector.getDocuments({
            where: "string_field not like '%Kimbell'"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(4);
    })

    it("Get all documents that int_field is greater then 4", async () => {
        let diResponse = await connector.getDocuments({
            where: "int_field > 4"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(2);
    })

    it("Get all documents that int_field is lesser then 4", async () => {
        let diResponse = await connector.getDocuments({
            where: "int_field < 4"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(3);
    })

    it("Get all documents that int_field is in range", async () => {
        let diResponse = await connector.getDocuments({
            where: "int_field >= 2 and int_field <= 5"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(4);
    })

    it("Get all documents that int_field out of range (using or)", async () => {
        let diResponse = await connector.getDocuments({
            where: "int_field < 2 or int_field > 5"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(2);
    })

    // it("Get all documents that int_field not equal 4 (using not and equal)", async () => {
    //     let diResponse = await connector.getDocuments({
    //         where: "not int_field = 4"
    //     });
    //     expect(diResponse, "Response array").to.be.an('array').with.lengthOf(5);
    // })

    it("Get all documents that int_field not equal 4 (using !=)", async () => {
        let diResponse = await connector.getDocuments({
            where: "int_field != 4"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(5);
    })

    // it("Get all documents that int_field out of range (using nand)", async () => {
    //     let diResponse = await connector.getDocuments({
    //         where: "not (int_field >= 2 and int_field <= 5)"
    //     });
    //     expect(diResponse, "Response array").to.be.an('array').with.lengthOf(2);
    // })

    // DI-22092
    it("Get all documents that int_field not in list (using not in)", async () => {
        let diResponse = await connector.getDocuments({
            where: "int_field not in (1,3,5)"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(3);
    })

    it("Get all documents that string_field not in list (using not in)", async () => {
        let diResponse = await connector.getDocuments({
            where: "string_field not in ('Susann Renato', 'Jessika Silvano')"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(4);
    })

    // Tests bug DI-22388
    it("Get all documents that name.first is Shani", async () => {
        let diResponse = await connector.getDocuments({
            where: "name.first='Shani'"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(2);
    })

    // DI-21958
    it("Validate that strings are mapped as keywords (by doing aggregations on them)", async () => {
        let diResponse = await connector.search({
            "aggs": {
                "my-agg-name": {
                    "terms": {
                        "field": "name.first"
                    }
                }
            }
        });
        expect(diResponse, "Raw response").to.have.property("aggregations");
        expect(diResponse["aggregations"], "Response aggregations").to.have.property("my-agg-name");
        expect(diResponse["aggregations"]["my-agg-name"], "Response specific aggregation").to.have.property("buckets");
        expect(diResponse["aggregations"]["my-agg-name"]["buckets"], "Response buckets").to.be.an('array').with.lengthOf(3);
    })

    // DI-22639
    it("Validate that DSL queries can be sent wrapped in a property called \"DSL\"", async () => {
        let diResponse = await connector.search({
            DSL: {
                "aggs": {
                    "my-agg-name": {
                        "terms": {
                            "field": "name.first"
                        }
                    }
                }
            }
        });
        expect(diResponse, "Raw response").to.have.property("aggregations");
        expect(diResponse["aggregations"], "Response aggregations").to.have.property("my-agg-name");
        expect(diResponse["aggregations"]["my-agg-name"], "Response specific aggregation").to.have.property("buckets");
        expect(diResponse["aggregations"]["my-agg-name"]["buckets"], "Response buckets").to.be.an('array').with.lengthOf(3);
    })

    // Tests bug DI-22498
    it("Get document by reference field (name='10')", async () => {
        let diResponse = await connector.getDocuments({
            where: "name='10'"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(1);
    })

    it("Update a document", async () => {
        await connector.postDocument({
            Key: "6",
            string_field: "Alex Holland",
            bool_field: true,
            int_field: 15,
            double_field: 59.7,
            date_field: "2022-12-24T12:42:32.166Z",
            unindexed_field: "shouldn't be indexed",
            "name.first": "Alex",
            "name.last": "Holland"
        });
        generalService.sleep(5000);
    })

    it("Get document by first name after update (validate that update of reference works)", async () => {
        let diResponse = await connector.getDocuments({
            where: "name.first='Alex'"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(1);
    })

    // DI-22639
    it("Search for a specific document using the \"search\" endpoint", async () => {
        let diResponse = await connector.search({
            Where: "name.first='Alex'"
        });
        expect(diResponse, "Response body").to.be.an('object').with.property("Objects");
        expect(diResponse["Objects"], "Response array").to.be.an('array').with.lengthOf(1);
        expect(diResponse["Objects"][0], "Response first result").to.be.an('object').with.property("name.first").to.equal("Alex");
        // DI-22614: Validate response doesn't include ElasticSearchType
        expect(diResponse["Objects"][0], "Response first result").to.be.an('object').not.with.property("ElasticSearchType");
    })

    it("Search for documents using the \"search\" endpoint passing anything but \"Where\"", async () => {
        let searchBody: SearchBody & { OrderBy?: string } = {
            Fields: ["name.first", "name.last", "string_field", "bool_field"],
            Page: 2,
            PageSize: 2,
            IncludeCount: true,
            OrderBy: "int_field"
        };
        let diResponse = await connector.search(searchBody);
        expect(diResponse, "Response body").to.be.an('object').with.property("Objects");
        expect(diResponse, "Response body").to.be.an('object').with.property("Count").to.equal(6);
        expect(diResponse["Objects"], "Response array").to.be.an('array').with.lengthOf(2);
        expect(diResponse["Objects"][0], "Response first result").to.be.an('object').to.include.all.keys("name.first", "name.last", "string_field", "bool_field");
    })

    if (connector.isShared()) {
        // DI-22614
        it("Search documents using the \"search\" endpoint and get ElasticSearchType", async () => {
            let searchBody: SearchBody & { OrderBy?: string } = {
                Fields: ["name.first", "name.last", "string_field", "bool_field", "ElasticSearchType"],
                Page: 2,
                PageSize: 2,
                IncludeCount: true,
                OrderBy: "int_field"
            };
            let diResponse = await connector.search(searchBody);
            expect(diResponse, "Response body").to.be.an('object').with.property("Objects");
            expect(diResponse, "Response body").to.be.an('object').with.property("Count").to.equal(6);
            expect(diResponse["Objects"], "Response array").to.be.an('array').with.lengthOf(2);
            expect(diResponse["Objects"][0], "Response first result").to.be.an('object').to.include.all.keys("name.first", "name.last", "string_field", "bool_field", "ElasticSearchType");
        })
    }

    // adding some documents in order to test DI-23847
    it(`Create More Documents`, async () => {
        await connector.batchUpsertDocuments([
            {
                Key: "7",
                string_field: "Susann Renato",
                bool_field: true,
                int_field: 6,
                double_field: 9.5,
                date_field: "2022-11-24T12:43:32.166Z",
                unindexed_field: "shouldn't be indexed",
                "name.Key": "10",
                "name.first": "Susann",
                "name.last": "Renato"
            },
            {
                Key: "8",
                string_field: "Jessika Renato",
                bool_field: false,
                int_field: 4,
                double_field: 6.2,
                date_field: "2022-11-24T12:45:32.166Z",
                unindexed_field: "shouldn't be indexed",
                "name.Key": "20",
                "name.first": "Jessika",
                "name.last": "Renato"
            },
            {
                Key: "9",
                string_field: "Jessika Silvano",
                bool_field: true,
                int_field: 2,
                double_field: 1.5,
                date_field: "2022-11-24T12:47:32.166Z",
                unindexed_field: "shouldn't be indexed",
                "name.Key": "30",
                "name.first": "Jessika",
                "name.last": "Silvano"
            }
        ]);
    });

    // Validate order_by with multiple fields works (DI-23847)
    it("Get all documents ordered by int_field and Key", async () => {
        let diResponse = await connector.getDocuments({
            order_by: "int_field,Key"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(9);
        validateOrderOfResponseByArrayOfKeys(diResponse, ['4', '3', '9', '5', '2', '8', '1', '7', '6']);
    });

    // Validate order_by with multiple fields works (DI-23847)
    it("Get all documents ordered by int_field and Key (where Key is desc)", async () => {
        let diResponse = await connector.getDocuments({
            order_by: "int_field,Key desc"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(9);
        validateOrderOfResponseByArrayOfKeys(diResponse, ['4', '9', '3', '5', '8', '2', '7', '1', '6']);
    });

    // Validate delete_by_query with empty query fails (DI-23926)
    it("Try delete_by_query with empty query", async () => {
        try {
            let diResponse = await connector.deleteByQuery({});
            throw new Error(`delete_by_query with empty query should fail, succeeded with response - ${JSON.stringify(diResponse)}`);
        } catch (err) {
            if (err instanceof Error && err.message.includes("Query is required")) {
                // success
                return;
            }
            throw err;
        }
    });

    // Validate delete_by_query with empty query didn't delete anything (DI-23926)
    it("Validate delete_by_query with empty query didn't delete anything", async () => {
        let diResponse = await connector.getDocuments({});
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(9);
    })

    it("Try delete_by_query for all documents where int_field == 4", async () => {
        let diResponse = await connector.deleteByQuery({
            query: { match: { int_field: 4 } }
        });
        console.log("delete_by_query response: " + JSON.stringify(diResponse));
        generalService.sleep(5000);
    });

    it("Validate delete_by_query for all documents where int_field == 4 succeeded", async () => {
        let diResponse = await connector.getDocuments({});
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(7);
    })

    it(`Index Purge`, async () => {
        await connector.purgeSchema();
    });
}

function abstractTester(it: any, expect: Chai.ExpectStatic, connector1: Connector, connector2: Connector, generalService: GeneralService) {
    it(`First Schema Creation`, async () => {
        await connector1.upsertSchema({
            "Fields": {
                "string_field": {
                    "Type": "String",
                    "Indexed": true
                },
                "bool_field": {
                    "Type": "Bool",
                    "Indexed": true
                },
                "int_field": {
                    "Type": "Integer",
                    "Indexed": true
                },
                "double_field": {
                    "Type": "Double",
                    "Indexed": true
                },
                "date_field": {
                    "Type": "DateTime",
                    "Indexed": true
                },
                "unindexed_field": {
                    "Type": "String",
                    "Indexed": false
                }
            }
        });
    });

    it(`Second Schema Creation`, async () => {
        await connector2.upsertSchema({
            "Fields": {
                "string_field": {
                    "Type": "String",
                    "Indexed": true
                },
                "bool_field": {
                    "Type": "Bool",
                    "Indexed": true
                },
                "int_field": {
                    "Type": "Integer",
                    "Indexed": true
                },
                "double_field": {
                    "Type": "Double",
                    "Indexed": true
                },
                "date_field": {
                    "Type": "DateTime",
                    "Indexed": true
                },
                "unindexed_field": {
                    "Type": "String",
                    "Indexed": false
                }
            }
        });
    });

    it(`Create Documents`, async () => {
        await connector1.batchUpsertDocuments([
            {
                Key: "1",
                string_field: "Susann Renato",
                bool_field: true,
                int_field: 6,
                double_field: 9.5,
                date_field: "2022-11-24T12:43:32.166Z",
                unindexed_field: "shouldn't be indexed",
                ElasticSearchSuperTypes: ["abstarcSchemaName"]
            },
            {
                Key: "2",
                string_field: "Jessika Renato",
                bool_field: false,
                int_field: 4,
                double_field: 6.2,
                date_field: "2022-11-24T12:45:32.166Z",
                unindexed_field: "shouldn't be indexed",
                ElasticSearchSuperTypes: ["abstarcSchemaName"]
            },
            {
                Key: "3",
                string_field: "Jessika Silvano",
                bool_field: true,
                int_field: 2,
                double_field: 1.5,
                date_field: "2022-11-24T12:47:32.166Z",
                unindexed_field: "shouldn't be indexed",
                ElasticSearchSuperTypes: ["abstarcSchemaName"]
            }
        ]);
        await connector2.batchUpsertDocuments([
            {
                Key: "4",
                string_field: "Shani Silvano",
                bool_field: false,
                int_field: 1,
                double_field: 2.3,
                date_field: "2022-11-24T12:46:32.166Z",
                unindexed_field: "shouldn't be indexed",
                ElasticSearchSuperTypes: ["abstarcSchemaName"]
            },
            {
                Key: "5",
                string_field: "Susann Kimbell",
                bool_field: true,
                int_field: 3,
                double_field: 8.4,
                date_field: "2022-11-24T12:44:32.166Z",
                unindexed_field: "shouldn't be indexed",
                ElasticSearchSuperTypes: ["abstarcSchemaName"]
            },
            {
                Key: "6",
                string_field: "Shani Kimbell",
                bool_field: false,
                int_field: 5,
                double_field: 10.0,
                date_field: "2022-11-24T12:42:32.166Z",
                unindexed_field: "shouldn't be indexed",
                ElasticSearchSuperTypes: ["abstarcSchemaName"]
            }
        ]);
    });

    // DI-21565 + Tests bug DI-22195
    it("Get all documents from both schemas", async () => {
        let diResponse = await connector1.getDocumentsFromAbstract({});
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(6);
    })

    // DI-21886
    it("Get all documents with ElasticSearchType", async () => {
        let diResponse = await connector1.getDocumentsFromAbstract({
            fields: ["Key", "ElasticSearchType"],
            order_by: "Key"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(6);
        expect(diResponse[0], "First result").to.have.a.property("ElasticSearchType");
    })

    // Tests bug DI-22087
    it("Get all documents of sub schema (with OR statement)", async () => {
        let diResponse = await connector1.getDocuments({
            where: "bool_field=true OR bool_field=false"
        });
        expect(diResponse, "Response array").to.be.an('array').with.lengthOf(3);
    })

    it(`Schemas Purge`, async () => {
        await connector1.purgeSchema();
        await connector2.purgeSchema();
    });
}
