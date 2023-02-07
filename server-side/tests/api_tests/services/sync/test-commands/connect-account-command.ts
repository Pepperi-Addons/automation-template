import { GlobalSyncService } from "../services/global-sync-service";
import { SystemFilterNone } from "./system-filter-none-command";

export class ConnectAccountCommand extends SystemFilterNone {

    connectedAccountUUID: string = "3b5e29fb-ba1a-44ae-a84f-532028a9a28a";
    
    async sync(): Promise<any> {
        // start sync
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        const systemFilter = this.systemFilterService.getSystemFilter(true, false, this.connectedAccountUUID)
        let auditLog = await this.syncService.pullConnectAccount({
            ModificationDateTime:dateTime.toISOString(),
            ...systemFilter
        },this.connectedAccountUUID)
        return auditLog
    }

    async test(syncRes: any, syncData: any, expect: Chai.ExpectStatic): Promise<any> {
        // tests
        expect(syncRes).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
        expect(syncData).to.have.property('ResourcesData').that.is.a('Array').and.is.not.empty
        expect(syncData.ResourcesData[0]).to.have.property('user_defined_tables').that.is.a('Object').and.is.not.empty
        expect(syncData.ResourcesData[0].user_defined_tables).to.have.property('Headers').that.is.a('Array').and.is.not.empty
        expect(syncData.ResourcesData[0].user_defined_tables).to.have.property('Rows').that.is.a('Object').and.is.not.empty
        expect(syncData.ResourcesData[0].user_defined_tables.Rows).to.have.property('m_Rows').that.is.a('Array').and.is.not.empty
        const rows = syncData.ResourcesData[0].user_defined_tables.Rows.m_Rows
        // rows must have at least one row or more
        expect(rows).to.have.lengthOf.above(0)
        rows.forEach(row => {
            expect(row).to.have.property('ItemArray').that.is.a('Array').and.is.not.empty
            expect(row.ItemArray[0]).to.be.a('String').and.is.not.empty // WrntyID
            expect(row.ItemArray[1]).to.be.a('String').and.is.equal("0") // CreationDateTime
            expect(row.ItemArray[2]).to.be.a('String').and.is.equal("0") // ModificationDateTime
            expect(row.ItemArray[3]).to.be.a('String').and.is.equal("0") // DistributorObjectIDID
            expect(row.ItemArray[4]).to.be.a('String').and.is.oneOf(["True","False"]) // Hidden
            expect(row.ItemArray[5]).to.be.a('String').and.is.not.empty // MapDataMetaDataObjectIDID
            expect(row.ItemArray[6]).to.be.a('String'); // MainKey
            expect(row.ItemArray[7]).to.be.a('String'); // SecondaryKey the object key
            const values = row.ItemArray[8]
            expect(values).to.be.a('String').and.is.not.empty;
            expect(GlobalSyncService.isValidJSON(values)).to.be.true;
            expect(row.ItemArray[9]).to.be.a('String').and.is.equal("0") // WriteToNucleusTime
            expect(row.ItemArray[10]).to.be.a('String').and.is.not.empty // ResolvedWrntyID
        });
        // check the object properties
        const objRow = rows.find(row => JSON.parse(row.ItemArray[8]).hasOwnProperty('Account_Field'))
        const obj = JSON.parse(objRow.ItemArray[8])
        expect(obj).to.have.property('Account_Field').that.is.a('String').and.is.equal(this.connectedAccountUUID)

    }    
}

