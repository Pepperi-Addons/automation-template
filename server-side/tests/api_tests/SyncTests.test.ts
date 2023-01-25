import GeneralService, { TesterFunctions } from "../../potentialQA_SDK/server_side/general.service";
import { ResourceManagerService } from "./services/resource_management/resource_manager.service";
import { Account, AddonData, AddonDataScheme, PapiClient, User } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "./services/resource_management/adal_table.service";
import { SyncTestService } from "./services/SyncTests.service";
import { Client } from "@pepperi-addons/debug-server/dist";
import { performance } from "perf_hooks";

// create ADAL Object

export async function SyncTests(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions) {
    const describe = tester.describe;
    const expect = tester.expect;
    const it = tester.it;
    const dataObj = request.body.Data;

    describe("SyncTests Suites",async()=>{
        const client: Client = generalService['client']
        const addonUUID = "5122dc6d-745b-4f46-bb8e-bd25225d350a";
        const syncTestService = new SyncTestService(client)
        const papiClient = addonService.papiClient; 
        let dateTime = new Date()

        it('baseSyncTest', async () => {
            // creating adal schema and inserting single record
            const adalService = await syncTestService.getAdalServiceOneField()
            await adalService.upsertRecord(syncTestService.getAddonDataOneField(1))
            // setting modification date time to an hour back for sync testing
            dateTime.setHours(dateTime.getHours()-1)
            // calling sync api endpoint
            let auditLog = await syncTestService.callSyncPullAPI(dateTime.toISOString())
            // expecting to have up to date which is false due to the record that was inserted
            //  expecting execution uri - has the data of the sync action
            expect(auditLog).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
            expect(auditLog).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined
            // using execution uri getting the data that was updated in sync
            let schemes = await syncTestService.getSchemesFromAudit(auditLog)
            // dropping adal scheme - for cleanup purposes
            adalService.removeResource()
            // validating that the created schema is in the sync schemes that was updated
            expect(schemes).to.contain(syncTestService.getScehmaName())
        })

        it('futureDate',async()=>{
            // adding 10 years to current date for future date validation
            dateTime.setFullYear(dateTime.getFullYear()+10)
            // checking performance - check time before and after sync request
            const t1 = performance.now()
            let res =  await syncTestService.callSyncPullAPI(dateTime.toISOString())
            const t2 = performance.now()
            // expecting the future date to take less than 5s
            expect(t2-t1).to.be.a('Number').and.to.be.lessThanOrEqual(5000)
            // expecting up to date will be true - there are no records with future time
            expect(res).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(true)
        })

        it('returnURLTest', async () => {
            // creating scheme and record in adal
            const adalService = await syncTestService.getAdalServiceOneField()
            await adalService.upsertRecord(syncTestService.getAddonDataOneField(1))
            // resetting date and changing to previous hour
            dateTime = new Date()
            dateTime.setHours(dateTime.getHours()-1)
            // calling sync pull endpoint and requesting to have a file of changes
            let auditLog = await syncTestService.callReturnUrlAPI(dateTime.toISOString())
            // validating that the file url is returned
            expect(auditLog).to.have.property('ResourcesURL').that.is.a('String').and.is.not.undefined
            let schemes = await syncTestService.getReturnUrlFromAudit(auditLog)
            // cleanup
            adalService.removeResource()
            // validating that the created schema in the file that was received 
            expect(schemes).to.contain(syncTestService.getScehmaName())
        })

    })

}
