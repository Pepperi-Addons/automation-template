//00000000-0000-0000-0000-000000006a91
import { unitTestsResult } from "./services/NebulaTest.service";
import { PerformanceManager } from "./services/performance_management/performance_manager";
import { NebulaServiceFactory } from "./services/NebulaServiceFactory";
import { GeneralService, TesterFunctions } from "test_infra";

export async function NebulaInternalTest(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions) {

    // the 'Data' object passed inside the http request sent to start the test -- put all the data you need here
    const dataObj = request.body.Data;
    const isLocal = request.body.isLocal;
    //setting 'mocha verbs' to use
    const describe = tester.describe;
    const expect = tester.expect;
    const it = tester.it;

    describe('Nebula unit tests', () => {
        const nebulaTestService = NebulaServiceFactory.getNebulaService(generalService, addonService.papiClient, dataObj, isLocal);
        const performanceManager: PerformanceManager = new PerformanceManager();

        it(`run the Nebula unit tests endpoint and make sure everything passed`, async () => {
            performanceManager.startMeasure(`Test 1`, `run the Nebula unit tests endpoint and make sure everything passed`);
            const results: unitTestsResult = await nebulaTestService.runUnitTests();
            expect(results.stats.failures).to.equal(0,
                `The following unit tests failed: ${JSON.stringify(results.tests.filter(test => test.failed === true))}`);
            performanceManager.stopMeasure(`Test 1`);
        })

    });
}