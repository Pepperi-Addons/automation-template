import { ResourceManagerService } from "./services/resource_management/resource_manager.service";
import GeneralService, { TesterFunctions } from "../../potentialQA_SDK/server_side/general.service";
import { Account, AddonData, AddonDataScheme, PapiClient, User } from "@pepperi-addons/papi-sdk";
import { ADALTableService } from "./services/resource_management/adal_table.service";
import { SyncTestService } from "./services/SyncTests.service";
import { Client } from "@pepperi-addons/debug-server/dist";
import { performance } from "perf_hooks";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

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
            // initializing adal schema with data, first property is number of fields
            // second propety is number of characters in each field
            let adalTable = await syncTestService.initAdalTable(1,1)
            // sleeping for the changes to apply and sync wont be up to date
            generalService.sleep(3000)
            dateTime.setHours(dateTime.getHours()-1)
            // calling sync api endpoint
            let syncRes = await syncTestService.callSyncPullAPI(dateTime.toISOString())
            // expecting to have up to date which is false due to the record that was inserted
            //  expecting execution uri - has the data of the sync action
            expect(syncRes).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
            expect(syncRes).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined
            // getting result from audit log - From Execution URI
            let auditLog = await syncTestService.getAuditLogData(syncRes)
            // using execution uri getting the data that was updated in sync
            let schemes = await syncTestService.getSchemesFromAudit(auditLog)
            expect(schemes).to.contain(syncTestService.scehmaName)
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
            let adalTable = await syncTestService.initAdalTable(1,1)
            generalService.sleep(500)
            // resetting date and changing to previous hour
            dateTime = new Date()
            dateTime.setHours(dateTime.getHours()-1)
            // calling sync pull endpoint and requesting to have a file of changes
            let auditLog = await syncTestService.callReturnUrlAPI(dateTime.toISOString())
            // validating that the file url is returned
            expect(auditLog).to.have.property('ResourcesURL').that.is.a('String').and.is.not.undefined
            let schemes = await syncTestService.getSchemesFromUrl(auditLog)
            // validating that the created schema in the file that was received 
            expect(schemes).to.contain(syncTestService.scehmaName)
        })

        it('SystemFilter Type=None',async()=>{
            let accounts = await syncTestService.initAdalAccountRefTable()
            let users = await syncTestService.initAdalUserTable()
            await sleep(5000);
            let systemFilter = syncTestService.getSystemFilter(true,false)
            dateTime.setHours(dateTime.getHours()-1)
            let syncRes = await syncTestService.callSyncPullAPI(dateTime.toISOString(),systemFilter)
            expect(syncRes).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
            expect(syncRes).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined
            let auditLog = await syncTestService.getAuditLogData(syncRes)
            console.log(auditLog)
        })

        it('cleanup', async() =>{
            await syncTestService.cleanup()
        })

        
    })
    
}