// connect account result example
/*
{
    "ResourcesData": [
        {
            "user_defined_tables": {
                "Headers": [
                    {
                        "ColumnName": "WrntyID"
                    },
                    {
                        "ColumnName": "CreationDateTime"
                    },
                    {
                        "ColumnName": "ModificationDateTime"
                    },
                    {
                        "ColumnName": "DistributorObjectIDID"
                    },
                    {
                        "ColumnName": "Hidden"
                    },
                    {
                        "ColumnName": "MapDataMetaDataObjectIDID"
                    },
                    {
                        "ColumnName": "MainKey"
                    },
                    {
                        "ColumnName": "SecondaryKey"
                    },
                    {
                        "ColumnName": "Values"
                    },
                    {
                        "ColumnName": "WriteToNucleusTime"
                    },
                    {
                        "ColumnName": "ResolvedWrntyID"
                    }
                ],
                "Rows": {
                    "m_Rows": [
                        {
                            "ItemArray": [
                                "1134760244",
                                "0",
                                "0",
                                "0",
                                "False",
                                "1905656955",
                                "",
                                "02754342-e0b5-4300-b728-a94ea5e0e8f4_Pages",
                                "{\"GenericResource\":false,\"ModificationDateTime\":\"2023-02-07T09:56:28.925Z\",\"SyncData\":{\"Sync\":true},\"CreationDateTime\":\"2023-02-07T09:56:28.925Z\",\"Type\":\"meta_data\",\"Hidden\":false,\"Name\":\"Pages\",\"AddonUUID\":\"02754342-e0b5-4300-b728-a94ea5e0e8f4\"}",
                                "0",
                                "0"
                            ]
                        },
                        {
                            "ItemArray": [
                                "1806103763",
                                "0",
                                "0",
                                "0",
                                "False",
                                "1905656955",
                                "",
                                "122c0e9d-c240-4865-b446-f37ece866c22_SyncTest",
                                "{\"GenericResource\":true,\"ModificationDateTime\":\"2023-02-06T10:04:30.755Z\",\"SyncData\":{\"Sync\":true,\"SyncFieldLevel\":false},\"CreationDateTime\":\"2023-02-06T09:40:35.095Z\",\"UserDefined\":true,\"Fields\":{\"account_uuid\":{\"Type\":\"Resource\",\"Description\":\"\",\"Resource\":\"accounts\",\"ApplySystemFilter\":true,\"Items\":{\"Type\":\"String\",\"Mandatory\":false,\"Description\":\"\"},\"Indexed\":false,\"Mandatory\":false,\"OptionalValues\":[],\"AddonUUID\":\"fc5a5974-3b30-4430-8feb-7d5b9699bc9f\",\"IndexedFields\":{}}},\"Description\":\"\",\"DocumentKey\":{\"Delimiter\":\"@\",\"Type\":\"AutoGenerate\",\"Fields\":[]},\"Type\":\"data\",\"ListView\":{\"Context\":{\"ScreenSize\":\"Tablet\",\"Profile\":{},\"Name\":\"\"},\"Columns\":[{\"Width\":10}],\"Type\":\"Grid\",\"Fields\":[{\"ReadOnly\":true,\"Title\":\"account_uuid\",\"Type\":\"TextBox\",\"FieldID\":\"account_uuid\",\"Mandatory\":false}]},\"Hidden\":false,\"Name\":\"SyncTest\",\"AddonUUID\":\"122c0e9d-c240-4865-b446-f37ece866c22\"}",
                                "0",
                                "0"
                            ]
                        },
                        {
                            "ItemArray": [
                                "462868761",
                                "0",
                                "0",
                                "0",
                                "False",
                                "1905656955",
                                "",
                                "fc5a5974-3b30-4430-8feb-7d5b9699bc9f_account_users",
                                "{\"GenericResource\":true,\"ModificationDateTime\":\"2023-02-06T10:01:43.469Z\",\"SyncData\":{\"Sync\":true,\"Associative\":{\"FieldID1\":\"Account\",\"FieldID2\":\"User\"}},\"CreationDateTime\":\"2023-02-06T10:01:43.469Z\",\"Fields\":{\"Account\":{\"Resource\":\"accounts\",\"Type\":\"Resource\",\"AddonUUID\":\"fc5a5974-3b30-4430-8feb-7d5b9699bc9f\"},\"InternalID\":{\"Type\":\"Integer\",\"Unique\":true},\"User\":{\"Resource\":\"users\",\"Type\":\"Resource\",\"AddonUUID\":\"fc5a5974-3b30-4430-8feb-7d5b9699bc9f\"},\"CreationDateTime\":{\"Type\":\"DateTime\"},\"ModificationDateTime\":{\"Type\":\"DateTime\"},\"Hidden\":{\"Type\":\"Bool\"},\"Key\":{\"Type\":\"String\",\"Unique\":true}},\"Type\":\"papi\",\"Hidden\":false,\"Name\":\"account_users\",\"AddonUUID\":\"fc5a5974-3b30-4430-8feb-7d5b9699bc9f\"}",
                                "0",
                                "0"
                            ]
                        },
                        {
                            "ItemArray": [
                                "403050453",
                                "0",
                                "0",
                                "0",
                                "False",
                                "1905656955",
                                "",
                                "fc5a5974-3b30-4430-8feb-7d5b9699bc9f_accounts",
                                "{\"GenericResource\":true,\"ModificationDateTime\":\"2023-02-06T10:01:37.094Z\",\"SyncData\":{\"Sync\":true},\"CreationDateTime\":\"2023-02-06T10:01:37.094Z\",\"Fields\":{\"TypeDefinitionID\":{\"Type\":\"Integer\"},\"InternalID\":{\"Type\":\"Integer\",\"Unique\":true},\"Discount\":{\"Type\":\"Double\"},\"Email\":{\"Type\":\"String\"},\"ZipCode\":{\"Type\":\"String\"},\"ExternalID\":{\"Type\":\"String\",\"Unique\":true},\"ModificationDateTime\":{\"Type\":\"DateTime\"},\"Latitude\":{\"Type\":\"Double\"},\"City\":{\"Type\":\"String\"},\"Longitude\":{\"Type\":\"Double\"},\"Name\":{\"Type\":\"String\"},\"Type\":{\"Type\":\"String\"},\"CreationDateTime\":{\"Type\":\"DateTime\"},\"Phone\":{\"Type\":\"String\"},\"State\":{\"Type\":\"String\"},\"Note\":{\"Type\":\"String\"},\"Street\":{\"Type\":\"String\"},\"Hidden\":{\"Type\":\"Bool\"},\"Country\":{\"Type\":\"String\"},\"Key\":{\"Type\":\"String\",\"Unique\":true}},\"Type\":\"papi\",\"Hidden\":false,\"Name\":\"accounts\",\"AddonUUID\":\"fc5a5974-3b30-4430-8feb-7d5b9699bc9f\"}",
                                "0",
                                "0"
                            ]
                        },
                        {
                            "ItemArray": [
                                "1707804823",
                                "0",
                                "0",
                                "0",
                                "False",
                                "1905656955",
                                "",
                                "fc5a5974-3b30-4430-8feb-7d5b9699bc9f_catalogs",
                                "{\"GenericResource\":true,\"ModificationDateTime\":\"2023-02-06T10:01:42.899Z\",\"SyncData\":{\"Sync\":true},\"CreationDateTime\":\"2023-02-06T10:01:42.899Z\",\"Fields\":{\"InternalID\":{\"Type\":\"Integer\",\"Unique\":true},\"CreationDateTime\":{\"Type\":\"DateTime\"},\"Description\":{\"Type\":\"String\"},\"TSAImage\":{\"Type\":\"String\",\"Unique\":false},\"ExpirationDate\":{\"Type\":\"DateTime\"},\"IsActive\":{\"Type\":\"Bool\"},\"ExternalID\":{\"Type\":\"String\",\"Unique\":true},\"ModificationDateTime\":{\"Type\":\"DateTime\"},\"Hidden\":{\"Type\":\"Bool\",\"Unique\":false},\"Key\":{\"Type\":\"String\",\"Unique\":true}},\"Type\":\"papi\",\"Hidden\":false,\"Name\":\"catalogs\",\"AddonUUID\":\"fc5a5974-3b30-4430-8feb-7d5b9699bc9f\"}",
                                "0",
                                "0"
                            ]
                        },
                        {
                            "ItemArray": [
                                "1972745282",
                                "0",
                                "0",
                                "0",
                                "False",
                                "1905656955",
                                "",
                                "fc5a5974-3b30-4430-8feb-7d5b9699bc9f_contacts",
                                "{\"GenericResource\":true,\"ModificationDateTime\":\"2023-02-06T10:01:45.511Z\",\"SyncData\":{\"Sync\":true},\"CreationDateTime\":\"2023-02-06T10:01:45.511Z\",\"Fields\":{\"Status\":{\"Type\":\"Integer\"},\"TypeDefinitionID\":{\"Type\":\"Integer\"},\"InternalID\":{\"Type\":\"Integer\",\"Unique\":true},\"Email\":{\"Type\":\"String\"},\"FirstName\":{\"Type\":\"String\"},\"ExternalID\":{\"Type\":\"String\",\"Unique\":true},\"ModificationDateTime\":{\"Type\":\"DateTime\"},\"Mobile\":{\"Type\":\"String\"},\"Role\":{\"Type\":\"String\"},\"CreationDateTime\":{\"Type\":\"DateTime\"},\"Hidden\":{\"Type\":\"Bool\"},\"LastName\":{\"Type\":\"String\",\"Unique\":false},\"Key\":{\"Type\":\"String\",\"Unique\":true}},\"Type\":\"papi\",\"Hidden\":false,\"Name\":\"contacts\",\"AddonUUID\":\"fc5a5974-3b30-4430-8feb-7d5b9699bc9f\"}",
                                "0",
                                "0"
                            ]
                        },
                        {
                            "ItemArray": [
                                "1440526897",
                                "0",
                                "0",
                                "0",
                                "False",
                                "1905656955",
                                "",
                                "fc5a5974-3b30-4430-8feb-7d5b9699bc9f_items",
                                "{\"GenericResource\":true,\"ModificationDateTime\":\"2023-02-06T10:01:39.821Z\",\"SyncData\":{\"Sync\":true},\"CreationDateTime\":\"2023-02-06T10:01:39.821Z\",\"Fields\":{\"InternalID\":{\"Type\":\"Integer\",\"Unique\":true},\"ExternalID\":{\"Type\":\"String\",\"Unique\":true},\"ModificationDateTime\":{\"Type\":\"DateTime\"},\"Prop7\":{\"Type\":\"String\"},\"Prop8\":{\"Type\":\"String\"},\"UPC\":{\"Type\":\"String\"},\"Prop9\":{\"Type\":\"String\"},\"Image\":{\"Type\":\"String\"},\"Prop3\":{\"Type\":\"String\"},\"MainCategory\":{\"Type\":\"String\"},\"Prop4\":{\"Type\":\"String\"},\"Prop5\":{\"Type\":\"String\"},\"Name\":{\"Type\":\"String\"},\"Prop6\":{\"Type\":\"String\"},\"Prop1\":{\"Type\":\"String\"},\"Prop2\":{\"Type\":\"String\"},\"Hidden\":{\"Type\":\"Bool\"},\"CostPrice\":{\"Type\":\"Double\"},\"AllowDecimal\":{\"Type\":\"Bool\"},\"CreationDateTime\":{\"Type\":\"DateTime\"},\"LongDescription\":{\"Type\":\"String\"},\"ParentExternalID\":{\"Type\":\"String\"},\"Price\":{\"Type\":\"Double\"},\"Key\":{\"Type\":\"String\",\"Unique\":true}},\"Type\":\"papi\",\"Hidden\":false,\"Name\":\"items\",\"AddonUUID\":\"fc5a5974-3b30-4430-8feb-7d5b9699bc9f\"}",
                                "0",
                                "0"
                            ]
                        },
                        {
                            "ItemArray": [
                                "1451579513",
                                "0",
                                "0",
                                "0",
                                "False",
                                "1905656955",
                                "",
                                "fc5a5974-3b30-4430-8feb-7d5b9699bc9f_users",
                                "{\"GenericResource\":true,\"ModificationDateTime\":\"2023-02-06T10:01:41.586Z\",\"SyncData\":{\"Sync\":true},\"CreationDateTime\":\"2023-02-06T10:01:41.586Z\",\"Fields\":{\"InternalID\":{\"Type\":\"Integer\",\"Unique\":true},\"CreationDateTime\":{\"Type\":\"DateTime\"},\"Email\":{\"Type\":\"String\"},\"FirstName\":{\"Type\":\"String\"},\"ExternalID\":{\"Type\":\"String\",\"Unique\":true},\"ModificationDateTime\":{\"Type\":\"DateTime\"},\"Hidden\":{\"Type\":\"Bool\"},\"LastName\":{\"Type\":\"String\"},\"Mobile\":{\"Type\":\"String\"},\"Key\":{\"Type\":\"String\",\"Unique\":true}},\"Type\":\"papi\",\"Hidden\":false,\"Name\":\"users\",\"AddonUUID\":\"fc5a5974-3b30-4430-8feb-7d5b9699bc9f\"}",
                                "0",
                                "0"
                            ]
                        }
                    ]
                }
            }
        }
    ],
    "ResourcesContentLength": 7975
}

*/