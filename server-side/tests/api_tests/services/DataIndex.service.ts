//00000000-0000-0000-0000-00000e1a571c
import {
    FindOptions,
    User,
    PapiClient,
    AddonDataScheme,
    ElasticSearchDocument,
    SearchData,
} from '@pepperi-addons/papi-sdk';

import {GeneralService} from '../../../potentialQA_SDK/src/infra_services/general.service';
// import { GeneralService } from 'test_infra'
import { v4 as uuidv4 } from 'uuid';

type PartialScheme = Omit<AddonDataScheme, "Name" | "Type" | "DataSourceData">;

export interface Connector {
    upsertSchema: (partialScheme: PartialScheme) => Promise<AddonDataScheme>,
    upsertDocument(document: any): any;
    batchUpsertDocuments(documents: any[]): any;
    purgeSchema: () => any;
    getDocuments: (params: FindOptions) => Promise<ElasticSearchDocument[]>;
    postDocument(arg0: {}): unknown;
    search: (requestBody: any) => Promise<ElasticSearchDocument[] | SearchData<ElasticSearchDocument>>;
    getDocumentsFromAbstract: (params: FindOptions) => Promise<ElasticSearchDocument[]>;
    isShared: () => boolean;
}

export class DataIndexService {
    papiClient: PapiClient;
    routerClient: PapiClient;
    generalService: GeneralService;
    dataObject: any; // the 'Data' object passsed inside the http request sent to start the test -- put all the data you need here
    addonUUID: string;
    indexSchema: AddonDataScheme;
    sharedIndexSchema: AddonDataScheme;
    inheritingSchema1: AddonDataScheme;
    inheritingSchema2: AddonDataScheme;
    sharedIndexName: string;

    constructor(public systemService: GeneralService, public addonService: PapiClient, dataObject: any) {
        this.papiClient = systemService.papiClient; // client which will ALWAYS go OUT
        this.generalService = systemService;
        this.routerClient = addonService; // will run according to passed 'isLocal' flag
        this.dataObject = dataObject;
        this.addonUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4";
        this.sharedIndexName = "integration-test-shared-index-" + uuidv4();
        this.indexSchema = {
            Name: "integration-test-regular-index-" + uuidv4(),
            Type: "index"
        }
        console.log("Regular index schema will be called: " + this.indexSchema.Name);
        this.sharedIndexSchema = {
            Name: "integration-test-schema-of-shared-index-" + uuidv4(),
            Type: "shared_index",
            DataSourceData: {
                IndexName: this.sharedIndexName
            }
        }
        console.log("Shared index schema will be called: " + this.sharedIndexSchema.Name);
        this.inheritingSchema1 = {
            Name: "integration-test-schema-of-inheriting-schema-1-" + uuidv4(),
            Type: "shared_index",
            DataSourceData: {
                IndexName: this.sharedIndexName
            }
        }
        this.inheritingSchema2 = {
            Name: "integration-test-schema-of-inheriting-schema-2-" + uuidv4(),
            Type: "shared_index",
            DataSourceData: {
                IndexName: this.sharedIndexName
            }
        }
    }

    indexType = (type: "regular" | "shared" | "inherit1" | "inherit2"): Connector => {
        let baseSchema: AddonDataScheme
        let api: any;
        if (type === "regular") {
            baseSchema = this.indexSchema;
            api = this.papiClient.addons.index;
        } else if (type === "shared") {
            baseSchema = this.sharedIndexSchema;
            api = this.papiClient.addons.shared_index.index.index_name(this.sharedIndexName);
        } else if (type === "inherit1") {
            baseSchema = this.inheritingSchema1;
            api = this.papiClient.addons.shared_index.index.index_name(this.sharedIndexName);
        } else if (type === "inherit2") {
            baseSchema = this.inheritingSchema2;
            api = this.papiClient.addons.shared_index.index.index_name(this.sharedIndexName);
        }
        return {
            upsertSchema: (scheme: PartialScheme) => {
                return this.papiClient.addons.data.schemes
                    .post({ ...scheme, ...baseSchema });
            },
            upsertDocument: (document: any) => {
                return api
                    .uuid(this.addonUUID)
                    .resource(baseSchema.Name)
                    .create(document);
            },
            batchUpsertDocuments: (documents: ElasticSearchDocument[]) => {
                return api
                    .batch({ Objects: documents })
                    .uuid(this.addonUUID)
                    .resource(baseSchema.Name);
            },
            getDocuments: (params: FindOptions): Promise<ElasticSearchDocument[]> => {
                return api
                    .uuid(this.addonUUID)
                    .resource(baseSchema.Name)
                    .find(params);
            },
            postDocument: (body: ElasticSearchDocument): Promise<ElasticSearchDocument[]> => {
                return api
                    .uuid(this.addonUUID)
                    .resource(baseSchema.Name)
                    .create(body);
            },
            search: (requestBody: any): Promise<any> => {
                return api
                    .search(requestBody)
                    .uuid(this.addonUUID)
                    .resource(baseSchema.Name);
            },
            getDocumentsFromAbstract: (params: FindOptions): Promise<ElasticSearchDocument[]> => {
                return api
                    .uuid(this.addonUUID)
                    .resource("abstarcSchemaName")
                    .find(params);
            },
            purgeSchema: () => {
                return this.papiClient
                    .post(`/addons/data/schemes/${baseSchema.Name}/purge`);
            },
            isShared: () => {
                return type === "shared";
            }
        }
    }
}

// export function validateOrderOfResponse(response: ElasticSearchDocument[], orderOfKeys: string[]) {
//     if (response.length === orderOfKeys.length) {
//         let arrayOfKeys = response.map(doc => doc.Key);
//         if (arrayOfKeys.every((val, index) => val === orderOfKeys[index]))
//             return;
//         throw new Error(`Response isn't ordered correctly. Expected: ${orderOfKeys} Got: ${arrayOfKeys}`)
//     }
//     throw new Error(`Response size is incorrect. Expected: ${orderOfKeys.length} Got: ${response.length}`)
// }

export function validateOrderOfResponseBySpecificField(response: ElasticSearchDocument[], fieldName: string, ofTypeBool: boolean = false) {
    let values: any[];
    if (ofTypeBool)
        values = response.map(doc => doc[fieldName] ? 1 : 0);
    else
        values = response.map(doc => doc[fieldName]);
    if (!!values.reduce((n, item) => n !== false && item >= n && item))
        return;
    throw new Error(`Response isn't ordered correctly`);
}
