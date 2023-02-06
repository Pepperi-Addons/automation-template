import GeneralService, { TesterFunctions } from "../../potentialQA_SDK/server_side/general.service";
import { Client } from "@pepperi-addons/debug-server/dist";
import { CommandFactory } from "./services/sync/test-commands/factory/commands-factory";
import { TestCommand } from "./services/sync/test-commands/base-command";
import { SyncAdalService } from "./services/sync/services/sync-adal-service";
import { SystemFilterService } from "./services/sync/services/system-filter-service";


// create ADAL Object

export async function SyncTests(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions){
  const describe = tester.describe;
  const expect = tester.expect;
  const it = tester.it;
  const dataObj = request.body.Data;

  describe("SyncTests Suites",() => {
    const client: Client = generalService['client']
    const addonUUID = "5122dc6d-745b-4f46-bb8e-bd25225d350a";

    const syncAdalService = new SyncAdalService(client)
    const papiClient = addonService.papiClient; 
  
    let tests: Test[] = [
      {
        name: 'CleanRebuild',
        command: CommandFactory.createCommand('CleanRebuild', syncAdalService, client)
      },
      {
        name: 'SchemaExistsTest',
        command: CommandFactory.createCommand('SchemaExistsTest', syncAdalService, client)
      },
      {
        name: 'FutureDateCommand',
        command: CommandFactory.createCommand('FutureDateCommand', syncAdalService, client)
      },
      {
        name: 'ReturnURLCommand',
        command: CommandFactory.createCommand('ReturnURLCommand', syncAdalService, client)
      },
      {
        name: 'SystemFilterNone',
        command: CommandFactory.createCommand('SystemFilterNone',syncAdalService,client)
      },
      {
        name: 'SystemFilterAccount',
        command: CommandFactory.createCommand('SystemFilterAccount',syncAdalService,client)
      },
      {
        name: 'CleanupCommand',
        command: CommandFactory.createCommand('CleanupCommand', syncAdalService, client)
      }
    ];
  
    for (const test of tests) {
      it(test.name, async () => {
        await test.command.execute(expect);
      });
    }
  });
}


interface Test {
  name: string;
  command: TestCommand;
}
