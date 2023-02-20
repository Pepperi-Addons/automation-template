import GeneralService, { TesterFunctions } from "../../potentialQA_SDK/server_side/general.service";
import { Client } from "@pepperi-addons/debug-server/dist";
import { CommandFactory } from "./services/sync/test-commands/factory/commands-factory";
import { TestCommand } from "./services/sync/test-commands/base-command";
import { SyncAdalService } from "./services/sync/services/sync-adal-service";
import { ResourceManagerService } from "./services/resource_management/resource_manager.service";


// create ADAL Object

export async function SyncTests(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions){
  const describe = tester.describe;
  const expect = tester.expect;
  const it = tester.it;
  const dataObj = request.body.Data;

  describe("SyncTests Suites",() => {
    const client: Client = generalService['client']
    const addonUUID = "5122dc6d-745b-4f46-bb8e-bd25225d350a";
    const automationUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4"

    const syncAdalService = new SyncAdalService(client)
    const papiClient = addonService.papiClient;
    
  
    // Note: CleanRebuild and CleanupCommand are not part of the tests
    // just an hack to make sure that nebula will work
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
        name: 'WACDCommand',
        command: CommandFactory.createCommand('WACDCommand', syncAdalService, client)
      },
      {
        name: 'PapiConnectAccountCommand',
        command: CommandFactory.createCommand('PapiConnectAccountCommand', syncAdalService, client)
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
        name: 'SystemFilterUser',
        command: CommandFactory.createCommand('SystemFilterUser',syncAdalService,client)
      },
      {
        name: 'DeltaTestCommand',
        command: CommandFactory.createCommand('DeltaTestCommand', syncAdalService, client)
      },
      {
        name: 'ResyncCommand',
        command: CommandFactory.createCommand('ResyncCommand', syncAdalService, client)
      },
      {
        name: 'HundredRecordsCommand',
        command: CommandFactory.createCommand('HundredRecordsCommand', syncAdalService, client, papiClient)
      },
      {
        name: 'ThousandRecordsCommand',
        command: CommandFactory.createCommand('ThousandRecordsCommand', syncAdalService, client, papiClient)
      },
      {
        name: 'TenThousandRecordsCommand',
        command: CommandFactory.createCommand('TenThousandRecordsCommand', syncAdalService, client, papiClient)
      },
      {
        name: 'CleanupCommand',
        command: CommandFactory.createCommand('CleanupCommand', syncAdalService, client, papiClient)
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
