import GeneralService, { TesterFunctions } from "../../potentialQA_SDK/server_side/general.service";
import { SyncTestService } from "./services/sync/services/sync-tests-service";
import { Client } from "@pepperi-addons/debug-server/dist";
import { performance } from "perf_hooks";
import { CommandFactory } from "./services/sync/test-commands/factory/commands-factory";
import { TestCommand } from "./services/sync/test-commands/base-command";

// create ADAL Object

export async function SyncTests(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions) {
    const describe = tester.describe;
    const expect = tester.expect;
    const it = tester.it;
    const dataObj = request.body.Data;

    describe("SyncTests Suites", async () => {
        const client: Client = generalService['client']
        const addonUUID = "5122dc6d-745b-4f46-bb8e-bd25225d350a";
        const syncTestService = new SyncTestService(client)
        const papiClient = addonService.papiClient; 
      
        let tests: Test[] = [
          {
            name: 'BaseSyncTest',
            command: CommandFactory.createCommand('BaseSyncTest', syncTestService)
          },
          {
            name: 'FutureDateCommand',
            command: CommandFactory.createCommand('FutureDateTest', syncTestService)
          },
        ];
      
        for (const test of tests) {
          it(test.name, async () => {
            await test.command.execute(expect);
          });
        }
      
        syncTestService.cleanup();
    });
}

interface Test {
    name: string;
    command: TestCommand;
}