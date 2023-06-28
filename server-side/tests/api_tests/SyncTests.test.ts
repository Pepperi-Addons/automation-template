import { GeneralService, TesterFunctions } from "../../potentialQA_SDK/src/infra_services/general.service";
import { Client } from "@pepperi-addons/debug-server/dist";
import { CommandFactory } from "./services/sync/test-commands/factory/commands-factory";
import { TestCommand } from "./services/sync/test-commands/base-command";
import { SyncAdalService } from "./services/sync/services/sync-adal-service";


// create ADAL Object

export async function SyncTests(generalService: GeneralService, addonService: GeneralService, request, tester: TesterFunctions) {
  const describe = tester.describe;
  const expect = tester.expect;
  const it = tester.it;
  const dataObj = request.body.Data;

  describe("SyncTests Suites", () => {
    const client: Client = generalService['client']
    const addonUUID = "5122dc6d-745b-4f46-bb8e-bd25225d350a";
    const automationUUID = "02754342-e0b5-4300-b728-a94ea5e0e8f4"

    const syncAdalService = new SyncAdalService(client)


    // Note: CleanRebuild and CleanupCommand are not part of the tests
    // just an hack to make sure that nebula will work
    let tests: Test[] = [
      {
        name: 'ResyncCommand',
        command: CommandFactory.createCommand('ResyncCommand', syncAdalService, client)
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
        name: 'PathDataNone',
        command: CommandFactory.createCommand('PathDataNone',syncAdalService,client)
      },
      {
        name: 'PathDataAccount',
        command: CommandFactory.createCommand('PathDataAccount',syncAdalService,client)
      },
      {
        name: 'PathDataUser',
        command: CommandFactory.createCommand('PathDataUser',syncAdalService,client)
      },
      {
        name: 'DeltaTestCommand',
        command: CommandFactory.createCommand('DeltaTestCommand', syncAdalService, client)
      },
      {
        name: 'HundredRecordsCommand',
        command: CommandFactory.createCommand('HundredRecordsCommand', syncAdalService, client)
      },
      {
        name: 'ThousandRecordsCommand',
        command: CommandFactory.createCommand('ThousandRecordsCommand', syncAdalService, client)
      },
      {
        name: 'TenThousandRecordsCommand',
        command: CommandFactory.createCommand('TenThousandRecordsCommand', syncAdalService, client)
      },
      {
        name: 'PushDataCommand',
        command: CommandFactory.createCommand('PushDataCommand', syncAdalService, client)
      },
      {
        name: 'PushBigDataCommand',
        command: CommandFactory.createCommand('PushBigDataCommand', syncAdalService, client)
      },
      {
        name: 'WACDPushDataCommand',
        command: CommandFactory.createCommand('WACDPushDataCommand', syncAdalService, client)
      },
      {
        name: 'RecordSizeHundredCommand',
        command: CommandFactory.createCommand('RecordSizeHundredCommand', syncAdalService, client)
      },
      {
        name: 'RecordSizeThousandCommand',
        command: CommandFactory.createCommand('RecordSizeThousandCommand', syncAdalService, client)
      },
      {
        name: 'RecordSizeTenThousandCommand',
        command: CommandFactory.createCommand('RecordSizeTenThousandCommand', syncAdalService, client)
      },
      {
        name: 'RecordSizeHundredThousandCommand',
        command: CommandFactory.createCommand('RecordSizeHundredThousandCommand', syncAdalService, client)
      },
      {
        name: 'ConnectAccountDelta',
        command: CommandFactory.createCommand('ConnectAccountDelta', syncAdalService, client)
      },
      {
        name: 'WebappCommand',
        command: CommandFactory.createCommand('WebappCommand', syncAdalService, client)
      },
      {
        name: 'PushDataTimeCommand',
        command: CommandFactory.createCommand('PushDataTimeCommand', syncAdalService, client)
      },
      {
        name: 'FilesCommand',
        command: CommandFactory.createCommand('FilesCommand', syncAdalService, client)
      },
      {
        name: 'ContentLengthCommand',
        command: CommandFactory.createCommand('ContentLengthCommand', syncAdalService, client)
      },       
      {
        name: 'SoftLimitCommand',
        command: CommandFactory.createCommand('SoftLimitCommand', syncAdalService, client)
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
