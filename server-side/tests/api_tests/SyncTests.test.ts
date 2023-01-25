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
            const adalService = await syncTestService.getAdalServiceOneField()
            await adalService.upsertRecord(syncTestService.getAddonDataOneField(1))
            dateTime.setHours(dateTime.getHours()-1)
            let auditLog = await syncTestService.callSyncPullAPI(dateTime.toISOString())
            expect(auditLog).to.have.property('UpToDate').that.is.a('Boolean').and.is.equal(false)
            expect(auditLog).to.have.property('ExecutionURI').that.is.a('String').and.is.not.undefined
            let schemes = await syncTestService.getSchemesFromAudit(auditLog)
            adalService.removeResource()
            expect(schemes).to.contain(syncTestService.getScehmaName())
        })
    })
}


// Validate that ADAL object is returned in sync




//  delete object




// check runtime




// connect to CPI side -> get all objects from schema