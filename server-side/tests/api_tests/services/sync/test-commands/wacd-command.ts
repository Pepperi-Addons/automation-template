import { GlobalSyncService } from "../services/global-sync-service";
import { SchemaExistsCommand } from "./schema-exists-command";

export class WACDCommand extends SchemaExistsCommand {


    async sync(): Promise<any> {
        let dateTime = new Date();
        dateTime.setHours(dateTime.getHours()-1)
        // start sync
        let auditLog = await this.syncService.pull({
            ModificationDateTime: dateTime.toISOString(),
        }, false, true, false)
        return auditLog
    }

    test(auditLog: any, syncData: any, expect: Chai.ExpectStatic): Promise<any> {
        expect(syncData.Resources.Data).to.be.an('Array').that.is.not.empty
        for (let metaDataResource of syncData.Resources.Data) {
            // Resource level tests
            expect(metaDataResource).to.have.property('MetaData').that.is.an('Array').and.is.not.undefined
            expect(metaDataResource).to.have.property('Data').that.is.an('Array').and.is.not.undefined
            expect(metaDataResource.MetaData).to.be.an('Array').that.is.not.empty
            // MetaData is an array with only one element
            expect(metaDataResource.MetaData.length).to.equal(1)
            const mapDataMetaData = metaDataResource.MetaData[0]
            expect(mapDataMetaData).to.have.property('ObjectID.ID').that.is.a('Number').and.is.not.undefined
            expect(mapDataMetaData).to.have.property('Hidden').that.is.a('Boolean').and.is.not.undefined
            expect(mapDataMetaData).to.have.property('Key1Type').that.is.a('Number').and.is.not.undefined
            expect(mapDataMetaData).to.have.property('Key2Type').that.is.a('Number').and.is.not.undefined
            expect(mapDataMetaData).to.have.property('ExternalID').that.is.a('String').and.is.not.undefined
            expect(mapDataMetaData).to.have.property('Configuration').that.is.a('String').and.is.not.undefined
            // test that configuration is a valid JSON
            expect(GlobalSyncService.isValidJSON(mapDataMetaData.Configuration)).to.be.true


            // MapData level tests - Data may be empty or with multiple elements
            expect(metaDataResource.Data).to.be.an('Array')
            for (let mapData of metaDataResource.Data) {
                expect(mapData).to.have.property('Key1').that.is.a('String').and.is.not.undefined
                expect(mapData).to.have.property('Key2').that.is.a('String').and.is.not.undefined
                expect(mapData).to.have.property('Values').that.is.a('String').and.is.not.undefined
                expect(mapData).to.have.property('Hidden').that.is.a('Boolean').and.is.not.undefined
                expect(mapData).to.have.property('MapDataMetaData.ObjectID.ID').that.is.a('Number').and.is.not.undefined
                expect(mapData).to.have.property('ObjectID.ID').that.is.a('Number').and.is.not.undefined
                // test that values is a valid JSON
                expect(GlobalSyncService.isValidJSON(mapData.Values)).to.be.true
            }
        }
        return Promise.resolve()
    }

}
// example of wacd sync result
/*
{
    "ResourcesData": [
        {
            "MetaData": [
                {
                    "ObjectID.ID": 766215186,
                    "Hidden": false,
                    "Key1Type": 0,
                    "Key2Type": 0,
                    "ExternalID": "CPI_Data_0e2ae61b-a26a-4c26-81fe-13bdd2e4aaa3_editors",
                    "Configuration": "{\"Dormant\":false,\"Volatile\":false,\"Putable\":true}"
                }
            ],
            "Data": [
                {
                    "Key1": "",
                    "Key2": "69188845-ccf0-40f2-96e4-dbdb8423923f",
                    "Values": "{\"ModificationDateTime\":\"2023-02-05T08:13:40.567Z\",\"Resource\":{\"Name\":\"TestingUDC\",\"AddonUUID\":\"122c0e9d-c240-4865-b446-f37ece866c22\"},\"CreationDateTime\":\"2023-02-05T07:04:14.706Z\",\"Description\":\"\",\"ReferenceFields\":[{\"Resource\":\"users\",\"SelectionList\":\"users\",\"SelectionType\":\"SelectionList\",\"SelectionListKey\":\"23ad27fc-d9b5-4dee-9a23-5517726eff9d\",\"FieldID\":\"user\"}],\"Hidden\":false,\"Name\":\"vladiEditor\"}",
                    "Hidden": false,
                    "MapDataMetaData.ObjectID.ID": 766215186,
                    "ObjectID.ID": 2132488944
                },
                {
                    "Key1": "",
                    "Key2": "957e456c-d2bb-4b82-a615-088467c69249",
                    "Values": "{\"ModificationDateTime\":\"2023-01-30T10:37:36.035Z\",\"Resource\":{\"Name\":\"EyalTest\",\"AddonUUID\":\"122c0e9d-c240-4865-b446-f37ece866c22\"},\"CreationDateTime\":\"2023-01-30T10:31:41.319Z\",\"Description\":\"\",\"ReferenceFields\":[{\"Resource\":\"users\",\"DisplayField\":\"Email\",\"SelectionType\":\"DropDown\",\"FieldID\":\"eyalTestUser\"}],\"Hidden\":false,\"Name\":\"EyalTestEditor\"}",
                    "Hidden": false,
                    "MapDataMetaData.ObjectID.ID": 766215186,
                    "ObjectID.ID": 2067537597
                }
            ]
        },
        {
            "MetaData": [
                {
                    "ObjectID.ID": 1740585547,
                    "Hidden": false,
                    "Key1Type": 0,
                    "Key2Type": 0,
                    "ExternalID": "CPI_Data_122c0e9d-c240-4865-b446-f37ece866c22_MySurveyTemplates",
                    "Configuration": "{\"Dormant\":false,\"Volatile\":false,\"Putable\":true}"
                }
            ],
            "Data": []
        },
        {
            "MetaData": [
                {
                    "ObjectID.ID": 1525660598,
                    "Hidden": false,
                    "Key1Type": 0,
                    "Key2Type": 0,
                    "ExternalID": "CPI_Data_0e2ae61b-a26a-4c26-81fe-13bdd2e4aaa3_views",
                    "Configuration": "{\"Dormant\":false,\"Volatile\":false,\"Putable\":true}"
                }
            ],
            "Data": [
                {
                    "Key1": "",
                    "Key2": "ddb4154e-02eb-41d9-897a-ca94ee8ac1fb",
                    "Values": "{\"ModificationDateTime\":\"2023-02-05T07:37:51.047Z\",\"Resource\":{\"Name\":\"TestingUDC\",\"AddonUUID\":\"122c0e9d-c240-4865-b446-f37ece866c22\"},\"CreationDateTime\":\"2023-02-02T15:03:31.120Z\",\"Description\":\"\",\"Hidden\":false,\"Editor\":\"69188845-ccf0-40f2-96e4-dbdb8423923f\",\"Name\":\"VladiViewerTester\"}",
                    "Hidden": false,
                    "MapDataMetaData.ObjectID.ID": 1525660598,
                    "ObjectID.ID": 1087387057
                },
                {
                    "Key1": "",
                    "Key2": "23ad27fc-d9b5-4dee-9a23-5517726eff9d",
                    "Values": "{\"ModificationDateTime\":\"2023-01-30T09:12:48.497Z\",\"Resource\":{\"Name\":\"users\",\"AddonUUID\":\"fc5a5974-3b30-4430-8feb-7d5b9699bc9f\"},\"CreationDateTime\":\"2023-01-30T09:07:48.394Z\",\"Description\":\"\",\"Hidden\":false,\"Name\":\"users\"}",
                    "Hidden": false,
                    "MapDataMetaData.ObjectID.ID": 1525660598,
                    "ObjectID.ID": 2004105462
                },
                {
                    "Key1": "",
                    "Key2": "dcbeb44f-903f-4c97-b85b-c9ef713aa209",
                    "Values": "{\"ModificationDateTime\":\"2023-01-30T10:37:19.123Z\",\"Resource\":{\"Name\":\"EyalTest\",\"AddonUUID\":\"122c0e9d-c240-4865-b446-f37ece866c22\"},\"CreationDateTime\":\"2023-01-30T10:30:55.730Z\",\"Description\":\"\",\"Hidden\":false,\"Editor\":\"957e456c-d2bb-4b82-a615-088467c69249\",\"Name\":\"EyalTestViewer\"}",
                    "Hidden": false,
                    "MapDataMetaData.ObjectID.ID": 1525660598,
                    "ObjectID.ID": 336491435
                },
                {
                    "Key1": "",
                    "Key2": "567b3079-4ca4-45ab-bbcb-1fd3536fdfd9",
                    "Values": "{\"ModificationDateTime\":\"2023-01-30T09:10:39.022Z\",\"Resource\":{\"Name\":\"users\",\"AddonUUID\":\"fc5a5974-3b30-4430-8feb-7d5b9699bc9f\"},\"CreationDateTime\":\"2023-01-30T09:07:49.449Z\",\"Description\":\"\",\"Hidden\":true,\"ExpirationDateTime\":\"2023-03-01T09:10:39.000Z\",\"Name\":\"users\"}",
                    "Hidden": true,
                    "MapDataMetaData.ObjectID.ID": 1525660598,
                    "ObjectID.ID": 1656725291
                }
            ]
        },
    ]
}
*/
